import { expect, test } from "bun:test";
import type { BlockerSet } from "@level-designer/sec111-gateway";
import { createPhysicsWorld, GAME_VALUES } from "@level-designer/sec111-gateway";
import { readCommittedLevel } from "@level-designer/sec111-gateway/testing";

/** Ticks of walking along +z: 2 s, about 7 m, more than any case needs to clear its boxes. */
const WALK_TICKS = 120;

/** One axis-aligned blocker box, by its centre and half extents. */
type BlockerBox = BlockerSet["boxes"][number];

/** A box from (x0, y0, z0) to (x1, y1, z1). */
function box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): BlockerBox {
  return {
    center: { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2 },
    halfExtents: { x: (x1 - x0) / 2, y: (y1 - y0) / 2, z: (z1 - z0) / 2 },
  };
}

/**
 * Walks sec-111's player capsule from the committed level's player spawn along +z for 2 s past
 * the boxes, given relative to the spawn's feet, and returns how far it got along z.
 */
async function walkPast(boxes: readonly BlockerBox[]): Promise<number> {
  const level = await readCommittedLevel();
  const [x, y, z] = level.spawns.player;
  const moved = boxes.map((b) => ({
    ...b,
    center: { x: b.center.x + x, y: b.center.y + y, z: b.center.z + z },
  }));
  const world = await createPhysicsWorld(level, 1 / GAME_VALUES.tickRate);
  try {
    const player = world.createPlayer({ x, y, z });
    world.blockers.install(1, { rotation: { x: 0, y: 0, z: 0, w: 1 }, boxes: moved });
    world.step();
    for (let tick = 0; tick < WALK_TICKS; tick++) {
      player.move(0, GAME_VALUES.player.walkSpeed / GAME_VALUES.tickRate);
      world.step();
    }
    return player.feet.z - z;
  } finally {
    world.dispose();
  }
}

/** Two 4 m wide, 2 m high, 0.05 m thick panels 2 m ahead, with a gap of `gap` between them. */
function panels(gap: number): BlockerBox[] {
  const half = gap / 2;
  return [box(-half - 4, 0, 2, -half, 2, 2.05), box(half, 0, 2, half + 4, 2, 2.05)];
}

/** A 4 m wide, 1 m deep block from 1 m ahead, spanning heights `bottom` to `top`. */
function block(bottom: number, top: number): BlockerBox[] {
  return [box(-2, bottom, 1, 2, top, 2)];
}

test("on sec-111's capsule a 0.7 m gap blocks and a 0.76 m gap lets pass", async () => {
  expect(await walkPast(panels(0.7))).toBeLessThan(2);
  expect(await walkPast(panels(0.76))).toBeGreaterThan(3);
});

test("on sec-111's capsule a 0.30 m top is climbed and a 0.5 m top blocks", async () => {
  expect(await walkPast(block(0, 0.3))).toBeGreaterThan(3);
  expect(await walkPast(block(0, 0.5))).toBeLessThan(1);
});

test("on sec-111's capsule an underside at 2.17 m lets pass", async () => {
  expect(await walkPast(block(2.17, 2.5))).toBeGreaterThan(3);
});
