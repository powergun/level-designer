import { beforeAll, describe, expect, spyOn, test } from "bun:test";
import { decodeLevel, roundSlab, slabBox } from "@level-designer/level-format";
import { namedSpawns } from "@level-designer/level-rules";
import type { BuildError, BuildOutcome, BuiltLevel } from "@level-designer/level-pipeline";
import { buildLevel, validateLevel } from "@level-designer/level-pipeline";
import { BODY_BOX_LIMIT } from "@level-designer/sec111-gateway";
import * as stage from "@level-designer/sec111-gateway/stage";
import {
  CYAN_GLOWS,
  crate,
  emptyStage,
  FIXTURE,
  FRONT_CRATE,
  fixtureBytes,
  lightStrip,
  SLAB_CRATE,
} from "./fixture.js";

// Owner: level-pipeline's build and validation, on the real base stage. This file holds every
// case that builds. It makes two full preparations, the fixture's static scene in `beforeAll` and
// the fixture's level GLB as a whole file, plus one call that sec-111 refuses at once. Every other
// build passes the fixture's prepared static level. Each step that calls the preparation asserts
// its own count, so no test order can break the budget.

/** Every call of sec-111's preparation; the files of one run may share this record. */
const preparations = spyOn(stage, "prepareLevel");

/** One preparation costs about 3 s; the setup and the whole-file case each run one. */
const PREPARATION_TIMEOUT = 30_000;

let baseStage: Uint8Array;
let built: BuiltLevel;

beforeAll(async () => {
  baseStage = await stage.readBaseStage();
  const before = preparations.mock.calls.length;
  const outcome = await buildLevel({ description: fixtureBytes(), baseStage });
  expect(preparations.mock.calls.length - before).toBe(1);
  if (!outcome.ok) throw new Error(`the fixture is blocked: ${JSON.stringify(outcome.errors)}`);
  built = outcome.built;
}, PREPARATION_TIMEOUT);

/** The fixture with `changes`, built on the fixture's prepared static level without preparing. */
async function buildOnFixture(changes: Readonly<Record<string, unknown>>): Promise<BuildOutcome> {
  const before = preparations.mock.calls.length;
  const outcome = await buildLevel(
    { description: fixtureBytes(changes), baseStage },
    built.prepared,
  );
  expect(preparations.mock.calls.length).toBe(before);
  return outcome;
}

/** The built level of an outcome that builds. */
function builtOf(outcome: BuildOutcome): BuiltLevel {
  if (!outcome.ok) throw new Error(`expected a build: ${JSON.stringify(outcome.errors)}`);
  return outcome.built;
}

/** The errors of a blocked outcome. */
function errorsOf(outcome: BuildOutcome): readonly BuildError[] {
  if (outcome.ok) throw new Error("expected a blocked build");
  return outcome.errors;
}

/** Every error message starts with its path, so an author finds the value. */
function expectAnnounced(errors: readonly BuildError[]): void {
  expect(errors.length).toBeGreaterThan(0);
  for (const error of errors) expect(error.message.startsWith(`${error.path}: `)).toBe(true);
}

/** The lowest corner height of a prop's slabs. */
function lowestPoint(level: BuiltLevel, id: string): number {
  const prop = level.level.props.find((candidate) => candidate.id === id);
  const corners = prop?.slabs.flatMap((slab) => slabBox(slab).corners) ?? [];
  return Math.min(...corners.map((corner) => corner[1]));
}

describe("the fixture build", () => {
  test(
    "today's prepareLevel admits the whole level GLB",
    async () => {
      const before = preparations.mock.calls.length;
      const result = await stage.prepareLevel({ stage: built.glb, placements: '{"walls":[]}' });
      expect(result.kind).toBe("prepared");
      expect(preparations.mock.calls.length - before).toBe(1);
    },
    PREPARATION_TIMEOUT,
  );

  test("the preparation measures scale 1 and the crates stand on both floors", () => {
    expect(built.prepared.level.metrics.scale).toBe(1);
    expect(lowestPoint(built, FRONT_CRATE.id)).toBeCloseTo(0, 9);
    expect(lowestPoint(built, SLAB_CRATE.id)).toBeCloseTo(0.3241, 9);
  });

  test("every slab lies on the format's grid and the .json decodes to the level", () => {
    const slabs = built.level.props.flatMap((prop) => prop.slabs);
    expect(slabs).toHaveLength(10);
    for (const slab of slabs) expect(roundSlab(slab)).toEqual(slab);
    expect(decodeLevel(built.json)).toEqual({ ok: true, value: built.level });
  });

  test("the built level carries the description and its hash", () => {
    const hash = new Bun.CryptoHasher("sha256").update(fixtureBytes()).digest("hex");
    expect(built.hash).toBe(hash.slice(0, 12));
    expect(built.description.name).toBe(FIXTURE.name);
  });
});

