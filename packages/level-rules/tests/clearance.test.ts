import { expect, test } from "bun:test";
import { judgeLevel } from "@level-designer/level-rules";
import type { TestProp } from "./room.js";
import {
  BOX_ROOM,
  block,
  corridor,
  expectOne,
  factsOf,
  findingsOf,
  kitProp,
  room,
  slab,
} from "./room.js";

/** The box room's prepared level, open between its spawns. */
const HALL = room(BOX_ROOM);

/** A 1 m cube standing on the base floor with its centre at (x, 5). */
function cube(id: string, x: number): TestProp {
  return block(id, [1, 1, 1], [x, 5], 0);
}

/** A wall across a corridor from its -x side at `fromX` to `toX`, 0.1 m thick at z 0. */
function across(fromX: number, toX: number): TestProp {
  return block("wall", [toX - fromX, 2, 0.1], [(fromX + toX) / 2, 0], 0);
}

/**
 * A hollow prop of 0.05 m walls, 2.17 m high, under a 4 x 4 m roof whose underside is at
 * 2.17 m, centred on the origin and yawed by `yaw` degrees.
 */
function ring(yaw: number): TestProp {
  const walls = [0, 90, 180, 270].map((turn) => {
    const a = ((yaw + turn) * Math.PI) / 180;
    const out = 2 - 0.025;
    return slab([4, 2.17, 0.05], [out * Math.sin(a), 0, out * Math.cos(a)], yaw + turn);
  });
  return { id: "ring", at: [0, 0], slabs: [...walls, slab([4, 0.05, 4], [0, 2.17, 0], yaw)] };
}

test("gap passes 0.69 m and 1.5 m, fails 0.7 m and 1.49 m, and allows touching", async () => {
  for (const x of [1, 1.69, 2.5]) {
    expect(await findingsOf(HALL, { props: [cube("a", 0), cube("b", x)] }, "gap")).toEqual([]);
  }
  for (const [x, gap] of [
    [1.7, "0.7"],
    [2.49, "1.49"],
  ] as const) {
    expectOne(
      await findingsOf(HALL, { props: [cube("a", 0), cube("b", x)] }, "gap"),
      "a",
      `props a and b stand ${gap} m apart; keep a gap under 0.7 m or at least 1.5 m`,
    );
  }
});

test("props typed 1.5 m apart, at -0.8 and -2.3, pass gap", async () => {
  // Faces typed at -0.8 and -2.3 lie 1.4999999999999998 m apart in floats; the slack passes it.
  expect(await findingsOf(HALL, { props: [cube("near", -0.3), cube("far", -2.8)] }, "gap")).toEqual(
    [],
  );
  // Two 0.3 m partitions yawed across x: one spans x -0.8 to -0.5, the other -2.6 to -2.3.
  const params = { width: 2, height: 2, color: "#555555" };
  const near = kitProp(HALL, "near", "partition", { at: [-0.65, 5], yaw: 90 }, params);
  const far = kitProp(HALL, "far", "partition", { at: [-2.45, 5], yaw: 90 }, params);
  expect(await findingsOf(HALL, { props: [near, far] }, "gap")).toEqual([]);
});

test("two tall enclosures typed 0.68 m apart measure 0.74 m and fail gap", async () => {
  // Without a glow each long side stands the 0.03 m eave inside the roof's edge.
  const params = { width: 2, length: 3, color: "#3b4046" };
  const left = kitProp(HALL, "left", "enclosure", { at: [0, 5], yaw: 0 }, params);
  const right = kitProp(HALL, "right", "enclosure", { at: [2.68, 5], yaw: 0 }, params);
  expectOne(
    await findingsOf(HALL, { props: [left, right] }, "gap"),
    "left",
    "props left and right stand 0.74 m apart; keep a gap under 0.7 m or at least 1.5 m",
  );
});

