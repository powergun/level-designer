import type { BaseLook, PropMeshes, SealBox, SlabLooks, SlabMesh } from "@level-designer/level-glb";

/** The base stage's triangle count, measured by the sec-111 contract research. */
export const BASE_TRIANGLES = 113_697;

/** The base stage's node count. */
export const BASE_NODES = 97;

/** The scale the description gives the base stage. */
export const BASE_SCALE = 3.89956;

/** A look over real base names: two overrides and two double-sided meshes. */
export const LOOK: BaseLook = {
  scale: BASE_SCALE,
  materials: new Map([
    ["Material.003", { tint: [0.5, 0.5, 0.5], metalness: 0.2, roughness: 0.7 }],
    ["Material", { emissive: { color: [1, 0.9, 0.8], strength: 2 } }],
  ]),
  doubleSided: ["Plane.001_Material.002_0", "factory_tube_01.001_Material.003_0"],
};

/** Two seals: the end wall and a window panel. */
export const SEALS: readonly SealBox[] = [
  {
    id: "end-wall",
    min: [-20, 0, 60],
    max: [20, 16, 60.3],
    color: "#202428",
    metalness: 0.1,
    roughness: 0.9,
  },
  {
    id: "window-a",
    min: [24, 3, 10],
    max: [24.2, 6, 14],
    color: "#ff8000",
    metalness: 0,
    roughness: 0.5,
  },
];

/** A two-triangle slab face in the plane z = `z`, painted one linear colour. */
function quadSlab(z: number, color: readonly number[], finish: string): SlabMesh {
  return {
    positions: new Float32Array([0, 0, z, 1, 0, z, 1, 1, z, 0, 1, z]),
    normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
    colors: new Float32Array([0, 1, 2, 3].flatMap(() => [...color])),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
    finish,
  };
}

/**
 * Three props: a two-slab wooden crate, a lamp whose glowing slab precedes a plain one, and a
 * sign whose brick appears only with a glow.
 */
export const PROPS: readonly PropMeshes[] = [
  {
    id: "crate-a",
    slabs: [quadSlab(1, [0.5, 0.3, 0.1], "wood"), quadSlab(2, [0.5, 0.3, 0.1], "wood")],
  },
  {
    id: "lamp-a",
    slabs: [
      { ...quadSlab(3, [0.2, 0.2, 0.2], "metal"), glow: "cyan" },
      quadSlab(4, [0.2, 0.2, 0.2], "metal"),
    ],
  },
  { id: "sign-a", slabs: [{ ...quadSlab(5, [0.4, 0.1, 0.1], "brick"), glow: "cyan" }] },
];

/** The finishes and glows the props name. */
export const LOOKS: SlabLooks = {
  finishes: {
    wood: { metalness: 0, roughness: 0.8 },
    metal: { metalness: 0.9, roughness: 0.3 },
    brick: { metalness: 0, roughness: 0.95 },
  },
  glows: new Map([["cyan", { color: [0, 0.8, 1], strength: 40 }]]),
};
