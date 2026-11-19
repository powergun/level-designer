import { expect, spyOn, test } from "bun:test";
import type { Description } from "@level-designer/level-format";
import {
  buildLevel,
  COMMITTED_DESCRIPTION,
  readInputs,
  validateLevel,
} from "@level-designer/level-pipeline";
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

/** The glow names the description's props and static objects state. */
function glowsInUse(description: Description): ReadonlySet<string> {
  const props = description.props.map((prop) => prop.params.get("glow"));
  const statics = description.statics.map((box) => box.glow);
  const names = [...props, ...statics];
  return new Set(names.filter((name): name is string => typeof name === "string"));
}

/** Asserts every lamp material names a glow and emits its colour at its strength; returns the glows met. */
function expectLitLamps(glb: Uint8Array, description: Description): ReadonlySet<string> {
  const lamps = materialsOf(glb).filter(
    (m) => typeof m.finish === "string" && m.finish.startsWith(LAMP_FINISH),
  );
  expect(lamps.length).toBeGreaterThan(0);
  const met = new Set<string>();
  for (const lamp of lamps) {
    const name = typeof lamp.glow === "string" ? lamp.glow : "";
    const glow = description.glows.get(name);
    expect(glow).toBeDefined();
    expect(lamp.emissiveFactor).toEqual([...(glow?.color ?? [])]);
    expect(lamp.emissiveStrength).toBe(glow?.strength);
    met.add(name);
  }
  return met;
}

test(
  "the committed description builds and is accepted, and every lamp emits at its glow's strength",
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
    expect(preparations.mock.calls.length - before).toBe(1);
    const { description, glb } = outcome.built;
    expect(expectLitLamps(glb, description)).toEqual(glowsInUse(description));
  },
  PREPARATION_TIMEOUT,
);
