import { expect, test } from "bun:test";
import type { Quaternion, Slab, SlabMaterial, Vec3 } from "@level-designer/level-format";
import { admitSlabs, roundSlab } from "@level-designer/level-format";
import { judgeLevel } from "@level-designer/level-rules";
import { expandProp } from "@level-designer/prop-kit";
import type { TestProp } from "./room.js";
import { BOX_ROOM, factsOf, room } from "./room.js";

/** The four slab materials. */
const MATERIALS: readonly SlabMaterial[] = ["wood", "brick", "concrete", "metal"];

/** The format's side limits and face cap, as the slab admission states them. */
const SIDE = { min: 0.02, max: 40 } as const;
const FACE = 25;

/** A seeded uniform source on [0, 1): mulberry32. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A value from `low` to `high`; with `edge` set, half the draws land on one of the two ends. */
function draw(next: () => number, low: number, high: number, edge: boolean): number {
  if (edge && next() < 0.5) {
    return next() < 0.5 ? low : high;
  }
  return low + next() * (high - low);
}

/** A uniformly random unit quaternion (Shoemake). */
function rotation(next: () => number): Quaternion {
  const [u, v, w] = [next(), next(), next()];
  const a = Math.sqrt(1 - u);
  const b = Math.sqrt(u);
  const [s, c] = [2 * Math.PI * v, 2 * Math.PI * w];
  return [a * Math.sin(s), a * Math.cos(s), b * Math.sin(c), b * Math.cos(c)];
}

/** A length on the format's 0.1 mm grid, rounded down. */
function gridFloor(value: number): number {
  return Math.floor(value * 10_000) / 10_000;
}

/**
 * A slab of the format's admitted sizes at a random pose; `edge` pushes each side to its
 * limits, the height to the largest that keeps the face within its cap on the grid.
 */
function sampleSlab(next: () => number, material: SlabMaterial, edge: boolean): Slab {
  const width = gridFloor(draw(next, SIDE.min, SIDE.max, edge));
  const height = draw(next, SIDE.min, Math.min(SIDE.max, gridFloor(FACE / width)), edge);
  const thickness = draw(next, SIDE.min, SIDE.max, edge);
  const position: Vec3 = [
    draw(next, -50, 50, false),
    draw(next, 0, 20, false),
    draw(next, -50, 50, false),
  ];
  return roundSlab({
    size: [width, height, thickness],
    material,
    color: "#3b4046",
    position,
    rotation: rotation(next),
  });
}

/** 200 sampled slabs, 50 of each material. */
function sample(next: () => number, edge: boolean): Slab[] {
  return Array.from({ length: 50 }).flatMap(() => MATERIALS.map((m) => sampleSlab(next, m, edge)));
}

/** The cap corners of the slab admission, down to a 0.02 m face, in every material. */
function capCorners(): Slab[] {
  const sizes: Vec3[] = [
    [0.02, 0.02, 0.02],
    [0.02, 0.02, 40],
    [40, 0.02, 0.02],
    [0.02, 40, 40],
    [40, 0.625, 0.02],
    [0.625, 40, 40],
    [5, 5, 0.02],
    [5, 5, 40],
  ];
  const turn: Quaternion = [0.27059805, 0.653281482, 0.27059805, 0.653281482];
  return sizes.flatMap((size) =>
    MATERIALS.map((material) =>
      roundSlab({ size, material, color: "#3b4046", position: [1, 9, 1], rotation: turn }),
    ),
  );
}

/** The glow slabs `prop-kit` expands for its longest conveyor, enclosure and light strip. */
function glowSlabs(): Slab[] {
  const kinds = [
    ["conveyor", { length: 12, width: 1.6, height: 1.2 }],
    ["enclosure", { width: 6, length: 8, height: 3.5 }],
    ["light-strip", { length: 12, width: 0.1, height: 17 }],
    ["light-strip", { length: 12, width: 0.6, height: 2.5 }],
  ] as const;
  return kinds.flatMap(([kind, params]) => {
    const all = { ...params, color: "#3b4046", glow: "cyan" };
    const prop = {
      id: "p",
      kind,
      at: [3.1, -7.4] as const,
      yaw: 37.3,
      params: new Map(Object.entries(all)),
    };
    const expansion = expandProp(prop, "props[0]", 0.3241, new Set(["cyan"]));
    if (!expansion.ok) {
      throw new Error(`expected ${kind} to expand`);
    }
    return expansion.slabs.filter((s) => s.glow !== undefined).map((s) => roundSlab(s.slab));
  });
}

/** One prop per slab, so a finding names the slab's prop. */
function propsOf(slabs: readonly Slab[]): TestProp[] {
  return slabs.map((s, i) => ({ id: `s${i}`, at: [s.position[0], s.position[2]], slabs: [s] }));
}

/** Asserts that the slabs pass the slab admission and then the destructibility proof. */
async function expectDestructible(slabs: readonly Slab[]): Promise<void> {
  const props = propsOf(slabs);
  expect(admitSlabs(props)).toEqual([]);
  const judgement = await judgeLevel(factsOf(room(BOX_ROOM), { props }));
  const proof = judgement.findings.filter((f) => f.rule === "destructible" || f.rule === "proxies");
  expect(proof).toEqual([]);
}

test("the proof passes a seeded uniform sample of 200 slabs of every material at random poses", async () => {
  const next = random(20261116);
  await expectDestructible(sample(next, false));
});

test("the proof passes an edge-biased sample of 200 slabs that pushes each side to its limits", async () => {
  const next = random(611);
  await expectDestructible(sample(next, true));
});

test("the proof passes the cap corners down to a 0.02 m face", async () => {
  await expectDestructible(capCorners());
});

test("the proof passes the glow slabs of the longest conveyor, enclosure and light strip", async () => {
  const slabs = glowSlabs();
  expect(slabs.length).toBe(2 + 2 + 1 + 1);
  await expectDestructible(slabs);
});

test("the proof names the first failing step of a slab destruction lib refuses", async () => {
  // A zero-size slab never comes out of the slab admission; it stands in for any slab the
  // shared builder refuses.
  const refused = roundSlab({
    size: [0, 1, 0.05],
    material: "metal",
    color: "#3b4046",
    position: [0, 0, 0],
    rotation: [0, 0, 0, 1],
  });
  const judgement = await judgeLevel(factsOf(room(BOX_ROOM), { props: propsOf([refused]) }));
  const proof = judgement.findings.filter((f) => f.rule === "destructible" || f.rule === "proxies");
  expect(proof).toEqual([
    { rule: "destructible", subject: "s0", message: "prop s0 slab 0: admit failed" },
  ]);
});
