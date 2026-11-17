import type {
  Logged,
  MarkFailed,
  MarkSaved,
  Refusal,
  RefusalReason,
  SessionFacts,
} from "@level-designer/qa-client/protocol";
import { REFUSAL_STATUS, refusal } from "@level-designer/qa-client/protocol";
import type { LineSource, LogLevel, RunLog } from "../run-log/index.js";

/** The body of an API answer before the server adds `logFailure`. */
export type ApiBody = SessionFacts | Logged | MarkSaved | MarkFailed | Refusal;

/**
 * The answer to one request before it is sent: a JSON body with its status, or a file with its
 * content type. `note` ends the request's run log line.
 */
export type Answer =
  | {
      readonly kind: "json";
      readonly status: number;
      readonly body: ApiBody;
      readonly level: LogLevel;
      readonly note: string;
    }
  | { readonly kind: "file"; readonly type: string; readonly data: string | Uint8Array };

/** A JSON answer with status 200 and an `info` request line. */
export function ok(body: ApiBody, note: string): Answer {
  return { kind: "json", status: 200, body, level: "info", note };
}

/** A refusal with its reason, its message and the reason's status. */
export function refuse(reason: RefusalReason, message: string): Answer {
  const status = REFUSAL_STATUS[reason];
  return {
    kind: "json",
    status,
    body: refusal(reason, message),
    level: "warn",
    note: `refused ${reason}: ${message}`,
  };
}

/**
 * The run log writes of one request. Each write goes to the run log at once; the first
 * reason a write failed is the answer's `logFailure`.
 */
export class RequestLog {
  /** The first reason a write of this request failed, or null. */
  private firstFailure: string | null = null;

  /** The writes of one request to `log`. */
  constructor(private readonly log: RunLog) {}

  /** Writes one line and keeps the first failure. */
  write(source: LineSource, level: LogLevel, text: string, time?: Date): void {
    this.firstFailure ??= this.log.write(source, level, text, time);
  }

  /** The answer's `logFailure`: null when every line of this request was written. */
  get failure(): string | null {
    return this.firstFailure;
  }
}
