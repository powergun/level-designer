import { createHash } from "node:crypto";
import { encodeLevel, type Level } from "@level-designer/level-format";
import { inspectGlb } from "@level-designer/level-glb";
import type { BuildInputs, BuildOutcome, PreparedStatic } from "./built.js";
import { resolveDressing } from "./resolve.js";
import { levelScene } from "./scene.js";

/** The hex digits of the description hash: the head of the file's SHA-256. */
const HASH_DIGITS = 12;

/** Build the pair from the placed dressing. A supplied preparation must match the static scene. */
export async function buildLevel(
  inputs: BuildInputs,
  prepared?: PreparedStatic,
): Promise<BuildOutcome> {
  const resolved = await resolveDressing(inputs, prepared);
  if (!resolved.ok) return resolved;
  const { description, props, placements, staticGlb } = resolved;
  const level: Level = {
    finishes: description.finishes,
    props: props.map(({ id, slabs }) => ({ id, slabs })),
    lighting: description.lighting,
  };
  const hash = createHash("sha256").update(inputs.description).digest("hex");
  const built = {
    description,
    hash: hash.slice(0, HASH_DIGITS),
    glb: levelScene(staticGlb, props, placements, description),
    json: encodeLevel(level),
    level,
    baseImages: inspectGlb(inputs.baseStage).images,
    prepared: resolved.prepared,
    placed: placements.map(({ object, box }) => ({ object, box })),
  };
  return { ok: true, built };
}
