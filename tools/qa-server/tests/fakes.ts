import type { FinishTable, Level } from "@level-designer/level-format";
import { encodeLevel } from "@level-designer/level-format";
import type { BuildError, BuiltLevel, Report } from "@level-designer/level-pipeline";
import type { Pipeline } from "@level-designer/qa-server";
import type { PreparedLevel } from "@level-designer/sec111-gateway";
import { readCommittedFiles, readCommittedLevel } from "@level-designer/sec111-gateway/testing";

/** sec-111's committed prepared level, the hall every fake build stands on. */
const PREPARED: PreparedLevel = await readCommittedLevel();
const PREPARED_FILES = await readCommittedFiles();

/** The path the fake pipeline names as its committed description. */
export const FAKE_DESCRIPTION = "committed/dark-factory.json";

/** A dim lighting section with no point light. */
const LIGHTING: Level["lighting"] = {
  environment: { intensity: 0.3, ambient: [0.01, 0.01, 0.01], overhead: [0.04, 0.04, 0.05] },
  points: [],
  haze: { density: 0.02, color: [0, 0, 0.01], glow: 0.4 },
  exposure: 0.9,
};

/** The fixture finish table: one plain role, the path of the crate slab. */
const FINISHES: FinishTable = new Map([
  [
    "timber",
    {
      cut: { family: "wood", color: "#604020" },
      light: "#ffffff",
      roles: new Map([["crate", { layers: [] }]]),
    },
  ],
]);

/** A level with one crate slab beside the player spawn. */
function crateLevel(): Level {
  const [x, y, z] = PREPARED.spawns.player;
  const slab = {
    size: [1, 1, 0.05],
    material: "wood",
    color: "#604020",
    position: [x + 6, y + 0.5, z],
    rotation: [0, 0, 0, 1],
    finish: "timber/crate",
    number: 0,
    seed: 0,
    wear: 0.3,
  } as const;
  return { finishes: FINISHES, props: [{ id: "crate", slabs: [slab] }], lighting: LIGHTING };
}

/** The level GLB the fake build serves; the scripted view never parses it. */
export const FAKE_GLB: Uint8Array = new TextEncoder().encode("glTF bytes of the fake build");

/** The built level `qa-fixture` with hash `00c0ffee00aa`, on the committed prepared level. */
export function fakeBuilt(): BuiltLevel {
  const level = crateLevel();
  return {
    description: {
      name: "qa-fixture",
      props: [],
      lighting: LIGHTING,
      glows: new Map(),
      seals: [],
      statics: [],
      finishes: FINISHES,
      base: { doubleSided: [], materials: new Map(), scale: 3.89956 },
    },
    hash: "00c0ffee00aa",
    glb: FAKE_GLB,
    json: encodeLevel(level),
    level,
    baseImages: 0,
    prepared: { level: PREPARED, files: PREPARED_FILES },
    placed: [],
  };
}

/** A report of the fake build with the given findings. */
function fakeReport(findings: Report["findings"]): Report {
  const none = { count: 0, limit: 1 };
  return {
    hall: {
      interior: PREPARED.metrics.interior,
      floors: PREPARED.metrics.floorHeights,
      ramp: null,
      spawns: [],
    },
    findings,
    summary: {
      triangles: none,
      points: none,
      bodyBoxes: none,
      lanes: [],
      slabs: none,
      props: none,
    },
    accepted: findings.length === 0,
  };
}

/** The finding of a rejected fake level. */
export const FINDING: Report["findings"][number] = {
  rule: "light-floor",
  subject: "lighting.points[0]",
  message: "lighting.points[0] sinks into the floor",
};

/** The two errors of a blocked fake build. */
export const BUILD_ERRORS: readonly BuildError[] = [
  { rule: "param", path: "props[0].params.width", message: "props[0].params.width: too wide" },
  { rule: "kind", path: "props[1].kind", message: 'props[1].kind: no kind "bench"' },
];

/** How the fake pipeline answers. */
export type FakeBuild =
  | "accepted"
  | "rejected"
  | "blocked"
  | "unreadable"
  | "read-throws"
  | "build-throws"
  | "validation-throws";

/** A fake level pipeline that answers by `build` and never prepares a level. */
export function fakePipeline(build: FakeBuild): Pipeline {
  return {
    COMMITTED_DESCRIPTION: FAKE_DESCRIPTION,
    readInputs: (path) => {
      if (build === "read-throws") return Promise.reject(new Error("the base stage is missing"));
      return Promise.resolve(
        build === "unreadable"
          ? { ok: false, path, reason: "no such file" }
          : { ok: true, inputs: { description: new Uint8Array(), baseStage: new Uint8Array() } },
      );
    },
    buildLevel: () => {
      if (build === "build-throws") return Promise.reject(new Error("sec-111 exploded"));
      if (build === "blocked") return Promise.resolve({ ok: false, errors: BUILD_ERRORS });
      return Promise.resolve({ ok: true, built: fakeBuilt() });
    },
    validateLevel: () => {
      if (build === "validation-throws") return Promise.reject(new Error("the judgement broke"));
      return Promise.resolve(fakeReport(build === "rejected" ? [FINDING] : []));
    },
  };
}
