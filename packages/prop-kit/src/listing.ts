import type { ParamSpec } from "./admit/index.js";
import { KINDS } from "./kinds/index.js";

/** One parameter of a kind as the kind listing shows it: its name and its spec. */
export type ParamListing = { readonly name: string } & ParamSpec;

/** One kind as the kind listing shows it: its name and its parameters in table order. */
export interface KindListing {
  readonly name: string;
  readonly params: readonly ParamListing[];
}

/** Every kind with its parameters, ranges, choices and defaults, in the format's order. */
export function listKinds(): readonly KindListing[] {
  return KINDS.map((kind) => ({
    name: kind.name,
    params: Object.entries(kind.params).map(([name, spec]) => ({ name, ...spec })),
  }));
}
