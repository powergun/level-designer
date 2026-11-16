import { expect } from "bun:test";
import type { Lighting, PointLight, Seal, Slab, Vec3 } from "@level-designer/level-format";
import { roundSlab } from "@level-designer/level-format";
import type { GlbInspection } from "@level-designer/level-glb";
import type { Finding } from "@level-designer/level-rules";
import { judgeLevel } from "@level-designer/level-rules";
import type { PreparedLevel } from "@level-designer/sec111-gateway";
import { floorHeightAt } from "@level-designer/sec111-gateway";
import { expandProp } from "@level-designer/prop-kit";

/** An axis-aligned box of the prepared level's shape. */
interface Box {
  readonly min: Vec3;
  readonly max: Vec3;
}

/** A hand-built hall: its interior, extra floors and obstacles, spawns and measured scale. */
export interface RoomSpec {
  readonly interior: Box;
  readonly floors: readonly Box[];
  readonly obstacles: readonly Box[];
  readonly player: Vec3;
  readonly minions: readonly Vec3[];
  readonly scale: number;
}

/**
 * The box room: 20 m wide (x) and 40 m long (z), 10 m high. The raised slab stands 0.3 m high
 * for z below -12, one step floor 0.15 m high spans z -12 to -11, so the ramp zone is z -12
 * to -11. The player spawns at z 17, the minions at the four corners.
 */
export const BOX_ROOM: RoomSpec = {
  interior: { min: [-10, 0, -20], max: [10, 10, 20] },
  floors: [
    { min: [-10, 0, -20], max: [10, 0.3, -12] },
    { min: [-10, 0, -12], max: [10, 0.15, -11] },
  ],
  obstacles: [],
  player: [0, 0, 17],
  minions: [
    [8, 0, 19],
    [-8, 0, 19],
    [8, 0.3, -19],
    [-8, 0.3, -19],
  ],
  scale: 1,
};

/**
 * A corridor room `width` wide along x and 60 m long: the player spawns at its +z end and the
 * minions at its -z end, each at the centre of a lane grid cell beside the centre line. A
 * route starts in its spawn's cell, so an off-centre spawn would narrow the lane itself.
 */
export function corridor(width: number): RoomSpec {
  const half = width / 2;
  return {
    interior: { min: [-half, 0, -30], max: [half, 10, 30] },
    floors: [],
    obstacles: [],
    player: [0.05, 0, 25.05],
    minions: [
      [0.05, 0, -25.05],
      [-0.05, 0, -25.05],
      [0.05, 0, -24.05],
      [-0.05, 0, -24.05],
    ],
    scale: 1,
  };
}

/** The prepared static level of a hand-built hall, in the shape sec-111 returns. */
export function room(spec: RoomSpec): PreparedLevel {
  const { min, max } = spec.interior;
  const base: Box = { min: [min[0] - 1, -1, min[2] - 1], max: [max[0] + 1, min[1], max[2] + 1] };
  return {
    metrics: { scale: spec.scale, floorHeights: [min[1]], interior: spec.interior },
    world: { shell: [], prop: [], closure: [], endWall: base },
    bodies: { floors: [base, ...spec.floors], obstacles: spec.obstacles, enclosure: [] },
    spawns: { player: spec.player, minions: spec.minions },
    walls: [],
    acoustic: [],
    navMesh: new Uint8Array(0),
  };
}

/** The facts `judgeLevel` judges, as its signature types them. */
type LevelFacts = Parameters<typeof judgeLevel>[0];

/** A prop as a test builds it: its id, its plan point `at` and its rounded slabs. */
export interface TestProp {
  readonly id: string;
  readonly at: readonly [number, number];
  readonly slabs: readonly Slab[];
}

/** What a test puts into the level beside the hall; every part has a passing default. */
export interface Scene {
  readonly props?: readonly TestProp[];
  readonly seals?: readonly Seal[];
  readonly points?: readonly PointLight[];
  readonly inspection?: GlbInspection;
  readonly baseImages?: number;
  readonly baseScale?: number;
}

/** A dark lighting section with the scene's point lights. */
function lighting(points: readonly PointLight[]): Lighting {
  return {
    environment: { intensity: 0.5, ambient: [0.1, 0.1, 0.1], overhead: [0.2, 0.2, 0.2] },
    points,
    haze: { density: 0.01, color: [0.1, 0.1, 0.1], glow: 0 },
    exposure: 1,
  };
}

/** The five facts of a built level from a hall and a scene. */
export function factsOf(prepared: PreparedLevel, scene: Scene = {}): LevelFacts {
  const props = scene.props ?? [];
  const finish = { metalness: 0.5, roughness: 0.5 };
  const description = {
    name: "test",
    base: { scale: scene.baseScale ?? 1, materials: new Map(), doubleSided: [] },
    seals: scene.seals ?? [],
    finishes: { wood: finish, brick: finish, concrete: finish, metal: finish },
    glows: new Map(),
    props: props.map((p) => ({ id: p.id, kind: "crate", at: p.at, yaw: 0, params: new Map() })),
    lighting: lighting(scene.points ?? []),
  };
  return {
    description,
    level: {
      props: props.map((p) => ({ id: p.id, slabs: p.slabs })),
      lighting: description.lighting,
    },
    inspection: scene.inspection ?? { triangles: 0, primitivesWithoutMaterial: [], images: 11 },
    baseImages: scene.baseImages ?? 11,
    prepared,
  };
}

/** The findings of one rule when the rules judge the scene in the hall. */
export async function findingsOf(
  prepared: PreparedLevel,
  scene: Scene,
  rule: Finding["rule"],
): Promise<Finding[]> {
  const judgement = await judgeLevel(factsOf(prepared, scene));
  return judgement.findings.filter((f) => f.rule === rule);
}

/** Asserts that the findings are exactly the one with this subject and message. */
export function expectOne(findings: readonly Finding[], subject: string, message: string): void {
  expect(findings.map((f) => ({ subject: f.subject, message: f.message }))).toEqual([
    { subject, message },
  ]);
}

/**
 * An upright metal slab, rounded to the grid: `size` is width, height and thickness, the base
 * centre stands at `position`, and `yaw` in degrees turns it about +Y.
 */
export function slab(size: Vec3, position: Vec3, yaw = 0): Slab {
  const half = (yaw * Math.PI) / 360;
  return roundSlab({
    size,
    material: "metal",
    color: "#808080",
    position,
    rotation: [0, Math.sin(half), 0, Math.cos(half)],
  });
}

/** A prop of one upright slab with its base centre on `at` and the floor height `y`. */
export function block(id: string, size: Vec3, at: readonly [number, number], y: number): TestProp {
  return { id, at, slabs: [slab(size, [at[0], y, at[1]])] };
}

/** A prop of a `prop-kit` kind, expanded on the hall's floor under `at` and rounded. */
export function kitProp(
  prepared: PreparedLevel,
  id: string,
  kind: string,
  site: { readonly at: readonly [number, number]; readonly yaw: number },
  params: Readonly<Record<string, unknown>>,
): TestProp {
  const prop = { id, kind, at: site.at, yaw: site.yaw, params: new Map(Object.entries(params)) };
  const floor = floorHeightAt(prepared, site.at[0], site.at[1]);
  const expansion = expandProp(prop, "props[0]", floor, new Set(["cyan"]));
  if (!expansion.ok) {
    throw new Error(`expected ${kind} to expand: ${JSON.stringify(expansion.problems)}`);
  }
  return { id, at: site.at, slabs: expansion.slabs.map((s) => roundSlab(s.slab)) };
}
