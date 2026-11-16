import type { RigidTransform, WallModel } from "@level-designer/destruction-gateway";
import {
  CollisionScene,
  createDamageBudget,
  createPointContact,
  rotateVector,
  snapshotRetainedCuboids,
  toLocalPoint,
  toWorldPoint,
} from "@level-designer/destruction-gateway";
import type { Slab } from "@level-designer/level-format";
import { buildSlabModel } from "@level-designer/slab-model";

/** A step of the destructibility proof, in proof order. */
export type ProofStep = "admit" | "register" | "aim" | "rail" | "blast";

/** The damage of one trial: destruction lib's rail or blaster. */
type Damage = "rail" | "blaster";

/** A registration handle of the collision scene. */
type Handle = ReturnType<CollisionScene["registerWall"]>;

/** How far outside the +Z face each trial's cast starts, 0.2 m. */
const AIM_DISTANCE = 0.2;

/** A fresh vector for the output argument of destruction lib's transforms. */
function vector(): { x: number; y: number; z: number } {
  return { x: 0, y: 0, z: 0 };
}

/** Runs one step of destruction lib; a throw fails the step like a null outcome. */
export function attempt<T>(step: () => T): T | null {
  try {
    return step();
  } catch {
    return null;
  }
}

/** The rigid pose of a slab as destruction lib reads it. */
export function poseOf(slab: Slab): RigidTransform {
  const [x, y, z] = slab.position;
  const [qx, qy, qz, qw] = slab.rotation;
  return { position: { x, y, z }, rotation: { x: qx, y: qy, z: qz, w: qw } };
}

/**
 * The model's own hit of a cast from 0.2 m outside the +Z face centre toward the face, or null
 * when the cast misses or another obstacle wins it.
 */
function aim(scene: CollisionScene, model: WallModel, slab: Slab, handle: Handle) {
  const pose = poseOf(slab);
  const [, height, thickness] = slab.size;
  const target = toWorldPoint({ x: 0, y: height / 2, z: thickness / 2 }, pose, vector());
  const out = rotateVector({ x: 0, y: 0, z: AIM_DISTANCE }, pose.rotation, vector());
  const from = { x: target.x + out.x, y: target.y + out.y, z: target.z + out.z };
  const behind = { x: target.x - out.x, y: target.y - out.y, z: target.z - out.z };
  const contact = createPointContact();
  scene.prepare();
  const cast = scene.castSegment(from, behind, contact);
  scene.endBatch();
  const own = contact.obstacle;
  if (!cast || own?.id !== handle.id || own.generation !== handle.generation) {
    return null;
  }
  const origin = toLocalPoint(from, pose, vector());
  return model.raycast({ origin, direction: { x: 0, y: 0, z: -1 } });
}

/** The model's hit of the aim step. */
type Hit = NonNullable<ReturnType<typeof aim>>;

/**
 * Damages the model at the hit. A rail must leave the material gone there; a blast must leave
 * it gone and change the retained cuboids, which open the game's character blockers.
 */
function strike(model: WallModel, hit: Hit, kind: Damage): boolean {
  const before = JSON.stringify(snapshotRetainedCuboids(model));
  model.collectDamage(hit, kind, false, createDamageBudget());
  const gone = !model.materialAt(hit.local.x, hit.local.y, hit.local.z);
  return kind === "rail" ? gone : gone && JSON.stringify(snapshotRetainedCuboids(model)) !== before;
}

/** One trial on a fresh model alone in a fresh scene: the first step that fails, or null. */
function trial(slab: Slab, kind: Damage): ProofStep | null {
  const model = attempt(() => buildSlabModel(slab));
  if (model === null) {
    return "admit";
  }
  const scene = new CollisionScene();
  try {
    const handle = attempt(() => scene.registerWall(model, poseOf(slab)));
    if (handle === null) {
      return "register";
    }
    const hit = attempt(() => aim(scene, model, slab, handle));
    if (hit === null) {
      return "aim";
    }
    if (attempt(() => strike(model, hit, kind)) !== true) {
      return kind === "rail" ? "rail" : "blast";
    }
    return null;
  } finally {
    scene.dispose();
  }
}

/**
 * The destructibility proof of one slab: a rail trial, then a blast trial, each on a fresh
 * model from the shared builder. It returns the first step that fails, or null.
 */
export function proveSlab(slab: Slab): ProofStep | null {
  return trial(slab, "rail") ?? trial(slab, "blaster");
}
