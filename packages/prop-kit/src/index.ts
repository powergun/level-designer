/**
 * prop-kit: the prop kinds. Each kind has a parameter table and a generator of slabs in the
 * prop's own frame; the kit admits a prop's kind and parameters, places it, splits long runs
 * to the slab caps, turns panels outward and tags glowing slabs; see
 * @packages/prop-kit/docs/KNOWLEDGE.md.
 */
export type { PropProblem } from "./admit/index.js";
export { expandProp } from "./expand.js";
export type { Expansion, PropSlab } from "./expand.js";
export { listKinds } from "./listing.js";
export type { KindListing, ParamListing } from "./listing.js";
