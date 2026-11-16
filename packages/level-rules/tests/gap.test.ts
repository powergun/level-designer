import { expect, test } from "bun:test";
import { judgeLevel } from "@level-designer/level-rules";
import type { TestProp } from "./room.js";
import { BOX_ROOM, expectOne, factsOf, findingsOf, kitProp, room, slab } from "./room.js";

/** The box room's prepared level, open between its spawns. */
const HALL = room(BOX_ROOM);

/** A 1 m high block over the plan rectangle from (x0, z0) to (x1, z1). */
function box(id: string, x0: number, z0: number, x1: number, z1: number): TestProp {
  const at = [(x0 + x1) / 2, (z0 + z1) / 2] as const;
  return { id, at, slabs: [slab([x1 - x0, 1, z1 - z0], [at[0], 0, at[1]])] };
}

/** A `prop-kit` crate of side 1.2 m with its centre at (x, z), yawed by `yaw` degrees. */
function crate(id: string, x: number, z: number, yaw = 0): TestProp {
  return kitProp(HALL, id, "crate", { at: [x, z], yaw }, { size: 1.2, color: "#7a5a3a" });
}

/** The gap findings of a scene in the box room as their messages without the advice. */
async function gaps(props: readonly TestProp[], hall = HALL): Promise<string[]> {
  const findings = await findingsOf(hall, { props }, "gap");
  return findings.map((f) =>
    f.message.replace(/; keep a gap under 0\.7 m or at least 1\.5 m$/, ""),
  );
}

/** A row of `n` touching crates along the direction `yaw` degrees from +x toward -z. */
function row(n: number, yaw: number, skip = -1): TestProp[] {
  const a = (yaw * Math.PI) / 180;
  return Array.from({ length: n }, (_, k) => k)
    .filter((k) => k !== skip)
    .map((k) => crate(`c${k}`, 1.2 * k * Math.cos(a), 5 - 1.2 * k * Math.sin(a), yaw));
}

test("three touching crates in a row pass, also yawed 30 degrees", async () => {
  expect(await gaps(row(3, 0))).toEqual([]);
  expect(await gaps(row(3, 30))).toEqual([]);
});

test("a touching block of 7 x 23 crates passes", async () => {
  const block = Array.from({ length: 7 * 23 }, (_, n) => {
    const [i, k] = [n % 7, Math.floor(n / 7)];
    return crate(`b${i}-${k}`, -3.6 + 1.2 * i, -10.4 + 1.2 * k);
  });
  const judgement = await judgeLevel(factsOf(HALL, { props: block }));
  expect(judgement.findings.filter((f) => f.rule === "gap")).toEqual([]);
});

test("a touching block of 7 x 15 crates passes at yaws 13, 37 and 61 degrees", async () => {
  for (const yaw of [13, 37, 61]) {
    const a = (yaw * Math.PI) / 180;
    const block = Array.from({ length: 7 * 15 }, (_, n) => {
      const [x, z] = [1.2 * ((n % 7) - 3), 1.2 * (Math.floor(n / 7) - 7)];
      return crate(
        `b${n}`,
        x * Math.cos(a) + z * Math.sin(a),
        5 - x * Math.sin(a) + z * Math.cos(a),
        yaw,
      );
    });
    expect(await gaps(block)).toEqual([]);
  }
});

test("chained conveyors pass, also yawed 37 degrees", async () => {
  for (const yaw of [0, 37]) {
    const a = (yaw * Math.PI) / 180;
    const at = (z: number) => [z * Math.sin(a), z * Math.cos(a)] as const;
    const links = [
      [2, 4],
      [4.6, 1.2],
      [7.2, 4],
    ] as const;
    const props = links.map(([z, length], k) =>
      kitProp(HALL, `k${k}`, "conveyor", { at: at(z), yaw }, { length, color: "#3b4046" }),
    );
    expect(await gaps(props)).toEqual([]);
  }
});

test("a row against a wall of two body boxes passes", async () => {
  // The row stands against the first box; the second box starts 1.4 m past the row's end.
  const wall = room({
    ...BOX_ROOM,
    obstacles: [
      { min: [-10, 0, -1], max: [5, 3, 0] },
      { min: [5, 0, -1], max: [10, 3, 0] },
    ],
  });
  const props = [0, 1, 2].map((k) => box(`r${k}`, 1.2 * k, 0, 1.2 * k + 1.2, 1.2));
  expect(await gaps(props, wall)).toEqual([]);
});

test("a 1.0 m pocket between two props fails, also with a third prop in part of it", async () => {
  expect(await gaps([crate("a", 0, 5), crate("b", 2.2, 5)])).toEqual([
    "props a and b stand 1 m apart",
  ]);
  const beside = [
    box("a", -0.3, -0.3, 0.3, 0.3),
    box("b", 1.3, -0.3, 1.9, 0.3),
    box("d", 0.5, 0.34, 1.1, 0.94),
  ];
  expect(await gaps(beside)).toEqual(["props a and b stand 1 m apart"]);
  const corridor = [box("a", 0, -0.3, 4, 0), box("b", 0, 1.4, 4, 1.7), box("d", 0, 0, 0.6, 0.6)];
  expect(await gaps(corridor)).toEqual([
    "props a and b stand 1.4 m apart",
    "props b and d stand 0.8 m apart",
  ]);
});

test("a third prop that leaves 0.70 m free fails with its own pair and 0.69 m passes", async () => {
  const sides = [box("a", 0, -0.3, 4, 0), box("b", 0, 1.4, 4, 1.7)];
  expect(await gaps([...sides, box("d", 0, 0, 4, 0.7)])).toEqual([
    "props b and d stand 0.7 m apart",
  ]);
  expect(await gaps([...sides, box("d", 0, 0, 4, 0.71)])).toEqual([]);
});

test("a corridor that widens from 1.0 m still fails with its narrow end plugged", async () => {
  const a = (5 * Math.PI) / 180;
  const sideA = box("a", 0, -0.3, 6, 0);
  const center = [
    3 * Math.cos(a) - 0.15 * Math.sin(a),
    1 + 0.15 * Math.cos(a) + 3 * Math.sin(a),
  ] as const;
  const sideB: TestProp = {
    id: "b",
    at: center,
    slabs: [slab([6, 1, 0.3], [center[0], 0, center[1]], -5)],
  };
  expect(await gaps([sideA, sideB])).toEqual(["props a and b stand 1 m apart"]);
  const plugged = await gaps([sideA, sideB, box("plug", -0.3, 0.2, 0.3, 0.8)]);
  expect(plugged).toEqual(["props a and b stand 1.0569 m apart"]);
});

test("a yawed row with a crate missing fails, and with it in place passes", async () => {
  expect(await gaps(row(3, 37))).toEqual([]);
  // The yawed slabs lie on the 0.1 mm grid, so the 1.2 m gap measures 0.1 mm short.
  expect(await gaps(row(3, 37, 1))).toEqual(["props c0 and c2 stand 1.1999 m apart"]);
});

test("a yawed crate with its corner 1.0 m from a wall fails, naming the wall's nearest point", async () => {
  const wall = room({ ...BOX_ROOM, obstacles: [{ min: [-10, 0, -1], max: [10, 3, 0] }] });
  const lift = 1 + 0.6 * Math.SQRT2 * Math.cos((15 * Math.PI) / 180);
  const props = [crate("y", 0, lift, 30)];
  expectOne(
    await findingsOf(wall, { props }, "gap"),
    "y",
    "prop y stands 1 m from the static obstacle at (0.2196, 0); keep a gap under 0.7 m or at least 1.5 m",
  );
});
