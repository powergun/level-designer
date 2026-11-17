import type {
  LevelFileName,
  MarkRequest,
  PageLine,
  SessionAnswer,
} from "@level-designer/qa-client/protocol";
import type { PageFetch } from "@level-designer/qa-client";
import {
  admitLogBatch,
  admitMarkRequest,
  LEVEL_FILES,
  levelFileRoute,
  ROUTES,
} from "@level-designer/qa-client/protocol";

/** One answer of the fake: a status and a body, JSON for an object. */
export interface FakeAnswer {
  readonly status: number;
  readonly body: string | Uint8Array | object;
}

/** A route's script: an answer, or `hold`, which never answers. */
export type FakeScript = FakeAnswer | "hold" | ((body: unknown) => FakeAnswer | "hold");

/** One request the fake received, in arrival order. */
export interface FakeRequest {
  readonly path: string;
  readonly method: string;
  readonly body: unknown;
}

/** The four level files the fake serves by default. */
export type LevelFileBytes = Readonly<Record<LevelFileName, Uint8Array>>;

/** The run the fake's session facts name. */
export const FAKE_RUN = "qa-2026-11-17T12-00-00";

/** The session facts of an accepted built level. */
export function acceptedSession(): SessionAnswer {
  return {
    run: FAKE_RUN,
    runLog: "/work/qa/logs/qa-2026-11-17T12-00-00.log",
    marksFile: "/work/qa/marks.log",
    build: {
      kind: "built",
      name: "dark-factory",
      description: "0123456789ab",
      verdict: { kind: "accepted" },
    },
    logFailure: null,
  };
}

/** A JSON answer with status 200. */
export function ok(body: object): FakeAnswer {
  return { status: 200, body };
}

/**
 * The scripted fake of the protocol: it answers each route by its script, records every request
 * in arrival order, and saves marks with rising numbers by default.
 */
export class ProtocolFake {
  readonly requests: FakeRequest[] = [];
  private readonly scripts = new Map<string, FakeScript>();
  private marks = 0;

  /** A fake that serves the session facts and the four level files. */
  constructor(files: LevelFileBytes, session: SessionAnswer = acceptedSession()) {
    this.scripts.set(ROUTES.session, ok(session));
    for (const name of Object.values(LEVEL_FILES)) {
      this.scripts.set(levelFileRoute(name), { status: 200, body: files[name] });
    }
    this.scripts.set(ROUTES.log, ok({ kind: "logged", logFailure: null }));
    this.scripts.set(ROUTES.mark, () => {
      this.marks += 1;
      return ok({ kind: "saved", mark: this.marks, file: "/work/qa/marks.log", logFailure: null });
    });
  }

  /** Replace the script of one route. */
  script(path: string, script: FakeScript): void {
    this.scripts.set(path, script);
  }

  /** The `fetch` the page calls. */
  readonly fetch: PageFetch = (path, init) => {
    const body: unknown = init.body === undefined ? undefined : JSON.parse(init.body);
    this.requests.push({ path, method: init.method, body });
    const script = this.scripts.get(path) ?? { status: 404, body: "no route" };
    const answer = typeof script === "function" ? script(body) : script;
    if (answer === "hold") return new Promise(() => undefined);
    const bytes = encode(answer.body);
    return Promise.resolve({
      status: answer.status,
      text: () => Promise.resolve(new TextDecoder().decode(bytes)),
      arrayBuffer: () => Promise.resolve(bytes.slice().buffer),
    });
  };

  /** Every page line posted so far, in order. */
  lines(): PageLine[] {
    return this.requests
      .filter((request) => request.path === ROUTES.log)
      .flatMap((request) => {
        const batch = admitLogBatch(request.body, FAKE_RUN);
        if (!batch.ok) throw new Error(`a log batch was refused: ${batch.refusal.message}`);
        return batch.value.lines;
      });
  }

  /** Whether a posted line holds `text`, at `level` when given. */
  logged(text: string, level?: PageLine["level"]): boolean {
    return this.lines().some(
      (line) => line.text.includes(text) && (level === undefined || line.level === level),
    );
  }

  /** The bodies of every mark request. */
  markBodies(): MarkRequest[] {
    return this.requests
      .filter((request) => request.path === ROUTES.mark)
      .map((request) => {
        const mark = admitMarkRequest(request.body, FAKE_RUN);
        if (!mark.ok) throw new Error(`a mark was refused: ${mark.refusal.message}`);
        return mark.value;
      });
  }
}

/** A body as bytes: bytes as they are, text as UTF-8, an object as JSON. */
function encode(body: string | Uint8Array | object): Uint8Array {
  if (body instanceof Uint8Array) return body;
  return new TextEncoder().encode(typeof body === "string" ? body : JSON.stringify(body));
}
