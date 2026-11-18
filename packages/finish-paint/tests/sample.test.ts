import { expect, test } from "bun:test";
import type { Face, Layer, Pattern } from "@level-designer/level-format";
import { BASE, CENTRED, HALL, coverageAt, layer, len, paintAt } from "./fixtures.ts";

/** A seeded generator of numbers in 0 to 1 (mulberry32), for a repeatable sample. */
function generator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draws from the sample's generator, at one of a range's two ends half of the time. */
class Draw {
  /** Wraps one seeded generator. */
  constructor(private readonly next: () => number) {}

  /** A number in `low` to `high`, at an end half of the time. */
  public range(low: number, high: number): number {
    const pick = this.next();
    if (pick < 0.5) {
      return pick < 0.25 ? low : high;
    }
    return low + this.next() * (high - low);
  }

  /** One of `items`, the first or the last half of the time. */
  public pick<T>(items: readonly T[]): T {
    const index = Math.round(this.range(0, items.length - 1));
    for (const [i, item] of items.entries()) {
      if (i === index) {
        return item;
      }
    }
    throw new Error("a pick needs at least one item");
  }

  /** True half of the time. */
  public coin(): boolean {
    return this.next() < 0.5;
  }
}

/** The faces the sample draws on, singles and groups, `all` among them. */
const FACES: readonly Face[] = ["outside", "inside", "sides", "top", "bottom", "ends", "all"];

/** A random length of one of the three forms: plain, a share of the width, of the height. */
function drawLength(d: Draw, metres: number, factor: number): ReturnType<typeof len> {
  const of = d.pick([undefined, "w", "h"] as const);
  return of === undefined ? len(metres) : len(metres, [of, factor]);
}

/** A random size: positive on any face, as the format admits. */
function drawSize(d: Draw): ReturnType<typeof len> {
  return drawLength(d, d.range(0.001, 4), d.range(0, 0.5));
}

/** A random position: any metres and share, as the format admits. */
function drawSpot(d: Draw): ReturnType<typeof len> {
  return drawLength(d, d.range(-20, 20), d.range(-1, 1));
}

/** A random gap-like length: a size, or 0 as the format also admits. */
function drawGap(d: Draw): ReturnType<typeof len> {
  return d.coin() ? len(0) : drawSize(d);
}

/** A random mark of `cells`, `face`, `disc` or `border`, with every key at its range. */
function drawMark(d: Draw): Pattern {
  const kind = d.pick(["cells", "face", "disc", "border"] as const);
  if (kind === "cells") {
    const fit = d.pick([undefined, "across", "up", "both"] as const);
    const keys = { kind, width: drawSize(d), height: drawSize(d), gap: drawGap(d) };
    return { ...keys, shift: d.range(0, 1), share: d.range(0, 1), ...(fit ? { fit } : {}) };
  }
  if (kind === "disc") {
    const at = [drawSpot(d), drawSpot(d)] as const;
    return { kind, at, radius: drawSize(d), inner: drawGap(d), diamond: d.coin() };
  }
  if (kind === "border") {
    const width = { ends: drawSize(d), top: drawSize(d), base: drawSize(d) };
    return { kind, width, inset: drawGap(d) };
  }
  return { kind };
}

/** A random pattern of one of the eight kinds, with every key at its range. */
function drawPattern(d: Draw): Pattern {
  const kind = d.pick(["bands", "rectangle", "dots", "noise", "mark"] as const);
  if (kind === "mark") {
    return drawMark(d);
  }
  if (kind === "bands") {
    const [period, width, ramp] = [drawSize(d), drawSize(d), drawSize(d)];
    const keys = { kind, period, width, phase: d.range(0, 1), offset: drawSpot(d), ramp };
    const along = d.pick(["across", "up", "diagonal"] as const);
    return along === "diagonal" ? { ...keys, along } : { ...keys, along, fit: d.coin() };
  }
  if (kind === "rectangle") {
    return { kind, from: [drawSpot(d), drawSpot(d)], to: [drawSpot(d), drawSpot(d)] };
  }
  if (kind === "dots") {
    const fit = d.pick(["across", "up", "both"] as const);
    const phase = [d.range(0, 1), d.range(0, 1)] as const;
    const pitch = [drawSize(d), drawSize(d)] as const;
    return { kind, pitch, radius: drawSize(d), phase, offset: [drawSpot(d), drawSpot(d)], fit };
  }
  const mask = { threshold: d.range(0, 1), softness: d.range(0.01, 1) };
  return { kind, wavelength: [drawSize(d), drawSize(d)], ...(d.coin() ? { mask } : {}) };
}

/** A random layer with every common key and effect at its range. */
function drawLayer(d: Draw): Layer {
  const effects = {
    shade: d.range(0, 4),
    paint: d.range(0, 4),
    color: d.pick(["#000000", "#ffffff", "glow", "#7a3b10"]),
    metalness: d.range(0, 1),
    roughness: d.range(0, 1),
    lit: d.range(0, 1),
  };
  const pattern = drawPattern(d);
  const jitter = { low: d.range(0, 4), high: d.range(0, 4) };
  // The format admits `jitter` on `cells` alone, and no `across` or `up` on a border.
  const cells = pattern.kind === "cells" ? { jitter } : {};
  const framed = pattern.kind !== "border";
  return layer(
    pattern,
    { ...effects, ...cells },
    {
      on: d.pick(FACES),
      across: framed ? d.pick([undefined, "ends", "out"] as const) : undefined,
      up: framed ? d.pick([undefined, "top"] as const) : undefined,
      detail: d.pick([undefined, "medium", "fine"] as const),
      wear: d.coin(),
      amount: d.range(0, 1),
    },
  );
}

/** True when every value lies in 0 to 1. */
function inUnit(values: readonly number[]): boolean {
  return values.every((v) => v >= 0 && v <= 1);
}

test("a seeded, edge-biased sample keeps every coverage and shade in range", () => {
  const d = new Draw(generator(20261118));
  for (let i = 0; i < 1500; i += 1) {
    const layers = Array.from({ length: Math.round(d.range(1, 24)) }, () => drawLayer(d));
    const face = {
      ...d.pick([CENTRED, HALL]),
      faceClass: Math.round(d.range(0, 5)),
      seed: Math.round(d.range(0, 4095)),
      wear: d.range(0, 1),
    };
    const footprint = d.range(0.0001, 1);
    const inside = {
      ...face,
      x: face.low[0] + d.range(0, 1) * face.size[0],
      y: face.low[1] + d.range(0, 1) * face.size[1],
    };
    const shade = paintAt(layers, inside, BASE, footprint);
    const values = [...shade.albedo, shade.metalness, shade.roughness, shade.emission];
    const far = { ...face, x: d.range(-150, 150), y: d.range(-150, 150) };
    const coverages = layers.map((l) => coverageAt(l.pattern, l, far, footprint));
    expect({ i, shade: inUnit(values), coverage: inUnit(coverages) }).toEqual({
      i,
      shade: true,
      coverage: true,
    });
  }
});
