/**
 * owner: the owner's checks. The level GLB holds at most 300,000 triangles, no primitive
 * without a material and no image beyond the base stage's; every point light lies inside the
 * interior and above the floor under it.
 */
export { material, texture, TRIANGLE_CAP, triangles } from "./glb.js";
export { lightFloor, lightInside } from "./lights.js";
