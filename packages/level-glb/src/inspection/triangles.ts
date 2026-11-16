import type { GlbContainer, GltfMaterial, GltfPrimitive } from "../container/index.js";
import { readGlb } from "../container/index.js";
import { readAccessor, trianglesOf } from "./accessors.js";

/** Every drawn triangle of a GLB's default scene in world space, with its material colour. */
export interface WorldTriangles {
  /** Nine numbers per triangle: the xyz of its three corners. */
  readonly positions: Float64Array;
  /** Three numbers per triangle: its linear RGB colour. */
  readonly colors: Float32Array;
}

/** A column-major 4x4 matrix. */
type Matrix = readonly number[];

/** The identity transform. */
const IDENTITY: Matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** One primitive as drawn, with its world matrix. */
interface Draw {
  readonly world: Matrix;
  readonly primitive: GltfPrimitive;
}

/** A material's flat colour, and whether it is the emissive colour of a glowing material. */
interface FlatLook {
  readonly color: readonly number[];
  readonly glows: boolean;
}

/** The product a * b of two column-major matrices. */
function multiply(a: Matrix, b: Matrix): Matrix {
  return Array.from({ length: 16 }, (_, cell) => {
    const column = Math.floor(cell / 4);
    const row = cell % 4;
    let sum = 0;
    for (let k = 0; k < 4; k++) sum += (a[k * 4 + row] ?? 0) * (b[column * 4 + k] ?? 0);
    return sum;
  });
}

/** Every primitive the default scene draws, visiting roots then children in document order. */
function drawsOf(glb: GlbContainer): readonly Draw[] {
  const { document } = glb;
  const draws: Draw[] = [];
  const visit = (index: number, parent: Matrix): void => {
    const node = document.nodes[index];
    if (node === undefined) throw new Error(`GLB node ${index} is missing`);
    const world = multiply(parent, node.matrix ?? IDENTITY);
    const primitives = document.meshes?.[node.mesh ?? -1]?.primitives ?? [];
    for (const primitive of primitives) draws.push({ world, primitive });
    for (const child of node.children ?? []) visit(child, world);
  };
  for (const root of document.scenes[document.scene ?? 0]?.nodes ?? []) visit(root, IDENTITY);
  return draws;
}

/** A material's emissive colour when it glows: a non-black factor at a positive strength. */
function glowOf(material: GltfMaterial): readonly number[] | undefined {
  const strength = material.extensions?.KHR_materials_emissive_strength?.emissiveStrength ?? 1;
  const emissive = material.emissiveFactor ?? [];
  return strength > 0 && emissive.some((channel) => channel > 0) ? emissive : undefined;
}

/**
 * A material's flat look: its emissive colour when it glows, else its base colour factor.
 * Textures are not read. A primitive without a material takes glTF's default white.
 */
function flatLook(material: GltfMaterial | undefined): FlatLook {
  if (material === undefined) return { color: [1, 1, 1], glows: false };
  const glow = glowOf(material);
  if (glow !== undefined) return { color: glow, glows: true };
  return { color: material.pbrMetallicRoughness?.baseColorFactor ?? [1, 1, 1], glows: false };
}

/**
 * Per-vertex colours: the material's flat colour, multiplied by `COLOR_0` unless the
 * material glows.
 */
function vertexColorsOf(
  glb: GlbContainer,
  primitive: GltfPrimitive,
  vertices: number,
): Float64Array {
  const look = flatLook(glb.document.materials?.[primitive.material ?? -1]);
  const source = primitive.attributes.COLOR_0;
  const shade = look.glows || source === undefined ? undefined : readAccessor(glb, source, 3);
  return Float64Array.from({ length: vertices * 3 }, (_, at) => {
    return (look.color[at % 3] ?? 1) * (shade?.[at] ?? 1);
  });
}

/** The vertex indices of an indexed primitive; a primitive without indices fails. */
function indicesOf(glb: GlbContainer, primitive: GltfPrimitive): Float64Array {
  return readAccessor(glb, primitive.indices ?? -1, 1);
}

/** Write one draw's triangles into the outputs from triangle `first`; returns the next one. */
function writeDraw(glb: GlbContainer, draw: Draw, out: WorldTriangles, first: number): number {
  const { world, primitive } = draw;
  const local = readAccessor(glb, primitive.attributes.POSITION ?? -1, 3);
  const vertices = local.length / 3;
  const colors = vertexColorsOf(glb, primitive, vertices);
  const indices = indicesOf(glb, primitive);
  const m = (column: number, axis: number): number => world[column * 4 + axis] ?? 0;
  for (let corner = 0; corner < indices.length; corner++) {
    const vertex = (indices[corner] ?? 0) * 3;
    const [x = 0, y = 0, z = 0] = local.subarray(vertex, vertex + 3);
    const at = first * 9 + corner * 3;
    const tint = (first + Math.floor(corner / 3)) * 3;
    for (let axis = 0; axis < 3; axis++) {
      out.positions[at + axis] = m(0, axis) * x + m(1, axis) * y + m(2, axis) * z + m(3, axis);
      out.colors[tint + axis] = (out.colors[tint + axis] ?? 0) + (colors[vertex + axis] ?? 0) / 3;
    }
  }
  return first + Math.floor(indices.length / 3);
}

/**
 * Read every triangle the default scene of a GLB draws, in world space after the node
 * matrices. A triangle's colour is the mean of its corners' colours.
 */
export function readWorldTriangles(glb: Uint8Array): WorldTriangles {
  const container = readGlb(glb);
  const draws = drawsOf(container);
  const count = draws.reduce(
    (sum, draw) => sum + trianglesOf(container.document, draw.primitive),
    0,
  );
  const out = { positions: new Float64Array(count * 9), colors: new Float32Array(count * 3) };
  let next = 0;
  for (const draw of draws) next = writeDraw(container, draw, out, next);
  return out;
}
