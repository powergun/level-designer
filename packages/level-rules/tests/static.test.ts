import { expect, test } from "bun:test";
import { staticBox } from "@level-designer/level-format";
import type { StaticObject, Vec3 } from "@level-designer/level-format";
import type { PreparedLevel } from "@level-designer/sec111-gateway";
import { floorHeightAt } from "@level-designer/sec111-gateway";
import type { TestStatic } from "./room.js";
import { BOX_ROOM, block, expectOne, findingsOf, room, SLAB_FINISH } from "./room.js";

/** The box room: base floor 0 for z above -11, the ramp zone z -12 to -11, raised slab 0.3 m. */
const HALL = room(BOX_ROOM);

/** The box room with its raised slab and no step floor, so it has no ramp zone. */
const TWO_FLOORS = room({ ...BOX_ROOM, floors: BOX_ROOM.floors.slice(0, 1) });

/** A crate-high prop of one 2 x 0.6 x 2 m slab on the base floor at (0, 5); its top is 0.6 m. */
const CRATE = block("crate", [2, 0.6, 2], [0, 5], 0);

/** Where a test lays a static object: its plan point, size, yaw and lift, or the prop it lies on. */
interface Lay {
  readonly at: readonly [number, number];
  readonly size: Vec3;
  readonly yaw?: number;
  readonly lift?: number;
  readonly on?: string;
}

/** A static object of the description, every default filled as the admission fills it. */
function staticObject(id: string, lay: Lay): StaticObject {
  const { finish, number, seed, wear } = SLAB_FINISH;
  const base = { id, at: lay.at, yaw: lay.yaw ?? 0, size: lay.size, lift: lay.lift ?? 0 };
  const paint = { color: "#808080", finish, number, seed, wear };
  return lay.on === undefined ? { ...base, ...paint } : { ...base, on: lay.on, ...paint };
}

/** A static object on the floor under its `at`, raised by its lift, as the pipeline places it. */
function onFloor(prepared: PreparedLevel, id: string, lay: Lay): TestStatic {
  const object = staticObject(id, lay);
  const floor = floorHeightAt(prepared, lay.at[0], lay.at[1]);
  return { object, box: staticBox(object, floor + object.lift) };
}

/** A litter on the top of a prop, at the top's height `top`. */
function onTop(prop: string, top: number, id: string, lay: Lay): TestStatic {
  const object = staticObject(id, { ...lay, on: prop });
  return { object, box: staticBox(object, top) };
}

/** The `static` findings of the statics in a hall, beside the crate. */
async function staticFindings(prepared: PreparedLevel, statics: readonly TestStatic[]) {
  return findingsOf(prepared, { props: [CRATE], statics }, "static");
}

/** A 1 x 0.1 x 1 m floor litter at (x, 5), beside the interior's +x side at x 10. */
function nearEdge(x: number): Lay {
  return { at: [x, 5], size: [1, 0.1, 1] };
}

test("interior passes a static object on the interior's edge and names the corner 0.1 mm beyond it", async () => {
  const inside = [onFloor(HALL, "edge", nearEdge(9.5))];
  expect(await findingsOf(HALL, { statics: inside }, "interior")).toEqual([]);
  expectOne(
    await findingsOf(HALL, { statics: [onFloor(HALL, "edge", nearEdge(9.5001))] }, "interior"),
    "edge",
    "static edge leaves the interior by 0.0001 m at (10.0001, 0, 4.5)",
  );
});

test("interior names a static object after the props", async () => {
  const far = block("far", [1, 1, 1], [9.6, 5], 0);
  const statics = [onFloor(HALL, "edge", { at: [9.6, 8], size: [1, 0.1, 1] })];
  const findings = await findingsOf(HALL, { props: [far], statics }, "interior");
  expect(findings.map((f) => f.subject)).toEqual(["far", "edge"]);
});

test("static passes a litter 0.15 m high and fails one 0.1 mm higher, on the floor and on a prop", async () => {
  const low: Vec3 = [0.5, 0.15, 0.5];
  const high: Vec3 = [0.5, 0.1501, 0.5];
  const passing = [
    onFloor(HALL, "floor", { at: [4, 10], size: low }),
    onTop("crate", 0.6, "top", { at: [0, 5], size: low }),
  ];
  expect(await staticFindings(HALL, passing)).toEqual([]);
  expectOne(
    await staticFindings(HALL, [onFloor(HALL, "floor", { at: [4, 10], size: high })]),
    "floor",
    "static floor is 0.1501 m high; litter is 0.15 m high or lower",
  );
  expectOne(
    await staticFindings(HALL, [onTop("crate", 0.6, "top", { at: [0, 5], size: high })]),
    "top",
    "static top is 0.1501 m high; litter is 0.15 m high or lower",
  );
});

