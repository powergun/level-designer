import type { Vec3 } from "@level-designer/level-format";
import { GAME_VALUES, type PreparedLevel } from "@level-designer/sec111-gateway";
import type { MoveMode } from "../protocol/index.js";
import { type KeyState, MOVE_KEYS } from "./keys.js";
import { EYE_HEIGHT, type Walker } from "./walker.js";

/** Fly speed, and fly speed with Shift, m/s: the QA page's own values. */
const FLY_SPEED = 8;
const FLY_SPRINT_SPEED = 24;

/** Look sensitivity, radians per mouse pixel: the QA page's own value. */
const LOOK_SENSITIVITY = 0.0022;

/**
 * The page's yaw and pitch of a unit view direction in world axes: the one conversion into the
 * page convention, where yaw 0 looks along +Z and grows toward +X, and pitch is positive up.
 */
function lookOf([x, y, z]: Vec3): { readonly yaw: number; readonly pitch: number } {
  return { yaw: Math.atan2(x, z), pitch: Math.asin(y) };
}

/** The look at the start: the game's start direction, so the first frame is the player's first. */
const START_LOOK = lookOf(GAME_VALUES.player.startForward);

/** The pose of the moment: mode, eye, feet (null in fly), yaw and pitch in radians. */
export interface MotionPose {
  readonly mode: MoveMode;
  readonly eye: Vec3;
  readonly feet: Vec3 | null;
  readonly yaw: number;
  readonly pitch: number;
}

/**
 * The outcome of `V`: now walking, now flying, kept in fly outside the interior or where the
 * capsule would be stuck, or walk off.
 */
export type Switch = "walk" | "fly" | "outside" | "stuck" | "walk-off";

/**
 * Walk and fly from the held keys and the mouse, starting in the game's start look. Yaw 0 looks
 * along +Z and grows toward +X; pitch is positive up. Without a walker (the physics failed to
 * start) the page only flies.
 */
export class Motion {
  private yaw: number = START_LOOK.yaw;
  private pitch: number = START_LOOK.pitch;
  private flying: boolean;
  private flyEye: Vec3;

  /** Motion on `prepared`, walking on `walker` when it exists, else flying from the spawn. */
  constructor(
    private readonly keys: KeyState,
    private readonly prepared: PreparedLevel,
    private readonly walker: Walker | null,
  ) {
    this.flying = walker === null;
    const [x, y, z] = prepared.spawns.player;
    this.flyEye = walker?.eye ?? [x, y + EYE_HEIGHT, z];
  }

  /** Turn the view by a mouse move: right turns right, up looks up, within the pitch limit. */
  look(movementX: number, movementY: number): void {
    const limit = GAME_VALUES.player.maxPitch;
    this.yaw -= movementX * LOOK_SENSITIVITY;
    this.pitch = Math.min(limit, Math.max(-limit, this.pitch - movementY * LOOK_SENSITIVITY));
  }

  /** Advance by `dt` seconds from the held keys; `frozen` moves nothing but keeps the tick. */
  advance(dt: number, frozen: boolean): void {
    const forward = frozen ? 0 : this.keys.axis(MOVE_KEYS.forward, MOVE_KEYS.back);
    const right = frozen ? 0 : this.keys.axis(MOVE_KEYS.right, MOVE_KEYS.left);
    if (this.flying) {
      this.fly(dt, forward, right, frozen ? 0 : this.keys.axis(MOVE_KEYS.up, MOVE_KEYS.down));
      return;
    }
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    // Forward is (sin, cos) in plan; right, a quarter turn clockwise seen from above, is (-cos, sin).
    let dx = forward * sin - right * cos;
    let dz = forward * cos + right * sin;
    const length = Math.hypot(dx, dz);
    if (length > 0) {
      dx /= length;
      dz /= length;
    }
    const { walkSpeed, sprintSpeed } = GAME_VALUES.player;
    this.walker?.advance(dt, dx, dz, this.keys.sprint ? sprintSpeed : walkSpeed);
  }

  /** `V`: fly keeps the eye; walk stands a capsule that can move under the camera, or stays in fly. */
  toggle(): Switch {
    if (this.walker === null) return "walk-off";
    if (!this.flying) {
      this.flyEye = this.walker.eye;
      this.flying = true;
      return "fly";
    }
    const [x, y, z] = this.flyEye;
    const { min, max } = this.prepared.metrics.interior;
    const inside = [x, y, z].every((value, axis) => value >= min[axis]! && value <= max[axis]!);
    if (!inside) return "outside";
    if (!this.walker.standAt(this.flyEye)) return "stuck";
    this.flying = false;
    return "walk";
  }

  /** The pose of the moment. */
  pose(): MotionPose {
    const { yaw, pitch } = this;
    if (this.flying || this.walker === null) {
      return { mode: "fly", eye: this.flyEye, feet: null, yaw, pitch };
    }
    return { mode: "walk", eye: this.walker.eye, feet: this.walker.feet, yaw, pitch };
  }

  /** Fly by `dt`: forward along the view, right level, up and down along +Y. */
  private fly(dt: number, forward: number, right: number, up: number): void {
    const step = (this.keys.sprint ? FLY_SPRINT_SPEED : FLY_SPEED) * dt;
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const flat = Math.cos(this.pitch);
    const [x, y, z] = this.flyEye;
    this.flyEye = [
      x + step * (forward * sin * flat - right * cos),
      y + step * (forward * Math.sin(this.pitch) + up),
      z + step * (forward * cos * flat + right * sin),
    ];
  }
}
