import { describe, expect, test } from "bun:test";
import { numberArithmetic as a } from "@level-designer/finish-paint";
import type { CellsPattern, Effects, Pattern } from "@level-designer/level-format";
import { BASE, CENTRED, HALL, coverageAt, layer, len, paintAt } from "./fixtures.ts";

/** Places of this file: one footprint is 1 mm, so three decimals hold. */
const PLACES = 3;

/** Cells of 0.3 x 0.2 m with gaps of 0.1 m: a pitch of 0.4 x 0.3 m, a gap on x = 0. */
const GRID: CellsPattern = {
  kind: "cells",
  width: len(0.3),
  height: len(0.2),
  gap: len(0.1),
  shift: 0,
  share: 0,
};

/** A layer's coverage at `(x, y)` of the centred 2 x 1.2 m face. */
function centredAt(pattern: Pattern, x: number, y: number): number {
  return coverageAt(pattern, {}, { ...CENTRED, x, y });
}

/** The red albedo of one cells layer of `effects` at `(x, y)` of the centred face. */
function redAt(pattern: Pattern, effects: Effects, x: number, y: number, amount = 1): number {
  return paintAt([layer(pattern, effects, { amount })], { ...CENTRED, x, y }).albedo[0];
}

describe("the painter's wiring of cells", () => {
  test("a cell's pitch is its size plus the gap, with a gap on the origin", () => {
    expect(centredAt(GRID, 0, 0.15)).toBeCloseTo(1, PLACES);
    expect(centredAt(GRID, 0.4, 0.15)).toBeCloseTo(1, PLACES);
    expect(centredAt(GRID, 0.2, 0.3)).toBeCloseTo(1, PLACES);
    expect(centredAt(GRID, 0.2, 0.15)).toBeCloseTo(0, PLACES);
    expect(centredAt(GRID, 0.3, 0.15)).toBeCloseTo(0, PLACES);
  });

  test("a fit across fits the pitch to the face from its low end", () => {
    // 2 m over a pitch of 0.45 m rounds to 4 cells of 0.5 m: gaps at -1, -0.5, 0, 0.5, 1.
    const fitted: Pattern = { ...GRID, width: len(0.35), fit: "across" };
    expect(centredAt(fitted, -0.5, 0.15)).toBeCloseTo(1, PLACES);
    expect(centredAt(fitted, 0.5, 0.15)).toBeCloseTo(1, PLACES);
    expect(centredAt(fitted, -0.75, 0.15)).toBeCloseTo(0, PLACES);
    expect(centredAt({ ...fitted, fit: undefined }, -0.5, 0.15)).toBeLessThan(0.6);
  });

  test("shift moves the next row and share covers cells whole", () => {
    const bond: Pattern = { ...GRID, shift: 0.5 };
    expect(centredAt(bond, 0.2, 0.45)).toBeCloseTo(1, PLACES);
    expect(centredAt(bond, 0, 0.45)).toBeCloseTo(0, PLACES);
    expect(centredAt({ ...GRID, share: 1 }, 0.2, 0.15)).toBeCloseTo(1, PLACES);
  });

  test("jitter scales a cell's albedo by its tone and leaves the gaps", () => {
    // The cell at (0.2, 0.15) is cell (0, 0); its tone is the hash of that cell and the seed.
    const factor = 0.5 + a.hash(0, 0, CENTRED.seed);
    const jitter = { jitter: { low: 0.5, high: 1.5 } };
    const base = BASE.albedo[0];
    expect(redAt(GRID, jitter, 0.2, 0.15)).toBeCloseTo(base * factor, 5);
    expect(redAt(GRID, jitter, 0.2, 0.15, 0.5)).toBeCloseTo(base * (1 + (factor - 1) / 2), 5);
    expect(redAt(GRID, jitter, 0.2, 0.15, 0)).toBeCloseTo(base, 5);
    expect(redAt(GRID, jitter, 0, 0.15)).toBeCloseTo(base, 5);
  });

  test("jitter mixes after the other effects of its layer", () => {
    const whole: Pattern = { ...GRID, share: 1 };
    expect(redAt(whole, { color: "#ffffff", jitter: { low: 0.5, high: 0.5 } }, 0.2, 0.15)).toBe(
      0.5,
    );
  });
});

