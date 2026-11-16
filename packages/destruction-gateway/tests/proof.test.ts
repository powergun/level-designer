import { expect, test } from "bun:test";
import type { RigidTransform } from "@level-designer/destruction-gateway";
import {
  CollisionScene,
  createDamageBudget,
  createPointContact,
  RapierBackend,
  rotateVector,
  toLocalPoint,
  toWorldPoint,
  WallModel,
} from "@level-designer/destruction-gateway";

/** A slab yawed 90 degrees about +Y and lifted, so its front face looks along world +X. */
const POSE: RigidTransform = {
  position: { x: 3, y: 1, z: -2 },
  rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
};

test("one cast hits a posed slab and one rail removes material", async () => {
  const model = new WallModel({ width: 2, height: 1.2, thickness: 0.05 });
  const scene = new CollisionScene();
  const handle = scene.registerWall(model, POSE);
  // Aim at the front face centre from 0.2 m outside it, in world space.
  const target = toWorldPoint({ x: 0, y: 0.6, z: 0.025 }, POSE, { x: 0, y: 0, z: 0 });
  const outward = rotateVector({ x: 0, y: 0, z: 0.2 }, POSE.rotation, { x: 0, y: 0, z: 0 });
  const from = { x: target.x + outward.x, y: target.y + outward.y, z: target.z + outward.z };
  const behind = { x: target.x - outward.x, y: target.y - outward.y, z: target.z - outward.z };
  const contact = createPointContact();
  scene.prepare();
  expect(scene.castSegment(from, behind, contact)).toBe(true);
  scene.endBatch();
  expect(contact.obstacle).toEqual(handle);
  const origin = toLocalPoint(from, POSE, { x: 0, y: 0, z: 0 });
  const hit = model.raycast({ origin, direction: { x: 0, y: 0, z: -1 } });
  if (hit === null) throw new Error("the local ray missed the slab");
  const rail = model.collectDamage(hit, "rail", false, createDamageBudget());
  expect(rail.applied).toBe(true);
  expect(rail.changed).toBe(true);
  expect(model.materialAt(hit.local.x, hit.local.y, hit.local.z)).toBe(false);
  const backend = await RapierBackend.create();
  backend.syncScene(scene);
  expect(backend.stats.staticColliders).toBeGreaterThan(0);
  backend.dispose();
  scene.dispose();
});
