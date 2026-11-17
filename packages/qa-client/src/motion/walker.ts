import type { Level, Vec3 } from "@level-designer/level-format";
import { slabBox } from "@level-designer/level-format";
import {
  type CapsuleBody,
  floorHeightAt,
  GAME_VALUES,
  type PhysicsWorld,
  PLAYER_BODY,
  type PreparedLevel,
} from "@level-designer/sec111-gateway";
import type { PhysicsStarter } from "../surroundings/index.js";

/** The fixed tick, seconds. */
const TICK = 1 / GAME_VALUES.tickRate;

/** The longest frame the walk catches up on, seconds: the game's frame clamp. */
const FRAME_CLAMP = 1 / GAME_VALUES.page.frameClampRate;

/** Ticks of each probe move when the capsule stands at a new point. */
const PROBE_TICKS = 10;

/** The share of a probe move's distance that a free direction covers. */
const FREE_SHARE = 0.5;

/** The fewest of the four plan directions that must be free: a corner leaves two. */
const FREE_DIRECTIONS = 2;

/** The four plan directions a new capsule is probed in, as unit `(dx, dz)`. */
const PROBE_DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** The eye above the feet, metres: the player's height times the game's eye ratio. */
export const EYE_HEIGHT: number = PLAYER_BODY.height * GAME_VALUES.player.eyeRatio;

/**
 * Walk: sec-111's player capsule in sec-111's physics world, moved at the game's fixed tick.
 * The world holds the prepared body world and one blocker box per slab of the level.
 */
export class Walker {
  private player: CapsuleBody;
  private pending = 0;

  /** Walk in `world` on `prepared`, the capsule standing at `feet`. */
  private constructor(
    private readonly world: PhysicsWorld,
    private readonly prepared: PreparedLevel,
    feet: Vec3,
  ) {
    this.player = world.createPlayer({ x: feet[0], y: feet[1], z: feet[2] });
  }

  /**
   * Start the world, install one blocker box per slab, step once so the boxes block, and stand
   * the capsule at the player spawn.
   */
  static async start(
    start: PhysicsStarter,
    prepared: PreparedLevel,
    level: Level,
  ): Promise<Walker> {
    const world = await start(prepared, TICK);
    let id = 0;
    for (const prop of level.props) {
      for (const slab of prop.slabs) {
        const box = slabBox(slab);
        const [x, y, z, w] = slab.rotation;
        const [cx, cy, cz] = box.center;
        const [hx, hy, hz] = box.halfExtents;
        const boxes = [{ center: { x: cx, y: cy, z: cz }, halfExtents: { x: hx, y: hy, z: hz } }];
        world.blockers.install(id, { rotation: { x, y, z, w }, boxes });
        id += 1;
      }
    }
    world.step();
    return new Walker(world, prepared, prepared.spawns.player);
  }

  /** The capsule's feet. */
  get feet(): Vec3 {
    const { x, y, z } = this.player.feet;
    return [x, y, z];
  }

  /** The eye above the feet. */
  get eye(): Vec3 {
    const [x, y, z] = this.feet;
    return [x, y + EYE_HEIGHT, z];
  }

  /**
   * Advance by `dt` seconds at the fixed tick, walking along the unit plan direction
   * `(dx, dz)` (zero for standing) at `speed`; a long frame catches up at most the frame clamp.
   */
  advance(dt: number, dx: number, dz: number, speed: number): void {
    this.pending = Math.min(this.pending + dt, FRAME_CLAMP);
    const step = speed * TICK;
    while (this.pending >= TICK) {
      this.pending -= TICK;
      this.player.move(dx * step, dz * step);
      this.world.step();
    }
  }

  /**
   * Stand the capsule under the camera `eye`: its feet at the eye less the eye height, never
   * below the marked floor, and gravity drops it onto whatever the body world holds below. The
   * world itself decides whether the point is sound: probe capsules move a few ticks in each plan
   * direction, and a capsule that moves freely in fewer than two is stuck. A stuck point keeps
   * the old capsule and returns false.
   */
  standAt(eye: Vec3): boolean {
    const [x, y, z] = eye;
    const feet = { x, y: Math.max(y - EYE_HEIGHT, floorHeightAt(this.prepared, x, z)), z };
    const step = GAME_VALUES.player.walkSpeed * TICK;
    let free = 0;
    for (const [dx, dz] of PROBE_DIRECTIONS) {
      const probe = this.world.createPlayer(feet);
      for (let tick = 0; tick < PROBE_TICKS; tick += 1) {
        probe.move(dx * step, dz * step);
        this.world.step();
      }
      const moved = Math.hypot(probe.feet.x - x, probe.feet.z - z);
      probe.dispose();
      if (moved >= FREE_SHARE * PROBE_TICKS * step) free += 1;
    }
    if (free < FREE_DIRECTIONS) return false;
    this.player.dispose();
    this.player = this.world.createPlayer(feet);
    this.pending = 0;
    return true;
  }
}
