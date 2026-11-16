import { CONVEYOR, ENCLOSURE } from "./assembly.js";
import type { Kind } from "./kind.js";
import { LIGHT_STRIP } from "./light.js";
import { CONTAINER, CRATE, PARTITION } from "./storage.js";

/** Every prop kind, in the format document's order. */
export const KINDS: readonly Kind[] = [
  CONVEYOR,
  ENCLOSURE,
  CONTAINER,
  CRATE,
  PARTITION,
  LIGHT_STRIP,
];
