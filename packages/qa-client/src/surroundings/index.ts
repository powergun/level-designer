/**
 * surroundings: the ports the page reaches outside itself, as one value that `bootPage` and the
 * boot watch take, and the one read of the page document's regions by id and tag.
 */
export type {
  ErrorEventLike,
  GpuLike,
  KeyEventLike,
  MouseMoveLike,
  PageCanvas,
  PageConsole,
  PageDocument,
  PageElement,
  PageFetch,
  PageRequestInit,
  PageResponse,
  PageSurroundings,
  PageTextArea,
  PageTimers,
  PageView,
  PageWindow,
  PhysicsStarter,
  RejectionLike,
  ViewStart,
  ViewStarter,
  WatchSurroundings,
} from "./ports.js";
export { readRegions, REGION_IDS, REGION_MIN_HEIGHT, statusRegion } from "./regions.js";
export type { Regions } from "./regions.js";