describe("a build blocked up to the preparation announces every error", () => {
  test("a description error blocks before any preparation", async () => {
    const before = preparations.mock.calls.length;
    const duplicate = crate(FRONT_CRATE.id, [0, 0]);
    const shape = errorsOf(
      await buildLevel({ description: fixtureBytes({ name: "Bad" }), baseStage }),
    );
    const id = errorsOf(
      await buildLevel({
        description: fixtureBytes({ props: [FRONT_CRATE, duplicate] }),
        baseStage,
      }),
    );
    expect(shape.map((error) => [error.rule, error.path])).toEqual([["shape", "name"]]);
    expect(id.map((error) => [error.rule, error.path])).toEqual([["id", "props[1].id"]]);
    expectAnnounced([...shape, ...id]);
    expect(preparations.mock.calls.length).toBe(before);
  });

  test("an unknown base name blocks before any preparation", async () => {
    const before = preparations.mock.calls.length;
    const base = { ...FIXTURE.base, materials: { "No.Such": { roughness: 1 } } };
    const errors = errorsOf(await buildLevel({ description: fixtureBytes({ base }), baseStage }));
    expect(errors).toEqual([
      {
        rule: "base",
        path: 'base.materials["No.Such"]',
        message: 'base.materials["No.Such"]: the base stage has no material named "No.Such"',
      },
    ]);
    expect(preparations.mock.calls.length).toBe(before);
  });

  test("a failed preparation blocks with prepare at $ and sec-111's message", async () => {
    const before = preparations.mock.calls.length;
    const errors = errorsOf(
      await buildLevel({ description: fixtureBytes({ seals: [] }), baseStage: emptyStage() }),
    );
    expect(preparations.mock.calls.length - before).toBe(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.rule).toBe("prepare");
    expect(errors[0]?.path).toBe("$");
    expect(errors[0]?.message).toStartWith("sec-111 level preparation failed: stage survey: ");
  });
});

describe("a build blocked on the prepared static level announces every error", () => {
  test("the props step reports place, kind and param in description order", async () => {
    const outside = { ...crate("outside", [100, -3.25]), kind: "no-such-kind" };
    const unknown = { ...crate("unknown", [0, 0]), kind: "no-such-kind" };
    const badSize = { ...crate("bad-size", [2, 0]), params: { color: "#000000", size: 9 } };
    const errors = errorsOf(await buildOnFixture({ props: [outside, unknown, badSize] }));
    expect(errors.map((error) => [error.rule, error.path])).toEqual([
      ["place", "props[0].at"],
      ["kind", "props[1].kind"],
      ["param", "props[2].params.size"],
    ]);
    expect(errors[0]?.message).toBe("props[0].at: (100, -3.25) lies outside the interior");
    expectAnnounced(errors);
  });

  test("place passes at the interior's edge and blocks one grid step beyond", async () => {
    const { max } = built.prepared.level.metrics.interior;
    const atEdge = await buildOnFixture({ props: [crate("edge", [max[0], 0])] });
    const beyond = errorsOf(await buildOnFixture({ props: [crate("edge", [max[0] + 0.0001, 0])] }));
    expect(atEdge.ok).toBe(true);
    expect(beyond.map((error) => error.rule)).toEqual(["place"]);
  });

  test("the slab admission blocks a level above the slab cap", async () => {
    const props = Array.from({ length: 205 }, (_, k) =>
      crate(`crate-${k}`, [-14 + 2 * (k % 15), 2 * Math.floor(k / 15)]),
    );
    const errors = errorsOf(await buildOnFixture({ props }));
    expect(errors).toEqual([
      {
        rule: "slab",
        path: "props",
        message: "the level has 1,025 slabs; the format admits 1,024",
      },
    ]);
  });
});

describe("the validation of a built level", () => {
  test("the fixture is accepted, and its report holds the hall facts and the body boxes", async () => {
    const report = await validateLevel(built);
    const prepared = built.prepared.level;
    expect(report.findings).toEqual([]);
    expect(report.accepted).toBe(true);
    expect(report.hall.interior).toEqual(prepared.metrics.interior);
    expect(report.hall.floors).toEqual(prepared.metrics.floorHeights);
    expect(report.hall.ramp).not.toBeNull();
    expect(report.hall.spawns).toEqual(namedSpawns(prepared));
    expect(report.summary.bodyBoxes.limit).toBe(BODY_BOX_LIMIT);
    const { floors, obstacles, enclosure } = prepared.bodies;
    const bodyBoxes = floors.length + obstacles.length + enclosure.length;
    expect(report.summary.bodyBoxes.count).toBe(bodyBoxes);
    expect(Math.min(floors.length, obstacles.length, enclosure.length)).toBeGreaterThan(0);
    expect(report.summary.lanes).toHaveLength(namedSpawns(prepared).length - 1);
  });

  test("a point light under the floor is rejected with light-floor", async () => {
    const points = [{ ...FIXTURE.lighting.points[0], position: [0, -0.5, 0] }];
    const sunk = builtOf(await buildOnFixture({ lighting: { ...FIXTURE.lighting, points } }));
    const report = await validateLevel(sunk);
    expect(report.findings.map((finding) => [finding.rule, finding.subject])).toEqual([
      ["light-floor", "lighting.points[0]"],
    ]);
    expect(report.accepted).toBe(false);
  });

  test("a level above the first-pass budget is accepted and shows its counts", async () => {
    const strips = Array.from({ length: 201 }, (_, k) =>
      lightStrip(`strip-${k}`, [-7 + (k % 15), -14 + 2 * Math.floor(k / 15)]),
    );
    const props = [FRONT_CRATE, SLAB_CRATE, ...strips];
    const dressed = builtOf(await buildOnFixture({ glows: CYAN_GLOWS, props }));
    const report = await validateLevel(dressed);
    expect(report.findings).toEqual([]);
    expect(report.accepted).toBe(true);
    expect(report.summary.props).toEqual({ count: 203, limit: 200 });
    expect(report.summary.slabs).toEqual({ count: 211, limit: 800 });
    expect(report.summary.points.count).toBe(1);
  });
});
