/**
 * paint: the painters of the level view. It holds the node back end of `finish-paint`'s
 * arithmetic, the static material class, the painted twin of each slab and box material whose
 * `extras` name a finish path, and the stage wrap of each stage material that names a hall
 * finish, drawn from the level's finish table; see @packages/level-view/docs/KNOWLEDGE.md.
 */
export { paintLevel } from "./twins.js";