test("static passes a litter 1.5 m long and fails one 0.1 mm longer, also yawed, on the floor and on a prop", async () => {
  for (const yaw of [0, 30]) {
    const passing = [
      onFloor(HALL, "floor", { at: [4, 10], size: [0.4, 0.02, 1.5], yaw }),
      onTop("crate", 0.6, "top", { at: [0, 5], size: [1.5, 0.02, 0.4], yaw }),
    ];
    expect(await staticFindings(HALL, passing)).toEqual([]);
    expectOne(
      await staticFindings(HALL, [
        onFloor(HALL, "floor", { at: [4, 10], size: [0.4, 0.02, 1.5001], yaw }),
      ]),
      "floor",
      "static floor measures 1.5001 m in plan; litter measures 1.5 m or less",
    );
    expectOne(
      await staticFindings(HALL, [
        onTop("crate", 0.6, "top", { at: [0, 5], size: [1.5001, 0.02, 0.4], yaw }),
      ]),
      "top",
      "static top measures 1.5001 m in plan; litter measures 1.5 m or less",
    );
  }
});

test("static counts an overhead object's start from the hall's highest floor, wherever it hangs", async () => {
  const sign = (at: readonly [number, number], lift: number): TestStatic =>
    onFloor(HALL, "sign", { at, size: [1.6, 0.8, 0.06], lift });
  const message =
    "static sign starts 2.1699 m above the hall's highest floor; an overhead object starts 2.17 m or higher";
  expect(await staticFindings(HALL, [sign([0, -16], 2.17)])).toEqual([]);
  expectOne(await staticFindings(HALL, [sign([0, -16], 2.1699)]), "sign", message);
  expect(await staticFindings(HALL, [sign([0, 10], 2.47)])).toEqual([]);
  expectOne(await staticFindings(HALL, [sign([0, 10], 2.4699)]), "sign", message);
});

test("static reads a lift of 0.1 mm as an overhead object, judged by the hang height alone", async () => {
  const chip = onFloor(HALL, "chip", { at: [4, 10], size: [0.3, 0.2, 0.3], lift: 0.0001 });
  const findings = await staticFindings(HALL, [chip]);
  expect(findings.map((f) => f.message)).toEqual([
    "static chip starts -0.2999 m above the hall's highest floor; an overhead object starts 2.17 m or higher",
  ]);
});

test("static keeps floor litter on one floor level: a corner on the edge passes, 0.1 mm beyond fails", async () => {
  const sheet = (z: number): TestStatic =>
    onFloor(TWO_FLOORS, "sheet", { at: [0, z], size: [1, 0.02, 1] });
  expect(await staticFindings(TWO_FLOORS, [sheet(-11.5)])).toEqual([]);
  expectOne(
    await staticFindings(TWO_FLOORS, [sheet(-11.5001)]),
    "sheet",
    "static sheet spans the floor levels 0 and 0.3; keep floor litter on one level",
  );
});

test("static keeps floor litter off the ramp zone, named with its z extent", async () => {
  const sheet = (z: number): TestStatic =>
    onFloor(HALL, "sheet", { at: [0, z], size: [1, 0.02, 1] });
  expect(await staticFindings(HALL, [sheet(-10.5)])).toEqual([]);
  const findings = await staticFindings(HALL, [sheet(-10.5001)]);
  expect(findings.map((f) => ({ subject: f.subject, message: f.message }))).toEqual([
    {
      subject: "sheet",
      message: "static sheet spans the floor levels 0 and 0.15; keep floor litter on one level",
    },
    { subject: "sheet", message: "static sheet stands on the ramp, z -12 to -11" },
  ]);
});

test("static judges a litter on a prop for neither floor nor ramp", async () => {
  const lay: Lay = { at: [0, -11.5], size: [1.4, 0.1, 1.4], yaw: 20 };
  expect(await staticFindings(HALL, [onTop("deck", 1, "litter", lay)])).toEqual([]);
  const asFloor = await staticFindings(HALL, [onFloor(HALL, "litter", lay)]);
  expect(asFloor.length).toBe(2);
});

test("static holds both litter limits on an edge-biased sample of sizes and yaws", async () => {
  const sides = [0.02, 0.15, 0.1501, 1.5, 1.5001];
  for (const yaw of [0, 15, 45, 90]) {
    const statics: TestStatic[] = [];
    const expected = new Map<string, number>();
    sides.forEach((width, i) =>
      sides.forEach((height, j) => {
        const length = sides.at((i + j) % sides.length) ?? 0;
        const id = `s${i}${j}`;
        statics.push(
          onFloor(HALL, id, { at: [-8 + 4 * i, 2 + 3.5 * j], size: [width, height, length], yaw }),
        );
        expected.set(id, Number(height > 0.15) + Number(Math.max(width, length) > 1.5));
      }),
    );
    const findings = await staticFindings(HALL, statics);
    const counted = new Map([...expected.keys()].map((id) => [id, 0]));
    for (const f of findings) {
      counted.set(f.subject, (counted.get(f.subject) ?? 0) + 1);
    }
    expect(counted).toEqual(expected);
  }
});
