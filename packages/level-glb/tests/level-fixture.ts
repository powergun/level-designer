import { readBaseStage } from "@level-designer/sec111-gateway/stage";
import type { StaticBox } from "@level-designer/level-glb";
import { assembleLevelScene, assembleStaticScene } from "@level-designer/level-glb";
import type { GlbContainer } from "../src/container/index.js";
import { readGlb } from "../src/container/index.js";
import type { ExpectedObject } from "./contract.js";
import { LOOK, LOOKS, PROPS, SEALS } from "./fixtures.js";

/** The fixture level scene on the real base stage, with the static scene it extends. */
export interface FixtureLevel {
  readonly staticGlb: Uint8Array;
  readonly staticScene: GlbContainer;
  readonly glb: Uint8Array;
  readonly level: GlbContainer;
}

/** Assemble the fixture seals and props, with the given static objects, on the real base stage. */
export async function assembleFixtureLevel(statics: readonly StaticBox[]): Promise<FixtureLevel> {
  const built = assembleStaticScene(await readBaseStage(), LOOK, SEALS);
  if (!built.ok) throw new Error("the fixture look names only real base names");
  const glb = assembleLevelScene(built.glb, PROPS, LOOKS, statics);
  return { staticGlb: built.glb, staticScene: readGlb(built.glb), glb, level: readGlb(glb) };
}

/** The fixture seals as the object roots the contract expects. */
export const SEAL_OBJECTS: readonly ExpectedObject[] = SEALS.map((seal) => ({
  id: seal.id,
  extras: { role: "seal" },
  meshes: 1,
}));

/** The fixture props as the object roots the contract expects. */
export const PROP_OBJECTS: readonly ExpectedObject[] = PROPS.map((prop) => ({
  id: prop.id,
  extras: { role: "destructible", prop: prop.id },
  meshes: prop.slabs.length,
}));
