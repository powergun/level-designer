/**
 * shape: the admission of untrusted JSON text. It parses a text, walks it with checked reads
 * that record each fault as a problem with its path, owns the id rule and the shared value
 * reads, and returns the typed value only when nothing failed.
 */
export { admitText } from "./admit.js";
export { IdClaims, readId } from "./ids.js";
export { ShapeNode } from "./node.js";
export type { Admission, FormatProblem } from "./problem.js";
export { describeValue, itemPath, keyPath } from "./render.js";
export {
  isSurfaceColor,
  isUnit,
  LENGTH_SLACK,
  readHexColor,
  readLinearRgb,
  readVec3,
} from "./values.js";
export type { LinearRgb, Vec3 } from "./values.js";
