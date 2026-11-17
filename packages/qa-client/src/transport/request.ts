import type {
  PageFetch,
  PageRequestInit,
  PageResponse,
  PageTimers,
} from "../surroundings/index.js";

/** How long a request may take before it ends in `no answer`, ms. */
const REQUEST_TIMEOUT_MS = 15_000;

/** What a request needs: `fetch` and the timers of its timeout. */
export interface Transport {
  readonly fetch: PageFetch;
  readonly timers: PageTimers;
}

/** The outcome of one request: its status and body, no answer in time, or a failure. */
export type Reply<T> =
  | { readonly kind: "answered"; readonly status: number; readonly body: T }
  | { readonly kind: "no-answer" }
  | { readonly kind: "failed"; readonly reason: string };

/** The message of a thrown value. */
export function messageOf(thrown: unknown): string {
  if (thrown instanceof Error) return thrown.message;
  return String(thrown);
}

/**
 * Send one request and read its body, within the timeout on the injected timers. `fetch` is
 * called before this function returns, so requests reach the server in call order.
 */
export function request<T>(
  transport: Transport,
  path: string,
  init: Omit<PageRequestInit, "signal">,
  read: (response: PageResponse) => Promise<T>,
): Promise<Reply<T>> {
  const controller = new AbortController();
  return new Promise((resolve) => {
    const handle = transport.timers.setTimeout(() => {
      controller.abort();
      resolve({ kind: "no-answer" });
    }, REQUEST_TIMEOUT_MS);
    const settle = (reply: Reply<T>): void => {
      transport.timers.clearTimeout(handle);
      resolve(reply);
    };
    transport
      .fetch(path, { ...init, signal: controller.signal })
      .then(async (response) => ({ status: response.status, body: await read(response) }))
      .then(
        ({ status, body }) => settle({ kind: "answered", status, body }),
        (thrown: unknown) => settle({ kind: "failed", reason: messageOf(thrown) }),
      );
  });
}

/** Parse a JSON text, or fail with the reason. */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("the answer is not JSON");
  }
}

/** GET a route and parse its JSON answer. */
export function getJson(transport: Transport, path: string): Promise<Reply<unknown>> {
  return request(transport, path, { method: "GET" }, async (response) =>
    parseJson(await response.text()),
  );
}

/** POST one JSON body and parse the JSON answer. */
export function postJson(
  transport: Transport,
  path: string,
  body: unknown,
): Promise<Reply<unknown>> {
  const init = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  } as const;
  return request(transport, path, init, async (response) => parseJson(await response.text()));
}

/** The human-readable end of a reply that did not answer: `no answer`, or the reason. */
export function unanswered(reply: Exclude<Reply<unknown>, { kind: "answered" }>): string {
  return reply.kind === "no-answer" ? "no answer" : reply.reason;
}
