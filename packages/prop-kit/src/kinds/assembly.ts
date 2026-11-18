import { color, glow, material, range } from "../admit/index.js";
import {
  CABINET_WIDTH,
  CONCRETE_PANEL,
  CONVEYOR_STRIP_HEIGHT,
  ENCLOSURE_BAND_BASE,
  ENCLOSURE_BAND_HEIGHT,
  GLOW_DEPTH,
  PANEL,
} from "./dimensions.js";
import { PATHS } from "./finishes.js";
import { glowPair, hollowBox } from "./hollow.js";
import type { BoxFinishes, Shell } from "./hollow.js";
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
    const finishes: BoxFinishes = { top: PATHS.deck, plusX: PATHS.skirt, minusX: PATHS.skirt };
    const deckUnderside = p.height - PANEL;
    const strips =
      p.glow === undefined
        ? []
        : glowPair(shell, [deckUnderside - CONVEYOR_STRIP_HEIGHT, deckUnderside], PATHS.band);
    return { roles: [...hollowBox(shell, finishes), ...strips], glow: p.glow };
  },
);

/**
 * The finish paths of an enclosure. A concrete one is cast concrete; a metal one up to
 * `CABINET_WIDTH` wide is a cabinet on all four walls, and a wider one a machine housing with
 * its plate on the +X side.
 */
function enclosureFinishes(build: "metal" | "concrete", width: number): BoxFinishes {
  if (build === "concrete") {
    const wall = PATHS.concreteWall;
    return { top: PATHS.concreteTop, plusX: wall, minusX: wall, ends: wall };
  }
  if (width <= CABINET_WIDTH) {
    const wall = PATHS.cabinet;
    return { top: PATHS.housingTop, plusX: wall, minusX: wall, ends: wall };
  }
  const wall = PATHS.machine;
  return { top: PATHS.housingTop, plusX: PATHS.machinePlate, minusX: wall, ends: wall };
}

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
    const bands = p.glow === undefined ? [] : glowPair(shell, band, PATHS.band);
    const box = hollowBox(shell, enclosureFinishes(p.material, width));
    return { roles: [...box, ...bands], glow: p.glow };
  },
);
