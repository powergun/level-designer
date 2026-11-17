import { REFUSAL_STATUS } from "./admit.js";
import {
  countAt,
  type JsonObject,
  listAt,
  nullableStringAt,
  objectAt,
  oneOfAt,
  readShape,
  recordAt,
  type ShapeRead,
  stringAt,
} from "./json.js";
import type {
  BuildErrorFact,
  BuildFacts,
  LogAnswer,
  MarkAnswer,
  Refusal,
  RefusalReason,
  SessionAnswer,
  Verdict,
} from "./shapes.js";

/** Every refusal reason, from the one table that maps each to its HTTP status. */
const REASONS = Object.keys(REFUSAL_STATUS).filter((key): key is RefusalReason =>
  Object.hasOwn(REFUSAL_STATUS, key),
);

/** The verdict of a built level. */
function readVerdict(value: unknown, path: string): Verdict {
  const kind = oneOfAt(objectAt(value, path).kind, `${path}.kind`, [
    "accepted",
    "rejected",
  ] as const);
  if (kind === "accepted") {
    recordAt(value, path, ["kind"]);
    return { kind };
  }
  const record = recordAt(value, path, ["kind", "findings"]);
  return { kind, findings: countAt(record.findings, `${path}.findings`, 1) };
}

/** One build error. */
function readBuildError(value: unknown, path: string): BuildErrorFact {
  const record = recordAt(value, path, ["rule", "path", "message"]);
  return {
    rule: stringAt(record.rule, `${path}.rule`),
    path: stringAt(record.path, `${path}.path`),
    message: stringAt(record.message, `${path}.message`),
  };
}

/** The build outcome: built with name, hash and verdict, or blocked with its errors. */
function readBuild(value: unknown, path: string): BuildFacts {
  const kind = oneOfAt(objectAt(value, path).kind, `${path}.kind`, ["built", "blocked"] as const);
  if (kind === "built") {
    const record = recordAt(value, path, ["kind", "name", "description", "verdict"]);
    return {
      kind,
      name: stringAt(record.name, `${path}.name`),
      description: stringAt(record.description, `${path}.description`),
      verdict: readVerdict(record.verdict, `${path}.verdict`),
    };
  }
  const record = recordAt(value, path, ["kind", "errors"]);
  const errors = listAt(record.errors, `${path}.errors`);
  return { kind, errors: errors.map((error, i) => readBuildError(error, `${path}.errors[${i}]`)) };
}

/** The answer's `logFailure`. */
function logFailureOf(record: JsonObject): string | null {
  return nullableStringAt(record.logFailure, "$.logFailure");
}

/** A refusal answer, once its kind reads `refused`. */
function readRefusal(value: unknown): Refusal & { readonly logFailure: string | null } {
  const record = recordAt(value, "$", ["kind", "reason", "message", "logFailure"]);
  return {
    kind: "refused",
    reason: oneOfAt(record.reason, "$.reason", REASONS),
    message: stringAt(record.message, "$.message"),
    logFailure: logFailureOf(record),
  };
}

/** Read the parsed answer of the session route. */
export function readSessionAnswer(json: unknown): ShapeRead<SessionAnswer> {
  return readShape(() => {
    const record = recordAt(json, "$", ["run", "runLog", "marksFile", "build", "logFailure"]);
    return {
      run: stringAt(record.run, "$.run"),
      runLog: stringAt(record.runLog, "$.runLog"),
      marksFile: stringAt(record.marksFile, "$.marksFile"),
      build: readBuild(record.build, "$.build"),
      logFailure: logFailureOf(record),
    };
  });
}

/** Read the parsed answer of the log route. */
export function readLogAnswer(json: unknown): ShapeRead<LogAnswer> {
  return readShape(() => {
    const kind = oneOfAt(objectAt(json, "$").kind, "$.kind", ["logged", "refused"] as const);
    if (kind === "refused") return readRefusal(json);
    return { kind, logFailure: logFailureOf(recordAt(json, "$", ["kind", "logFailure"])) };
  });
}

/** Read the parsed answer of the mark route. */
export function readMarkAnswer(json: unknown): ShapeRead<MarkAnswer> {
  return readShape(() => {
    const kinds = ["saved", "failed", "refused"] as const;
    const kind = oneOfAt(objectAt(json, "$").kind, "$.kind", kinds);
    if (kind === "refused") return readRefusal(json);
    if (kind === "failed") {
      const record = recordAt(json, "$", ["kind", "message", "logFailure"]);
      return {
        kind,
        message: stringAt(record.message, "$.message"),
        logFailure: logFailureOf(record),
      };
    }
    const record = recordAt(json, "$", ["kind", "mark", "file", "logFailure"]);
    return {
      kind,
      mark: countAt(record.mark, "$.mark", 1),
      file: stringAt(record.file, "$.file"),
      logFailure: logFailureOf(record),
    };
  });
}

/** Read the parsed refusal that a level file route answers with instead of the file. */
export function readRefusalAnswer(
  json: unknown,
): ShapeRead<Refusal & { readonly logFailure: string | null }> {
  return readShape(() => readRefusal(json));
}
