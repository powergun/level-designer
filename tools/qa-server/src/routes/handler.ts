import { ROUTES } from "@level-designer/qa-client/protocol";
import type { Answer } from "./answer.js";
import { RequestLog, refuse } from "./answer.js";
import { logAnswer, markAnswer, sessionAnswer } from "./api.js";
import { levelFileAnswer, pageFileAnswer } from "./files.js";
import { foreignHost } from "./host.js";
import type { Session } from "./session.js";

/** Every answer is fresh: a page reloaded after a restart takes the new run's files. */
const NO_STORE = { "cache-control": "no-store" } as const;

/**
 * The path of a request for its run log line. A request whose `Host` breaks the URL, such as
 * one without `Host`, keeps the raw target Bun gives it; the loopback rule refuses it anyway.
 */
function pathOf(request: Request): string {
  return URL.canParse(request.url) ? new URL(request.url).pathname : request.url;
}

/**
 * The body of a POST, or the refusal of a body that never arrived whole, such as one whose
 * connection closed while the page reloaded. That is no defect of the server.
 */
async function bodyOf(request: Request): Promise<{ readonly text: string } | Answer> {
  try {
    return { text: await request.text() };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return refuse("malformed", `$: the request body was not received: ${reason}`);
  }
}

/** The answer of a POST route that takes the body's text. */
async function withBody(request: Request, answer: (text: string) => Answer): Promise<Answer> {
  const body = await bodyOf(request);
  return "text" in body ? answer(body.text) : body;
}

/** The answer of one request that passed the loopback rule, by its method and path. */
function route(
  session: Session,
  request: Request,
  path: string,
  writes: RequestLog,
): Promise<Answer> | Answer {
  const method = request.method;
  if (method === "GET") {
    if (path === ROUTES.session) return sessionAnswer(session);
    if (path.startsWith(ROUTES.levelPrefix)) return levelFileAnswer(session, path);
    const page = pageFileAnswer(session, path);
    if (page !== undefined) return page;
  }
  if (method === "POST" && path === ROUTES.log) {
    return withBody(request, (text) => logAnswer(session, text, writes));
  }
  if (method === "POST" && path === ROUTES.mark) {
    return withBody(request, (text) => markAnswer(session, text));
  }
  return refuse("not-found", `no route ${method} ${path}`);
}

/** The answer of a handler defect: a failure with its message; the stack goes to the run log. */
function defect(error: unknown, writes: RequestLog): Answer {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error && error.stack ? error.stack : message;
  writes.write("server", "error", `defect: ${stack}`);
  return {
    kind: "json",
    status: 500,
    body: { kind: "failed", message },
    level: "error",
    note: `defect: ${message}`,
  };
}

/** The response of an answer, with `logFailure` set on a JSON body. */
function respond(answer: Answer, logFailure: string | null): Response {
  if (answer.kind === "file") {
    const data = typeof answer.data === "string" ? answer.data : new Uint8Array(answer.data);
    return new Response(data, { headers: { ...NO_STORE, "content-type": answer.type } });
  }
  return Response.json(
    { ...answer.body, logFailure },
    { status: answer.status, headers: NO_STORE },
  );
}

/**
 * The server's one request handler. Order: the loopback rule, the route, the body, the answer,
 * the request's run log line, then the response; a JSON answer's `logFailure` says whether this
 * request's run log lines were written. The request never fails because the log failed.
 */
export function createHandler(session: Session): (request: Request) => Promise<Response> {
  return async (request) => {
    const writes = new RequestLog(session.log);
    let path = request.url;
    let answer: Answer;
    try {
      const breach = foreignHost(request.headers);
      path = pathOf(request);
      answer =
        breach === null
          ? await route(session, request, path, writes)
          : refuse("foreign-host", breach);
    } catch (error) {
      answer = defect(error, writes);
    }
    const line =
      answer.kind === "file"
        ? { level: "info" as const, text: `${request.method} ${path} -> 200 ${answer.type}` }
        : {
            level: answer.level,
            text: `${request.method} ${path} -> ${answer.status} ${answer.note}`,
          };
    writes.write("server", line.level, line.text);
    return respond(answer, writes.failure);
  };
}
