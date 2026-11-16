/**
 * render: draws world triangles into one tile on the CPU. A view clips the triangles to its
 * half-spaces and projects them orthographically or through a pinhole lens; each surface is
 * flat-shaded by the one fixed light, depth tested, outlined where depth jumps, and a cut
 * plane's trace is drawn in black.
 */
export { renderTile } from "./tile.js";
export type { Vec3 } from "./vector.js";
export { perspectiveView, pixelOf } from "./view.js";
export type { Frame, HalfSpace, Lens, TileSize, View } from "./view.js";
