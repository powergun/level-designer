import { prepareLevel } from "@level-designer/sec111-gateway/stage";
import type { BuildError, PreparedStatic } from "./built.js";

/** The wall placements the preparation takes: none, because props are not sec-111 walls. */
const NO_WALLS = '{"walls":[]}';

/** The prepared static level, or the `prepare` error at `$`. */
export type Preparation =
  | { readonly ok: true; readonly prepared: PreparedStatic }
  | { readonly ok: false; readonly error: BuildError };

/**
 * Runs sec-111's level preparation on the static scene with the empty wall list. A thrown
 * error is the `prepare` build error; a rejection of the empty list is a defect and throws.
 */
export async function prepareStatic(staticGlb: Uint8Array): Promise<Preparation> {
  let result: Awaited<ReturnType<typeof prepareLevel>>;
  try {
    result = await prepareLevel({ stage: staticGlb, placements: NO_WALLS });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const message = `sec-111 level preparation failed: ${reason}`;
    return { ok: false, error: { rule: "prepare", path: "$", message } };
  }
  if (result.kind === "rejected") {
    throw new Error(`sec-111 rejected the empty wall list: ${JSON.stringify(result.problems)}`);
  }
  return { ok: true, prepared: { level: result.level, files: result.files } };
}