test("gap holds against a static standing obstacle and names its nearest point", async () => {
  const props = [block("a", [1, 1, 1], [5.1, 2.3], 0)];
  const standing = room({ ...BOX_ROOM, obstacles: [{ min: [3, 0, 0], max: [4, 3, 1] }] });
  expectOne(
    await findingsOf(standing, { props }, "gap"),
    "a",
    "prop a stands 1 m from the static obstacle at (4, 1); keep a gap under 0.7 m or at least 1.5 m",
  );
  const hanging = room({ ...BOX_ROOM, obstacles: [{ min: [3, 2.17, 0], max: [4, 3, 1] }] });
  expect(await findingsOf(hanging, { props }, "gap")).toEqual([]);
});

test("spawn passes a footprint 6 m from the player spawn and fails 0.1 mm nearer", async () => {
  // The player spawns at (0, 17); the cube's +z face is at z 11.
  expect(await findingsOf(HALL, { props: [block("a", [1, 1, 1], [0, 10.5], 0)] }, "spawn")).toEqual(
    [],
  );
  expectOne(
    await findingsOf(HALL, { props: [block("a", [1, 1, 1], [0, 10.5001], 0)] }, "spawn"),
    "a",
    "prop a stands 5.9999 m from the player spawn; keep 6 m",
  );
});

test("a corridor of exactly 3.0 m measures 3.0 m", async () => {
  const judgement = await judgeLevel(factsOf(room(corridor(3))));
  expect(judgement.lanes).toHaveLength(4);
  for (const l of judgement.lanes) {
    expect(l.width).toBeCloseTo(3, 9);
    expect(l.keeps).toBeCloseTo(3, 9);
  }
  expect(judgement.findings.filter((f) => f.rule === "lane")).toEqual([]);
});

test("lane keeps 3 m with the dressing: a 3.0 m opening passes and a 2.8 m one fails", async () => {
  const hall = room(corridor(6));
  expect(await findingsOf(hall, { props: [across(-3, 0)] }, "lane")).toEqual([]);
  const judgement = await judgeLevel(factsOf(hall, { props: [across(-3, 0.2)] }));
  const lanes = judgement.findings.filter((f) => f.rule === "lane");
  expect(lanes.map((f) => f.subject)).toEqual(["+x+z", "-x+z", "+x-z", "-x-z"]);
  expect(judgement.lanes.map((l) => l.width).every((w) => Math.abs(w - 2.8) < 1e-9)).toBe(true);
  const [first] = lanes;
  expect(first?.message).toMatch(
    /^the main lane from the \+x\+z minion spawn narrows to 2\.8 m near \(/,
  );
  expect(first?.message).toMatch(/\); it needs 3 m$/);
  // The narrowest cell lies in the 2.8 m opening beside the wall.
  const [x, z] = (first?.message.match(/near \((.+), (.+)\)/) ?? []).slice(1).map(Number);
  expect(x).toBeGreaterThan(0.2);
  expect(Math.abs(z ?? Infinity)).toBeLessThan(0.2);
});

test("lane keeps the static width where the static scene is narrower than 3 m", async () => {
  const hall = room(corridor(2));
  expect(await findingsOf(hall, {}, "lane")).toEqual([]);
  const findings = await findingsOf(hall, { props: [across(-1, -0.8)] }, "lane");
  expect(findings).toHaveLength(4);
  expect(findings[0]?.message).toMatch(/narrows to 1\.8 m near \(.+\); it needs 2 m$/);
});

test("a ring of 0.05 m walls under a roof at 2.17 m, across a lane at an odd yaw, fails lane", async () => {
  const findings = await findingsOf(room(corridor(3)), { props: [ring(23)] }, "lane");
  expect(findings.map((f) => f.subject)).toEqual(["+x+z", "-x+z", "+x-z", "-x-z"]);
  expect(findings[0]?.message).toBe(
    "the main lane from the +x+z minion spawn narrows to 0 m near (0.05, -25.05); it needs 3 m",
  );
});
