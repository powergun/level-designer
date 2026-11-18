import type { BaseLook, PropMeshes, SealBox, SlabLooks, SlabMesh } from "@level-designer/level-glb";

/** The base stage's triangle count, measured by the sec-111 contract research. */
export const BASE_TRIANGLES = 113_697;

/** The base stage's node count. */
export const BASE_NODES = 97;

/** The scale the description gives the base stage. */
export const BASE_SCALE = 3.89956;

/**
 * A look over real base names: two overrides and two double-sided meshes. `Material.003`
 * names a hall finish and has a twin; `Material` overrides without a finish.
 */
export const LOOK: BaseLook = {
  scale: BASE_SCALE,
  materials: new Map([
    [
      "Material.003",
      { tint: [0.5, 0.5, 0.5], metalness: 0.2, roughness: 0.7, finish: "floor/front" },
    ],
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

/** A slab's four constants: its number, seed, wear and face class. */
type SlabConstants = readonly [number, number, number, number];

/**
 * A two-triangle slab face in the plane z = `z`, painted one linear colour, with pattern
 * coordinates on both sides of 0, a face of 1 x 1 m and the slab's constants on each vertex.
 */
function quadSlab(
  z: number,
  color: readonly number[],
  finish: string,
  constants: SlabConstants,
): SlabMesh {
  const corners = [0, 1, 2, 3];
  return {
    positions: new Float32Array([0, 0, z, 1, 0, z, 1, 1, z, 0, 1, z]),
    normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
    colors: new Float32Array(corners.flatMap(() => [...color])),
    pattern: new Float32Array([-0.5, 0, 0.5, 0, 0.5, 1, -0.5, 1]),
    faceSize: new Float32Array(corners.flatMap(() => [1, 1])),
    slab: new Float32Array(corners.flatMap(() => [...constants])),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
    finish,
  };
}

/**
 * Three props over four finish paths. Their slabs' constants reach the ranges' ends (number
 * 0 and 999,999, seed 0 and 4,095, wear 0 and 1) and every face class from 0 to 5.
 * - `crate-a`: two plain crate slabs.
 * - `lamp-a`: a lit glowing strip, an unlit glowing housing, then a plain strip.
 * - `sign-a`: the glowing housing again, and a half-lit glowing plate; the housing path
 *   appears only with a glow.
 */
export const PROPS: readonly PropMeshes[] = [
  {
    id: "crate-a",
    slabs: [
      quadSlab(1, [0.5, 0.3, 0.1], "timber/crate", [0, 0, 0, 0]),
      quadSlab(2, [0.5, 0.3, 0.1], "timber/crate", [0, 0, 0, 1]),
    ],
  },
  {
    id: "lamp-a",
    slabs: [
      { ...quadSlab(3, [0.2, 0.2, 0.2], "luminaire/strip", [999_999, 4095, 1, 2]), glow: "cyan" },
      { ...quadSlab(4, [0.2, 0.2, 0.2], "housing/machine", [999_999, 4095, 1, 3]), glow: "cyan" },
      quadSlab(5, [0.2, 0.2, 0.2], "luminaire/strip", [999_999, 4095, 1, 4]),
    ],
  },
  {
    id: "sign-a",
    slabs: [
      { ...quadSlab(6, [0.4, 0.1, 0.1], "housing/machine", [42, 7, 0.3, 5]), glow: "cyan" },
      { ...quadSlab(7, [0.4, 0.1, 0.1], "housing/plate", [42, 7, 0.3, 0]), glow: "cyan" },
    ],
  },
];

/** The bodies of the four paths the props name, with `lit` at 0, one half and 1, and a glow. */
export const LOOKS: SlabLooks = {
  bodies: new Map([
    ["timber/crate", { metalness: 0, roughness: 0.8, lit: 0 }],
    ["luminaire/strip", { metalness: 0, roughness: 0.4, lit: 1 }],
    ["housing/machine", { metalness: 0.9, roughness: 0.3, lit: 0 }],
    ["housing/plate", { metalness: 0.5, roughness: 0.5, lit: 0.5 }],
  ]),
  glows: new Map([["cyan", { color: [0, 0.8, 1], strength: 40 }]]),
};
