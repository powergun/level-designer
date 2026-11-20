import { expect, spyOn, test } from "bun:test";
import { recipeAt, staticClass, type Description } from "@level-designer/level-format";
import {
  buildDressing,
  buildLevel,
  type BuildInputs,
  type BuiltLevel,
  COMMITTED_DESCRIPTION,
  readInputs,
  validateLevel,
} from "@level-designer/level-pipeline";
import { floorHeightAt } from "@level-designer/sec111-gateway";
import * as stage from "@level-designer/sec111-gateway/stage";
import { field, glbDocument, listAt } from "./glb-json.js";

// Owner: level-pipeline, on the committed description. This file runs the gate's third and
// last full preparation, and only that one.

/** Every call of sec-111's preparation, counted through the gateway's stage entry; files of one run may share it. */
const preparations = spyOn(stage, "prepareLevel");

/** One preparation costs about 3 s. */
const PREPARATION_TIMEOUT = 30_000;

/** The finish of every lamp: its paths' bodies are lit, so a lamp emits at its glow's strength. */
const LAMP_FINISH = "luminaire/";

/** One material of the written file, as far as the lamp check reads it. */
interface WrittenMaterial {
  readonly finish: unknown;
  readonly glow: unknown;
  readonly emissiveFactor: unknown;
  readonly emissiveStrength: unknown;
}

/** The materials of a GLB, as far as the lamp check reads them. */
function materialsOf(glb: Uint8Array): readonly WrittenMaterial[] {
  const list = listAt(glbDocument(glb), "materials");
  return list.map((material) => ({
    finish: field(field(material, "extras"), "finish"),
    glow: field(field(material, "extras"), "glow"),
    emissiveFactor: field(material, "emissiveFactor"),
    emissiveStrength: field(
      field(field(material, "extensions"), "KHR_materials_emissive_strength"),
      "emissiveStrength",
    ),
  }));
}

/** The glow names the description's seals, props and static objects state. */
function glowsInUse(description: Description): ReadonlySet<string> {
  const seals = description.seals.map((seal) =>
    seal.finish === undefined ? undefined : seal.glow,
  );
  const props = description.props.map((prop) => prop.params.get("glow"));
  const statics = description.statics.map((box) => box.glow);
  const names = [...seals, ...props, ...statics];
  return new Set(names.filter((name): name is string => typeof name === "string"));
}

/** Asserts every lamp material names a glow and emits its colour at its strength. */
function expectLitLamps(materials: readonly WrittenMaterial[], description: Description): void {
  const lamps = materials.filter(
    (m) => typeof m.finish === "string" && m.finish.startsWith(LAMP_FINISH),
  );
  expect(lamps.length).toBeGreaterThan(0);
  for (const lamp of lamps) {
    const glow = description.glows.get(typeof lamp.glow === "string" ? lamp.glow : "");
    expect(glow).toBeDefined();
    expect(lamp.emissiveFactor).toEqual([...(glow?.color ?? [])]);
    expect(lamp.emissiveStrength).toBe(glow?.strength);
  }
}

/** The glow names the written materials carry, on any finish path. */
function glowsMet(materials: readonly WrittenMaterial[]): ReadonlySet<string> {
  const names = materials.map((material) => material.glow);
  return new Set(names.filter((name): name is string => typeof name === "string"));
}

/** Compare the game export to every prop and floor decoration in the approved level build. */
async function expectDressing(inputs: BuildInputs, built: BuiltLevel): Promise<void> {
  const sheets = await buildDressing(inputs, built.prepared);
  if (!sheets.ok) throw new Error(`dressing blocked: ${JSON.stringify(sheets.errors)}`);
  const propSheet: unknown = JSON.parse(sheets.props);
  const decorationSheet: unknown = JSON.parse(sheets.decorations);
  const props = built.description.props.map(({ id, at, kind, yaw, params }, index) => ({
    id,
    kind,
    at,
    yaw,
    floor: floorHeightAt(built.prepared.level, ...at),
    params: Object.fromEntries(params),
    slabs: built.level.props[index]?.slabs,
  }));
  const floor = built.placed.filter(({ object }) => staticClass(object) === "floor");
  const objects = floor.map(
    ({ object: { id, yaw, size, color, finish, number, wear, seed, glow }, box }) => ({
      id,
      yaw,
      size,
      color,
      finish,
      number,
      wear,
      seed,
      center: box.center,
      ...(glow === undefined ? {} : { glow }),
    }),
  );
  expect(field(propSheet, "props")).toEqual(props);
  expect(decorationSheet).toEqual({ schema: "factory-decorations/1", objects });
  const paths = new Set([
    ...built.level.props.flatMap(({ slabs }) => slabs.map(({ finish }) => finish)),
    ...objects.map(({ finish }) => finish),
  ]);
  const finishes = field(propSheet, "finishes");
  expect(new Set(Object.keys(Object(finishes)))).toEqual(paths);
  for (const path of paths) {
    const recipe = recipeAt(built.description.finishes, path);
    const cut = built.description.finishes.get(path.split("/")[0] ?? "")?.cut;
    expect(field(finishes, path)).toEqual({ ...recipe, cut });
  }
  const glows = new Set([
    ...built.description.props.map(({ params }) => params.get("glow")),
    ...objects.map(({ glow }) => glow),
  ]);
  expect(field(propSheet, "glows")).toEqual(
    Object.fromEntries([...built.description.glows].filter(([name]) => glows.has(name))),
  );
  expect(Object.keys(Object(propSheet)).toSorted()).toEqual([
    "finishes",
    "glows",
    "props",
    "schema",
  ]);
  expect(field(propSheet, "schema")).toBe("factory-props/1");
}

test(
  "the committed description builds and is accepted, every lamp emits at its strength, and every glow in use is met",
  async () => {
    const before = preparations.mock.calls.length;
    const read = await readInputs(COMMITTED_DESCRIPTION);
    if (!read.ok) throw new Error(`${read.path}: ${read.reason}`);
    const outcome = await buildLevel(read.inputs);
    if (!outcome.ok) throw new Error(`blocked: ${JSON.stringify(outcome.errors)}`);
    const report = await validateLevel(outcome.built);
    expect(report.findings).toEqual([]);
    expect(report.accepted).toBe(true);
    expect(outcome.built.prepared.level.metrics.scale).toBe(1);
    const { count, limit } = report.summary.bodyBoxes;
    expect(count).toBeLessThan(limit);
    const { description, glb } = outcome.built;
    const materials = materialsOf(glb);
    expectLitLamps(materials, description);
    expect(glowsMet(materials)).toEqual(glowsInUse(description));
    await expectDressing(read.inputs, outcome.built);
    expect(preparations.mock.calls.length - before).toBe(1);
  },
  PREPARATION_TIMEOUT,
);
