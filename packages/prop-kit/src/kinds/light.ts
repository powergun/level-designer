import { color, glow, range } from "../admit/index.js";
import { LIGHT_STRIP_DEPTH } from "./dimensions.js";
import { defineKind } from "./kind.js";
import type { Kind } from "./kind.js";

/**
 * A light strip: one glowing metal slab whose underside hangs `height` above the floor, facing
 * down. 1 slab.
 */
export const LIGHT_STRIP: Kind = defineKind(
  "light-strip",
  {
    length: range(0.5, 12),
    width: range(0.1, 0.6, 0.2),
    height: range(2.5, 17),
    color: color(true),
    glow: glow(true),
  },
  (p) => [
    {
      form: "box",
      box: [
        [-p.width / 2, p.width / 2],
        [p.height, p.height + LIGHT_STRIP_DEPTH],
        [-p.length / 2, p.length / 2],
      ],
      facing: "down",
      material: "metal",
      color: p.color,
      glow: p.glow,
    },
  ],
);
