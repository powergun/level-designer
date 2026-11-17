import { expect, test } from "bun:test";
import type { BlockerSet } from "@level-designer/sec111-gateway";
import {
  createPhysicsWorld,
  decodePreparedLevel,
  floorHeightAt,
  GAME_VALUES,
} from "@level-designer/sec111-gateway";
import { readBaseStage } from "@level-designer/sec111-gateway/stage";
import { readCommittedFiles, readCommittedLevel } from "@level-designer/sec111-gateway/testing";

/** The GLB container magic, `glTF` as a little-endian word. */
const GLB_MAGIC = 0x46546c67;

/** How far ahead of the player spawn the panel's centre plane stands, metres. */
const PANEL_AHEAD = 2;

/** Ticks of walking toward the panel: 2 s, more than the walk needs to reach it. */
const WALK_TICKS = 120;

test("the stage entry reads the base stage and the testing entry the committed level", async () => {
  const stage = await readBaseStage();
  expect(new DataView(stage.buffer, stage.byteOffset).getUint32(0, true)).toBe(GLB_MAGIC);
  const level = await readCommittedLevel();
  expect(level.spawns.minions.length).toBeGreaterThan(0);
  // The committed level's two files decode through the main entry, as the QA page decodes them.
  const files = await readCommittedFiles();
  const decoded = decodePreparedLevel(files.document, files.navMesh);
  expect(decoded.spawns.minions.length).toBeGreaterThan(0);
});

test("a capsule stops before an installed panel and walks on after its removal", async () => {
  const level = await readCommittedLevel();
  const [x, y, z] = level.spawns.player;
  const panelZ = z + PANEL_AHEAD;
  const floor = floorHeightAt(level, x, z);
  // An upright 4 x 2 x 0.05 m panel across the path, standing on the floor.
  const panel: BlockerSet = {
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    boxes: [{ center: { x, y: floor + 1, z: panelZ }, halfExtents: { x: 2, y: 1, z: 0.025 } }],
  };
  const world = await createPhysicsWorld(level, 1 / GAME_VALUES.tickRate);
  const player = world.createPlayer({ x, y, z });
  const walk = (): void => {
    for (let tick = 0; tick < WALK_TICKS; tick++) {
      player.move(0, GAME_VALUES.player.walkSpeed / GAME_VALUES.tickRate);
      world.step();
    }
  };
  world.blockers.install(1, panel);
  world.step();
  walk();
  // Unblocked, the walk covers 7 m; the panel holds the capsule on its near side.
  expect(player.feet.z).toBeLessThan(panelZ);
  expect(player.feet.z).toBeGreaterThan(z + 1);
  world.blockers.remove(1);
  walk();
  expect(player.feet.z).toBeGreaterThan(panelZ + 1);
  world.dispose();
});
