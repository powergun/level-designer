import type { BuildFacts, SessionFacts } from "@level-designer/qa-client/protocol";
import { admitLogBatch, admitMarkRequest } from "@level-designer/qa-client/protocol";
import { localTime } from "../run-log/index.js";
import type { LevelState } from "../start/index.js";
import type { Answer, RequestLog } from "./answer.js";
import { ok, refuse } from "./answer.js";
import type { Session } from "./session.js";

/** The build outcome of the session facts: name, hash and verdict, or the errors alone. */
function buildFacts(level: LevelState): BuildFacts {
  if (level.kind === "blocked") {
    const errors = level.errors.map(({ rule, path, message }) => ({ rule, path, message }));
    return { kind: "blocked", errors };
  }
  const { built, report } = level;
  const verdict = report.accepted
    ? ({ kind: "accepted" } as const)
    : ({ kind: "rejected", findings: report.findings.length } as const);
  return { kind: "built", name: built.description.name, description: built.hash, verdict };
}

/** The session facts: the run, its run log and marks file, and the build outcome. */
export function sessionAnswer(session: Session): Answer {
  const facts: SessionFacts = {
    run: session.log.name,
    runLog: session.log.path,
    marksFile: session.marks.path,
    build: buildFacts(session.level),
  };
  return ok(facts, "session facts");
}

/** A body's JSON value, or the refusal of text that is not JSON. */
function parseBody(text: string): { readonly ok: true; readonly value: unknown } | Answer {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return refuse(
      "malformed",
      `$: the body is not JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/** Takes one log batch: each page line goes to the run log at the page's time. */
export function logAnswer(session: Session, text: string, writes: RequestLog): Answer {
  const parsed = parseBody(text);
  if (!("ok" in parsed)) return parsed;
  const admitted = admitLogBatch(parsed.value, session.log.name);
  if (!admitted.ok) return refuse(admitted.refusal.reason, admitted.refusal.message);
  for (const line of admitted.value.lines) {
    writes.write("page", line.level, line.text, new Date(line.time));
  }
  return ok({ kind: "logged" }, `logged ${admitted.value.lines.length} lines`);
}

/**
 * Takes one mark: refuses it when its body breaks the protocol, another run's first, so an old
 * page always hears `reload the page`; refuses it while the build is blocked; else appends
 * exactly one line or reports exactly one failure. No `await` runs between the admission and
 * the append, so two marks never share a number.
 */
export function markAnswer(session: Session, text: string): Answer {
  const parsed = parseBody(text);
  if (!("ok" in parsed)) return parsed;
  const admitted = admitMarkRequest(parsed.value, session.log.name);
  if (!admitted.ok) return refuse(admitted.refusal.reason, admitted.refusal.message);
  if (session.level.kind === "blocked") {
    return refuse("no-level", "no level is built: the build is blocked");
  }
  const { built } = session.level;
  const level = { name: built.description.name, hash: built.hash };
  const appended = session.marks.append(admitted.value, level, localTime(session.now()));
  if (!appended.ok) {
    const body = { kind: "failed", message: appended.reason } as const;
    return {
      kind: "json",
      status: 500,
      body,
      level: "error",
      note: `mark failed: ${appended.reason}`,
    };
  }
  const body = { kind: "saved", mark: appended.mark, file: session.marks.path } as const;
  return ok(body, `mark ${appended.mark} saved to ${session.marks.path}`);
}
