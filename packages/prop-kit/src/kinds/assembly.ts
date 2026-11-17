import { color, glow, material, range } from "../admit/index.js";
import {
  CONCRETE_PANEL,
  CONVEYOR_STRIP_HEIGHT,
  ENCLOSURE_BAND_BASE,
  ENCLOSURE_BAND_HEIGHT,
  GLOW_DEPTH,
  PANEL,
} from "./dimensions.js";
import { glowPair, hollowBox } from "./hollow.js";
import type { Shell } from "./hollow.js";
import { defineKind } from "./kind.js";
import type { Kind } from "./kind.js";

/**
 * A conveyor: a metal deck on two skirts that stand from the floor to the deck's underside,
 * open at both ends; a glow adds one strip under each deck edge, in the eave. 3 or 5 slabs.
 */
export const CONVEYOR: Kind = defineKind(
  "conveyor",
  {
    length: range(1, 12),
    width: range(0.6, 1.6, 0.8),
    height: range(0.6, 1.2, 0.9),
    color: color(true),
    glow: glow(false),
  },
  (p) => {
    const { width, length, height } = p;
    const shell: Shell = {
      width,
      length,
      height,
      panel: PANEL,
      eave: GLOW_DEPTH,
      material: "metal",
      color: p.color,
    };
    const deckUnderside = p.height - PANEL;
    const strips =
      p.glow === undefined
        ? []
        : glowPair(shell, [deckUnderside - CONVEYOR_STRIP_HEIGHT, deckUnderside], p.glow);
    return [...hollowBox(shell, false), ...strips];
  },
);

/**
 * An enclosure: a closed box of four sides under a roof, metal or concrete; a glow adds one
 * metal band on each long side, the +X and -X sides along the length. 5 to 10 slabs.
 */
export const ENCLOSURE: Kind = defineKind(
  "enclosure",
  {
    width: range(1, 6),
    length: range(1, 8),
    height: range(1.5, 3.5, 2.4),
    material: material(["metal", "concrete"], "metal"),
    color: color(true),
    glow: glow(false),
  },
  (p) => {
    const panel = p.material === "concrete" ? CONCRETE_PANEL : PANEL;
    const { width, length, height } = p;
    const shell: Shell = {
      width,
      length,
      height,
      panel,
      eave: GLOW_DEPTH,
      material: p.material,
      color: p.color,
    };
    const band = [ENCLOSURE_BAND_BASE, ENCLOSURE_BAND_BASE + ENCLOSURE_BAND_HEIGHT] as const;
    const bands = p.glow === undefined ? [] : glowPair(shell, band, p.glow);
    return [...hollowBox(shell, true), ...bands];
  },
);
