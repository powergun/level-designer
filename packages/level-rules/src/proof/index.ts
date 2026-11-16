/**
 * proof: destruction lib's proof that every slab is destructible. Per slab, a rail trial and a
 * blast trial, each on a fresh model from the shared builder alone in a collision scene at the
 * slab's pose; once per level, one Rapier sync of all slabs builds the debris proxies.
 */
export { destructible, proxies } from "./rules.js";
