/**
 * slab-model: the only place where a slab becomes a destruction lib model. One shared builder
 * constructs the model of a slab, and the intact indexed mesh in world space derives from it;
 * see @packages/slab-model/docs/KNOWLEDGE.md.
 */
export { meshSlab } from "./mesh.js";
export { buildSlabModel } from "./model.js";
