/**
 * qa-client, protocol entry and unit: the JSON protocol the QA page shares with qa-server. It
 * holds the routes, the page and level file names, the limits, the line terminators, the shapes
 * of the session facts, a log batch, a mark and their answers, the server's admissions of request
 * bodies and the page's readers of answers. It depends on nothing, so the server loads no sibling.
 */
export { admitLogBatch, admitMarkRequest, REFUSAL_STATUS, refusal } from "./admit.js";
export type { ShapeRead } from "./json.js";
export {
  readLogAnswer,
  readMarkAnswer,
  readRefusalAnswer,
  readSessionAnswer,
} from "./read.js";
export {
  foldLines,
  LEVEL_FILES,
  levelFileRoute,
  MAX_BATCH_LINES,
  MAX_COMMENT,
  MAX_LINE_TEXT,
  PAGE_FILES,
  ROUTES,
} from "./routes.js";
export type { LevelFileName } from "./routes.js";
export type {
  BuildErrorFact,
  BuildFacts,
  LineLevel,
  LogBatch,
  Logged,
  MarkFailed,
  MarkRequest,
  MarkSaved,
  MoveMode,
  PageLine,
  Point,
  Refusal,
  RefusalReason,
  SessionAnswer,
  SessionFacts,
  Verdict,
} from "./shapes.js";
