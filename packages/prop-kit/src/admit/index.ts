/**
 * admit: the admission of a prop's kind and parameters at the kit's boundary. It owns the
 * parameter specs, the reading of the untrusted `params` map into a kind's typed parameter
 * value, and the `kind` and `param` problems with their paths and messages.
 */
export { admitParams } from "./params.js";
export type { ParamContext } from "./params.js";
export { unknownKind } from "./problem.js";
export type { PropProblem } from "./problem.js";
export { COLOR, glow, material, range } from "./spec.js";
export type { ColorSpec, ParamSpec, ParamTable, ParamValues } from "./spec.js";
