import { expect, test } from "bun:test";
import type { PointLight, Vec3 } from "@level-designer/level-format";
import { TRIANGLE_CAP } from "@level-designer/level-rules";
import { BOX_ROOM, expectOne, findingsOf, room } from "./room.js";

/** The box room's prepared level. */
const HALL = room(BOX_ROOM);

/** A white point light at a position. */
function light(position: Vec3): PointLight {
  return { position, color: [1, 1, 1], intensity: 10, range: 8 };
}

test("scale passes at exactly 1 and fails on another measured scale with the value to set", async () => {
  expect(await findingsOf(HALL, { baseScale: 3.89956 }, "scale")).toEqual([]);
  const measured = room({ ...BOX_ROOM, scale: 1.000001 });
  expectOne(
    await findingsOf(measured, { baseScale: 3.89956 }, "scale"),
    "base.scale",
    "sec-111 measures scale 1.000001 on the static scene; set base.scale to 3.899564",
  );
});

test("triangles passes at the cap and fails one triangle beyond it", async () => {
  expect(TRIANGLE_CAP).toBe(300_000);
  const at = { triangles: 300_000, primitivesWithoutMaterial: [], images: 11 };
  expect(await findingsOf(HALL, { inspection: at }, "triangles")).toEqual([]);
  const beyond = { ...at, triangles: 300_001 };
  expectOne(
    await findingsOf(HALL, { inspection: beyond }, "triangles"),
    "level",
    "the level has 300,001 triangles; the cap is 300,000",
  );
});

test("light-inside passes on the interior's edges and fails 0.1 mm beyond the side or the ceiling", async () => {
  const edges = [light([10, 5, 0]), light([-10, 5, 20]), light([0, 10, -20])];
  expect(await findingsOf(HALL, { points: edges }, "light-inside")).toEqual([]);
  const findings = await findingsOf(
    HALL,
    { points: [light([10.0001, 5, 0]), light([0, 10.0001, 0])] },
    "light-inside",
  );
  expect(findings.map((f) => [f.subject, f.message])).toEqual([
    ["lighting.points[0]", "lighting.points[0] at (10.0001, 5, 0) lies outside the interior"],
    ["lighting.points[1]", "lighting.points[1] at (0, 10.0001, 0) lies outside the interior"],
  ]);
});

test("light-floor judges the floor under the point, and a sunk light yields one finding", async () => {
  // On the raised slab the floor stands 0.3 m high.
  const onFloor = [light([0, 0.3, -15]), light([0, 0, 0])];
  expect(await findingsOf(HALL, { points: onFloor }, "light-floor")).toEqual([]);
  const sunk = { points: [light([0, 0.2999, -15])] };
  expectOne(
    await findingsOf(HALL, sunk, "light-floor"),
    "lighting.points[0]",
    "lighting.points[0] sits 0.0001 m under the floor at (0, -15)",
  );
  expect(await findingsOf(HALL, { points: [light([0, -1, 0])] }, "light-inside")).toEqual([]);
});

test("material names each primitive without a material by its mesh", async () => {
  const inspection = { triangles: 12, primitivesWithoutMaterial: ["crate/0"], images: 11 };
  expectOne(
    await findingsOf(HALL, { inspection }, "material"),
    "crate/0",
    'mesh "crate/0" has a primitive without a material',
  );
});

test("texture passes the base stage's images and fails on one image more", async () => {
  expect(await findingsOf(HALL, { baseImages: 11 }, "texture")).toEqual([]);
  const inspection = { triangles: 0, primitivesWithoutMaterial: [], images: 12 };
  expectOne(
    await findingsOf(HALL, { inspection, baseImages: 11 }, "texture"),
    "level",
    "the GLB holds 1 images beyond the base stage's; add the 1024 px check with the first texture owner",
  );
});
