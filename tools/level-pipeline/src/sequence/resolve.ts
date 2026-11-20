import { admitSlabs, parseDescription, type Description } from "@level-designer/level-format";
import { assembleStaticScene } from "@level-designer/level-glb";
import type { BuildError, BuildInputs, PreparedStatic } from "./built.js";
import { sealLooks } from "./looks.js";
import { prepareStatic } from "./prepare.js";
import { expandProps, type ExpandedProp } from "./props.js";
import { placeStatics, type Placement } from "./statics.js";

/** The dressed level before meshing, shared by the level build and the game export. */
export type Resolution =
  | { readonly ok: false; readonly errors: readonly BuildError[] }
  | {
      readonly ok: true;
      readonly description: Description;
      readonly staticGlb: Uint8Array;
      readonly prepared: PreparedStatic;
      readonly props: readonly ExpandedProp[];
      readonly placements: readonly Placement[];
    };

/** Place and admit the rounded slabs, then place the static objects over them and the stage. */
function dress(
  description: Description,
  staticGlb: Uint8Array,
  prepared: PreparedStatic,
): Resolution {
  const step = expandProps(description, prepared);
  if (!step.ok) return step;
  const errors = admitSlabs(step.props);
  if (errors.length > 0) return { ok: false, errors };
  const statics = placeStatics(description, step.props, prepared);
  if (!statics.ok) return statics;
  return {
    ok: true,
    description,
    staticGlb,
    prepared,
    props: step.props,
    placements: statics.placements,
  };
}

/** Resolve the approved object poses against the prepared stage before generating any prop mesh. */
export async function resolveDressing(
  inputs: BuildInputs,
  prepared?: PreparedStatic,
): Promise<Resolution> {
  const admission = parseDescription(new TextDecoder().decode(inputs.description));
  if (!admission.ok) return { ok: false, errors: admission.problems };
  const description = admission.value;
  const { seals, looks } = sealLooks(description);
  const scene = assembleStaticScene(inputs.baseStage, description.base, seals, looks);
  if (!scene.ok) {
    return { ok: false, errors: scene.errors.map((error) => ({ rule: "base", ...error })) };
  }
  if (prepared !== undefined) return dress(description, scene.glb, prepared);
  const preparation = await prepareStatic(scene.glb);
  if (!preparation.ok) return { ok: false, errors: [preparation.error] };
  return dress(description, scene.glb, preparation.prepared);
}
