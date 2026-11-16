import { canonicalLighting } from "../lighting/index.js";
import { canonicalSlab } from "../slab/index.js";
import type { Level } from "./level.js";
import { LEVEL_SCHEMA } from "./level.js";

/**
 * Encodes a level as its one canonical text: fixed key order, two-space indent and a final
 * newline. It only formats; the pipeline rounds the slabs to the grid before.
 */
export function encodeLevel(level: Level): string {
  const canonical = {
    schema: LEVEL_SCHEMA,
    props: level.props.map((prop) => ({ id: prop.id, slabs: prop.slabs.map(canonicalSlab) })),
    lighting: canonicalLighting(level.lighting),
  };
  return `${JSON.stringify(canonical, null, 2)}\n`;
}
