import { CollisionScene, RapierBackend } from "@level-designer/destruction-gateway";
import type { Level } from "@level-designer/level-format";
import { buildSlabModel } from "@level-designer/slab-model";
import type { Finding } from "../finding/index.js";
import { attempt, poseOf, proveSlab } from "./trial.js";

/** `destructible`: destruction lib admits, registers, hits and damages every slab. */
export function destructible(level: Level): Finding[] {
  return level.props.flatMap((prop) =>
    prop.slabs.flatMap((slab, k): Finding[] => {
      const step = proveSlab(slab);
      if (step === null) {
        return [];
      }
      return [
        {
          rule: "destructible",
          subject: prop.id,
          message: `prop ${prop.id} slab ${k}: ${step} failed`,
        },
      ];
    }),
  );
}

/**
 * `proxies`: one Rapier sync of all slabs together builds the level's debris proxies. A slab
 * that destruction lib refuses stays out of the scene; `destructible` reports it.
 */
export async function proxies(level: Level): Promise<Finding[]> {
  const scene = new CollisionScene();
  try {
    for (const slab of level.props.flatMap((prop) => prop.slabs)) {
      const model = attempt(() => buildSlabModel(slab));
      if (model !== null) {
        attempt(() => scene.registerWall(model, poseOf(slab)));
      }
    }
    const backend = await RapierBackend.create();
    try {
      backend.syncScene(scene);
    } finally {
      backend.dispose();
    }
    return [];
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const message = `destruction lib could not build the level's debris proxies: ${reason}`;
    return [{ rule: "proxies", subject: "level", message }];
  } finally {
    scene.dispose();
  }
}
