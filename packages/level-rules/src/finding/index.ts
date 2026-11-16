/**
 * finding: the shape of a finding with its rule id, the wording of counts and points
 * in a message, and the slack comparisons that every length limit of the rules uses.
 */
export type { Finding } from "./finding.js";
export { over, under } from "./limits.js";
export { count, point } from "./wording.js";
