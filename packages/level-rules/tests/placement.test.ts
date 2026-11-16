import { expect, test } from "bun:test";
import type { Seal, Vec3 } from "@level-designer/level-format";
import type { TestProp } from "./room.js";
import { BOX_ROOM, block, expectOne, findingsOf, room, slab } from "./room.js";

/** The box room's prepared level: base floor 0, step floor 0.15 m, raised slab 0.3 m. */
const HALL = room(BOX_ROOM);

/** A prop of one upright slab whose base centre stands at `position`, its `at` beneath it. */
function placed(id: string, size: Vec3, position: Vec3, yaw = 0): TestProp {
  return { id, at: [position[0], position[2]], slabs: [slab(size, position, yaw)] };
}

/** A grey seal box across the +z end of the box room, from `minZ` to 21. */
function endSeal(minZ: number): Seal {
  return {
    id: "end",
    min: [-11, -1, minZ],
    max: [11, 11, 21],
    color: "#202020",
    metalness: 0,
    roughness: 1,
  };
}

test("interior passes a slab on the interior's edge and names the corner 0.1 mm beyond it", async () => {
  expect(
    await findingsOf(HALL, { props: [block("edge", [1, 1, 1], [9.5, 5], 0)] }, "interior"),
  ).toEqual([]);
  expectOne(
    await findingsOf(HALL, { props: [block("edge", [1, 1, 1], [9.5001, 5], 0)] }, "interior"),
    "edge",
    "prop edge slab 0 leaves the interior by 0.0001 m at (10.0001, 0, 4.5)",
  );
});

test("support stands a prop within 0.01 m of its floor and fails 0.1 mm higher", async () => {
  expect(
    await findingsOf(HALL, { props: [placed("lifted", [1, 1, 1], [0, 0.01, 5])] }, "support"),
  ).toEqual([]);
  expectOne(
    await findingsOf(HALL, { props: [placed("lifted", [1, 1, 1], [0, 0.0101, 5])] }, "support"),
    "lifted",
    "prop lifted neither stands nor hangs: its lowest point is 0.0101 m above the floor; stand it on the floor or hang it at 2.17 m or higher",
  );
});

test("support hangs a prop at 2.17 m and fails it at 2.16 m", async () => {
  expect(
    await findingsOf(HALL, { props: [placed("beam", [4, 0.2, 0.2], [0, 2.17, 5])] }, "support"),
  ).toEqual([]);
  expectOne(
    await findingsOf(HALL, { props: [placed("beam", [4, 0.2, 0.2], [0, 2.16, 5])] }, "support"),
    "beam",
    "prop beam neither stands nor hangs: its lowest point is 2.16 m above the floor; stand it on the floor or hang it at 2.17 m or higher",
  );
});

test("support measures a hanging prop from the highest floor under its slabs", async () => {
  // A beam along z over the raised slab's edge: 2.17 m above the base floor under `at` is
  // only 1.87 m above the raised slab under its -z end.
  const low = placed("beam", [0.2, 0.2, 5], [0, 2.17, -10.5]);
  expectOne(
    await findingsOf(HALL, { props: [low] }, "support"),
    "beam",
    "prop beam neither stands nor hangs: its lowest point is 1.87 m above the floor; stand it on the floor or hang it at 2.17 m or higher",
  );
  const high = placed("beam", [0.2, 0.2, 5], [0, 2.47, -10.5]);
  expect(await findingsOf(HALL, { props: [high] }, "support")).toEqual([]);
});

test("floor and ramp pass a prop touching the step floor's edge and fail it 0.1 mm onto the step", async () => {
  const touching = { props: [placed("crate", [1, 1, 2], [0, 0, -10])] };
  expect(await findingsOf(HALL, touching, "floor")).toEqual([]);
  expect(await findingsOf(HALL, touching, "ramp")).toEqual([]);
  const onStep = { props: [placed("crate", [1, 1, 2], [0, 0, -10.0001])] };
  expectOne(
    await findingsOf(HALL, onStep, "floor"),
    "crate",
    "prop crate spans the floor levels 0 and 0.15; keep a standing prop on one level",
  );
  expectOne(
    await findingsOf(HALL, onStep, "ramp"),
    "crate",
    "prop crate stands on the ramp, z -12 to -11",
  );
});

test("floor and ramp leave a hanging prop over the ramp alone", async () => {
  const over = { props: [placed("crane", [0.2, 0.2, 6], [0, 3, -11])] };
  expect(await findingsOf(HALL, over, "floor")).toEqual([]);
  expect(await findingsOf(HALL, over, "ramp")).toEqual([]);
  expect(await findingsOf(HALL, over, "support")).toEqual([]);
});

test("low-top passes a 0.5 m top and fails a 0.49 m top, read from the floor under at", async () => {
  expect(
    await findingsOf(HALL, { props: [block("low", [1, 0.5, 1], [0, 5], 0)] }, "low-top"),
  ).toEqual([]);
  expect(
    await findingsOf(HALL, { props: [block("low", [1, 0.5, 1], [0, -15], 0.3)] }, "low-top"),
  ).toEqual([]);
  expectOne(
    await findingsOf(HALL, { props: [block("low", [1, 0.49, 1], [0, 5], 0)] }, "low-top"),
    "low",
    "prop low slab 0 tops out 0.49 m above the floor; a standing slab reaches 0.5 m or higher",
  );
});

test("overlap passes 1 mm of contact and fails 1.1 mm, naming the first prop", async () => {
  const a = block("a", [1, 1, 1], [0, 5], 0);
  expect(
    await findingsOf(HALL, { props: [a, block("b", [1, 1, 1], [0.999, 5], 0)] }, "overlap"),
  ).toEqual([]);
  expectOne(
    await findingsOf(HALL, { props: [a, block("b", [1, 1, 1], [0.9989, 5], 0)] }, "overlap"),
    "a",
    "props a and b intersect: slab 0 enters slab 0 by 0.0011 m",
  );
});

test("overlap separates yawed boxes whose bounds overlap", async () => {
  // A cube yawed 45 degrees reaches x 0.7071 only at z 0; the second cube starts at z 0.4.
  const diamond = placed("diamond", [1, 1, 1], [0, 0, 5], 45);
  const square = block("square", [1, 1, 1], [1.2, 5.9], 0);
  expect(await findingsOf(HALL, { props: [diamond, square] }, "overlap")).toEqual([]);
});

test("seal passes a seal 0.02 m into the interior and fails one 0.1 mm shallower", async () => {
  expect(await findingsOf(HALL, { seals: [endSeal(19.98)] }, "seal")).toEqual([]);
  expectOne(
    await findingsOf(HALL, { seals: [endSeal(19.9801)] }, "seal"),
    "end",
    "seal end reaches less than 0.02 m into the interior, so sec-111 cannot see it",
  );
});
