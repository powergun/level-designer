import { describe } from "../log/index.js";
import type { MotionPose } from "../motion/index.js";
import type { LevelFacts, RunState } from "./run-state.js";

/** Degrees at 0.1. */
function degrees(radians: number): string {
  return ((radians * 180) / Math.PI).toFixed(1);
}

/** A point at 1 cm. */
function point(value: readonly number[]): string {
  return value.map((part) => part.toFixed(2)).join(", ");
}

/** The verdict as the display shows it. */
function verdictText(level: LevelFacts): string {
  const { verdict } = level;
  return verdict.kind === "accepted" ? "accepted" : `rejected (${verdict.findings} findings)`;
}

/** The heads-up display's text for one frame. */
function hudText(state: RunState, pose: MotionPose): string {
  const mode = state.walkOff === null ? pose.mode : `${pose.mode} (walk off)`;
  const feet = pose.feet === null ? "none" : point(pose.feet);
  const motion =
    `${mode} | eye ${point(pose.eye)} | feet ${feet} | ` +
    `yaw ${degrees(pose.yaw)} pitch ${degrees(pose.pitch)} | ${state.view.frameRate.toFixed(0)} fps`;
  const { level } = state;
  const leak = state.clearColor === "leak" ? " | leak colour" : "";
  const facts = `marks ${state.marks.count} | level ${level.name} | description ${level.description}`;
  return `${motion}${leak}\n${facts} | ${verdictText(level)}`;
}

/**
 * Run the frame loop: each animation frame advances walk or fly by the clock, draws the pose and
 * refreshes the display. A stopped drawing ends the loop; a throw in a frame raises the alarm
 * and stops it.
 */
export function startFrameLoop(state: RunState): void {
  const { clock, timers } = state.surroundings;
  const start = clock();
  let last = start;
  const frame = (): void => {
    if (state.drawing.stopped) return;
    const now = clock();
    try {
      state.motion.advance((now - last) / 1000, state.marks.open);
      const pose = state.motion.pose();
      state.view.frame({ eye: pose.eye, yaw: pose.yaw, pitch: pose.pitch }, (now - start) / 1000);
      state.display.hud(hudText(state, pose));
    } catch (thrown) {
      state.drawing.stopped = true;
      state.log.alarmed("drawing", `drawing stopped: a frame failed: ${describe(thrown)}`);
      state.display.status("drawing stopped: a frame failed; see the banner", "error");
      return;
    }
    last = now;
    timers.requestAnimationFrame(frame);
  };
  timers.requestAnimationFrame(frame);
}
