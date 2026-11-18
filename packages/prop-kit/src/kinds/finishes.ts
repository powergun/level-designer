import type { SlabMaterial } from "@level-designer/level-format";

/**
 * The finish paths the kit names, `finish/role`, by the part that carries them. The names are
 * the kit's; the description's finish table defines them. See "What the kit names" in
 * @docs/researches/2026-11-17-dark-factory-look-dev/finish-format.md.
 */
export const PATHS = {
  deck: "bed/deck",
  skirt: "housing/skirt",
  housingTop: "housing/top",
  machine: "housing/machine",
  machinePlate: "housing/machine-plate",
  cabinet: "housing/cabinet",
  pedestal: "housing/pedestal",
  hoist: "housing/hoist",
  concreteWall: "cast-concrete/wall",
  concreteTop: "cast-concrete/top",
  shoulder: "casting/shoulder",
  upperArm: "casting/upper-arm",
  forearm: "casting/forearm",
  head: "casting/head",
  containerSide: "corrugated/side",
  containerRoof: "corrugated/roof",
  containerEnd: "corrugated/end",
  containerDoor: "corrugated/door",
  crate: "timber/crate",
  crateStencil: "timber/crate-stencil",
  lid: "timber/lid",
  girder: "beam/girder",
  runway: "beam/runway",
  flange: "beam/flange",
  truck: "beam/truck",
  hook: "beam/hook",
  plinth: "beam/plinth",
  mast: "beam/mast",
  mastFront: "beam/mast-front",
  boom: "beam/boom",
  tie: "beam/tie",
  strip: "luminaire/strip",
  band: "luminaire/band",
} as const;

/** A partition's finish path by its material. */
export const PARTITION_PATHS: Readonly<Record<SlabMaterial, string>> = {
  concrete: "cast-concrete/panel",
  metal: "steel-stock/stack",
  wood: "timber/stack",
  brick: "block/wall",
};
