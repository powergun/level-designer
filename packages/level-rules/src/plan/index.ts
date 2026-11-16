/**
 * plan: the geometry the rules read from above. It reads a slab's plan outline as a convex
 * polygon, measures the plan gap between two convex shapes with their nearest points, tells
 * whether convex shapes overlap, and finds the shortest crossing between two outlines whose
 * lane no other shape blocks.
 */
export { freeCrossing } from "./crossing.js";
export { overlapsRect, planGap } from "./distance.js";
export type { PlanGap } from "./distance.js";
export { bounds, outline, rectPolygon } from "./polygon.js";
export type { PlanPoint, PlanRect, Polygon } from "./polygon.js";
