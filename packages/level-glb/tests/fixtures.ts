import type {
  BaseLook,
  PropMeshes,
  SealBox,
  SlabLooks,
  SlabMesh,
  StaticBox,
} from "@level-designer/level-glb";

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

/**
 * Three painted seals around the flat window panel. Their extents differ on every axis, and
 * their constants reach the ranges' ends (number 0 and 999,999, seed 0 and 4,095, wear 0 and 1).
 * - `gate`: 4 x 3 x 0.3 m on the seal-only path `cladding/gate`, half lit, with the glow.
 * - `shutter`: 0.3 x 2 x 5 m on the glowing housing's path and glow, which slabs and a static
 *   object use too.
 * - `sill`: on `floor/front`, the path of `LOOK`'s hall finish on `Material.003`.
 */
export const PAINTED_SEALS: readonly SealBox[] = [
  {
    id: "gate",
    min: [-2, 0, 59.7],
    max: [2, 3, 60],
    color: "#ff8000",
    paint: { finish: "cladding/gate", glow: "cyan", number: 999_999, seed: 4095, wear: 1 },
  },
  ...SEALS.slice(1),
  {
    id: "shutter",
    min: [24, 1, 10],
    max: [24.3, 3, 15],
    color: "#808080",
    paint: { finish: "housing/machine", glow: "cyan", number: 0, seed: 0, wear: 0 },
  },
  {
    id: "sill",
    min: [-1, 0, -1],
    max: [1, 0.5, -0.8],
    color: "#336699",
    paint: { finish: "floor/front", number: 42, seed: 7, wear: 0.3 },
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

/**
 * The bodies of the four paths the props name, the static-only path and the two paths only the
 * painted seals name, and a glow.
 */
export const LOOKS: SlabLooks = {
  bodies: new Map([
    ["timber/crate", { metalness: 0, roughness: 0.8, lit: 0 }],
    ["luminaire/strip", { metalness: 0, roughness: 0.4, lit: 1 }],
    ["housing/machine", { metalness: 0.9, roughness: 0.3, lit: 0 }],
    ["housing/plate", { metalness: 0.5, roughness: 0.5, lit: 0.5 }],
    ["litter/sheet", { metalness: 0.6, roughness: 0.6, lit: 0 }],
    ["cladding/gate", { metalness: 0.7, roughness: 0.4, lit: 0.5 }],
    ["floor/front", { metalness: 0.1, roughness: 0.9, lit: 0 }],
  ]),
  glows: new Map([["cyan", { color: [0, 0.8, 1], strength: 40 }]]),
};

/** cos 30 degrees: the yawed fixture box's axes. */
const COS_30 = Math.sqrt(3) / 2;

/**
 * Three static objects. Their constants reach the ranges' ends (number 0 and 999,999, seed 0
 * and 4,095, wear 0 and 1).
 * - `sheet-a`: floor litter 0.4 x 0.12 x 1.0 m at yaw 30 on (2, 3), on a path no slab names.
 * - `sheet-b`: litter on `crate-a`'s slab 1, on the crates' path.
 * - `tag-c`: floor litter on the glowing housing's path and glow.
 */
export const STATICS: readonly StaticBox[] = [
  {
    id: "sheet-a",
    box: {
      center: [2, 0.06, 3],
      axes: [
        [COS_30, 0, -0.5],
        [0, 1, 0],
        [0.5, 0, COS_30],
      ],
      halfExtents: [0.2, 0.06, 0.5],
    },
    color: "#ff8000",
    paint: { finish: "litter/sheet", number: 999_999, seed: 4095, wear: 1 },
  },
  {
    id: "sheet-b",
    box: {
      center: [0.5, 1.01, 0.5],
      axes: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      halfExtents: [0.3, 0.01, 0.2],
    },
    color: "#336699",
    paint: { finish: "timber/crate", number: 0, seed: 0, wear: 0 },
    support: { prop: "crate-a", slab: 1 },
  },
  {
    id: "tag-c",
    box: {
      center: [-1, 0.05, -2],
      axes: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      halfExtents: [0.1, 0.05, 0.1],
    },
    color: "#808080",
    paint: { finish: "housing/machine", glow: "cyan", number: 42, seed: 7, wear: 0.3 },
  },
];
