import { createHash } from "node:crypto";
import { admitSlabs, encodeLevel, parseDescription } from "@level-designer/level-format";
import type { Description, Level } from "@level-designer/level-format";
import { assembleStaticScene, inspectGlb } from "@level-designer/level-glb";
import type { BuildError, BuildInputs, BuildOutcome, PreparedStatic } from "./built.js";
import { prepareStatic } from "./prepare.js";
import { expandProps } from "./props.js";
import { levelScene } from "./scene.js";

/** The hex digits of the description hash: the head of the file's SHA-256. */
const HASH_DIGITS = 12;

/** The blocked outcome of a step's errors. */
function blocked(errors: readonly BuildError[]): BuildOutcome {
  return { ok: false, errors };
}

/** The static scene of the description, or every `base` error. */
function staticScene(
  baseStage: Uint8Array,
  description: Description,
): { readonly ok: true; readonly glb: Uint8Array } | { readonly ok: false; errors: BuildError[] } {
  const scene = assembleStaticScene(baseStage, description.base, description.seals);
  if (scene.ok) return scene;
  return { ok: false, errors: scene.errors.map((error) => ({ rule: "base", ...error })) };
}

/** The props, the slab admission and the pair, on the given prepared static level. */
function dress(
  inputs: BuildInputs,
  description: Description,
  staticGlb: Uint8Array,
  prepared: PreparedStatic,
): BuildOutcome {
  const step = expandProps(description, prepared);
  if (!step.ok) return blocked(step.errors);
  const props = step.props.map((prop) => ({
    id: prop.id,
    slabs: prop.slabs.map(({ slab }) => slab),
  }));
  const slabErrors = admitSlabs(props);
  if (slabErrors.length > 0) return blocked(slabErrors);
  const level: Level = { props, lighting: description.lighting };
  const hash = createHash("sha256").update(inputs.description).digest("hex");
  const built = {
    description,
    hash: hash.slice(0, HASH_DIGITS),
    glb: levelScene(staticGlb, step.props, description),
    json: encodeLevel(level),
    level,
    baseImages: inspectGlb(inputs.baseStage).images,
    prepared,
  };
  return { ok: true, built };
}

/**
 * Builds a level in six steps: admit the description, assemble the static scene, prepare it,
 * expand and round the props, mesh the slabs and write the pair. The build stops at the first
 * step with errors and returns all of them. A given prepared static level replaces the
 * preparation; it must be the preparation of the same static scene.
 */
export async function buildLevel(
  inputs: BuildInputs,
  prepared?: PreparedStatic,
): Promise<BuildOutcome> {
  const admission = parseDescription(new TextDecoder().decode(inputs.description));
  if (!admission.ok) return blocked(admission.problems);
  const description = admission.value;
  const scene = staticScene(inputs.baseStage, description);
  if (!scene.ok) return blocked(scene.errors);
  if (prepared !== undefined) return dress(inputs, description, scene.glb, prepared);
  const preparation = await prepareStatic(scene.glb);
  if (!preparation.ok) return blocked([preparation.error]);
  return dress(inputs, description, scene.glb, preparation.prepared);
}
