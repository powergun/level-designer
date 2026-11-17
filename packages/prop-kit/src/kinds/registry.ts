import { ROBOT_ARM } from "./arm.js";
import { CONVEYOR, ENCLOSURE } from "./assembly.js";
import { BRIDGE_CRANE } from "./bridge.js";
import { JIB_CRANE } from "./jib.js";
import type { Kind } from "./kind.js";
import { LIGHT_STRIP } from "./light.js";
import { CONTAINER, CRATE, PARTITION } from "./storage.js";

/** Every prop kind, in the format document's order. */
export const KINDS: readonly Kind[] = [
  CONVEYOR,
  ENCLOSURE,
  ROBOT_ARM,
  CONTAINER,
  CRATE,
  PARTITION,
  BRIDGE_CRANE,
  JIB_CRANE,
  LIGHT_STRIP,
];
