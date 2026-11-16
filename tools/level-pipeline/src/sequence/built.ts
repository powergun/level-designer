import type { Description, Level } from "@level-designer/level-format";
import type { prepareLevel } from "@level-designer/sec111-gateway/stage";

/** The two inputs of a build: the description file's bytes and the base stage GLB bytes. */
export interface BuildInputs {
  readonly description: Uint8Array;
  readonly baseStage: Uint8Array;
}

/** sec-111's finished preparation, of which a built level keeps the typed level and its files. */
type Prepared = Extract<Awaited<ReturnType<typeof prepareLevel>>, { readonly kind: "prepared" }>;

/** The prepared static level as sec-111 returns it: typed, and as its two persisted files. */
export type PreparedStatic = Pick<Prepared, "level" | "files">;

/** The build error rules, in the order of the build steps that raise them. */
type BuildRule = "shape" | "id" | "base" | "prepare" | "place" | "kind" | "param" | "slab";

/**
 * One reason a build is blocked: its rule, the path of the offending value and the message an
 * author reads. The message starts with that path, except the slab count cap's and `prepare`'s.
 */
export interface BuildError {
  readonly rule: BuildRule;
  readonly path: string;
  readonly message: string;
}

/**
 * A built level: the typed description and its hash, the level pair with its typed level, the
 * base stage's image count and the prepared static level its props stand on.
 */
export interface BuiltLevel {
  readonly description: Description;
  readonly hash: string;
  readonly glb: Uint8Array;
  readonly json: string;
  readonly level: Level;
  readonly baseImages: number;
  readonly prepared: PreparedStatic;
}

/** The outcome of a build: the built level, or every error of the first step that has errors. */
export type BuildOutcome =
  | { readonly ok: true; readonly built: BuiltLevel }
  | { readonly ok: false; readonly errors: readonly BuildError[] };
