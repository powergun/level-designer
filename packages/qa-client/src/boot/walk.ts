import type { PageLog } from "../log/index.js";
import { Walker } from "../motion/index.js";
import type { PhysicsStarter } from "../surroundings/index.js";
import { describe } from "../log/index.js";
import { messageOf } from "../transport/index.js";
import type { LevelFiles } from "./files.js";
import { done, type StepOutcome } from "./steps.js";

/** The walk world, or why walk is off while fly stays. */
export type WalkWorld =
  | { readonly kind: "walk"; readonly walker: Walker }
  | { readonly kind: "walk-off"; readonly reason: string };

/**
 * Start sec-111's physics world with one blocker box per slab. A failure turns walk off and
 * keeps fly, so the step itself never ends the boot.
 */
export async function startWalk(
  start: PhysicsStarter,
  files: LevelFiles,
  log: PageLog,
): Promise<StepOutcome<WalkWorld>> {
  try {
    const walker = await Walker.start(start, files.prepared, files.level);
    const slabs = files.level.props.reduce((count, prop) => count + prop.slabs.length, 0);
    log.info(`walk world: ${slabs} slab blockers installed`);
    return done({ kind: "walk", walker });
  } catch (thrown) {
    log.warn(`walk world: ${describe(thrown)}`);
    return done({
      kind: "walk-off",
      reason: `the physics world failed to start: ${messageOf(thrown)}`,
    });
  }
}