describe("the painter's wiring of face, disc and border", () => {
  test("face covers the whole face, inside its clip and on its faces", () => {
    const face: Pattern = { kind: "face" };
    expect(centredAt(face, -1, 0)).toBe(1);
    expect(centredAt(face, 0.9, 1.1)).toBe(1);
    const clip = { from: [len(0), len(0)], to: [len(1), len(1.2)] } as const;
    expect(coverageAt(face, { clip }, { ...CENTRED, x: -0.5, y: 0.5 })).toBeCloseTo(0, PLACES);
    expect(coverageAt(face, { clip }, { ...CENTRED, x: 0.5, y: 0.5 })).toBeCloseTo(1, PLACES);
    expect(coverageAt(face, {}, { ...CENTRED, faceClass: 1 })).toBe(0);
  });

  test("a disc takes shares, a ring its inner radius and a diamond its sum", () => {
    // Centre (0.25w, 0.6) = (0.5, 0.6); radius 0.1h = 0.12 m.
    const round: Pattern = {
      kind: "disc",
      at: [len(0, ["w", 0.25]), len(0.6)],
      radius: len(0, ["h", 0.1]),
      inner: len(0),
      diamond: false,
    };
    expect(centredAt(round, 0.5, 0.6)).toBeCloseTo(1, PLACES);
    expect(centredAt(round, 0.62, 0.6)).toBeCloseTo(0.5, PLACES);
    expect(centredAt(round, 0.58, 0.68)).toBeCloseTo(1, PLACES);
    expect(centredAt({ ...round, inner: len(0.05) }, 0.5, 0.6)).toBeCloseTo(0, PLACES);
    expect(centredAt({ ...round, inner: len(0.05) }, 0.55, 0.6)).toBeCloseTo(0.5, PLACES);
    expect(centredAt({ ...round, diamond: true }, 0.58, 0.68)).toBeCloseTo(0, PLACES);
    expect(centredAt({ ...round, diamond: true }, 0.56, 0.66)).toBeCloseTo(0.5, PLACES);
  });

  test("a border follows the face's outline, each width and its inset", () => {
    // Outline -1..1 by 0..1.2; inset 0.05; ends 0.1, top 0.2, base 0.05w = 0.1 m.
    const frame: Pattern = {
      kind: "border",
      width: { ends: len(0.1), top: len(0.2), base: len(0, ["w", 0.05]) },
      inset: len(0.05),
    };
    expect(centredAt(frame, -0.9, 0.6)).toBeCloseTo(1, PLACES);
    expect(centredAt(frame, -0.97, 0.6)).toBeCloseTo(0, PLACES);
    expect(centredAt(frame, -0.95, 0.6)).toBeCloseTo(0.5, PLACES);
    expect(centredAt(frame, -0.85, 0.6)).toBeCloseTo(0.5, PLACES);
    expect(centredAt(frame, 0, 1.05)).toBeCloseTo(1, PLACES);
    expect(centredAt(frame, 0, 0.94)).toBeCloseTo(0, PLACES);
    expect(centredAt(frame, 0, 0.14)).toBeCloseTo(1, PLACES);
    expect(centredAt(frame, 0, 0.16)).toBeCloseTo(0, PLACES);
    expect(centredAt(frame, 0, 0.6)).toBeCloseTo(0, PLACES);
    // A hall wall's outline starts at its low corner (10, -3).
    expect(coverageAt(frame, {}, { ...HALL, x: 10.1, y: 1 })).toBeCloseTo(1, PLACES);
    expect(coverageAt(frame, {}, { ...HALL, x: 10.02, y: 1 })).toBeCloseTo(0, PLACES);
  });
});
