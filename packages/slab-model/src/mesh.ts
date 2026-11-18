import {
  createChunkGeometry,
  rotateVector,
  toWorldPoint,
} from "@level-designer/destruction-gateway";
import type { MeshData, RigidTransform, WallModel } from "@level-designer/destruction-gateway";
import { slabFrame } from "@level-designer/finish-paint";
import type { Slab } from "@level-designer/level-format";
import { buildSlabModel } from "./model.js";

/**
 * The intact indexed mesh of one slab in level coordinates: xyz positions and unit normals,
 * the slab's linear RGB colour, and per vertex its face's pattern coordinates, its face's
 * width and height, and the slab's number, seed and wear with the face's class.
 */
interface IntactMesh {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly colors: Float32Array;
  readonly pattern: Float32Array;
  readonly faceSize: Float32Array;
  readonly slab: Float32Array;
  readonly indices: Uint32Array;
}

/** Writes the xyz triples of `local` into `world` at `offset`, each moved by `move`. */
function moveTriples(
  local: Float32Array,
  world: Float32Array,
  offset: number,
  move: (v: { x: number; y: number; z: number }) => void,
): void {
  const v = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < local.length; i += 3) {
    v.x = local[i] ?? 0;
    v.y = local[i + 1] ?? 0;
    v.z = local[i + 2] ?? 0;
    move(v);
    world[offset + i] = v.x;
    world[offset + i + 1] = v.y;
    world[offset + i + 2] = v.z;
  }
}

/** The xyz triple of vertex `i` of a slab-local array. */
function tripleAt(values: Float32Array, i: number): readonly [number, number, number] {
  return [values[3 * i] ?? 0, values[3 * i + 1] ?? 0, values[3 * i + 2] ?? 0];
}

/**
 * Writes the slab data of one surface from its slab-local vertices, starting at `vertex`:
 * the model's linear base colour, the face's frame by finish-paint's slab frame rule, and
 * the slab's number, seed and wear with the face's class.
 */
function writeSlabData(
  slab: Slab,
  model: WallModel,
  surface: MeshData,
  mesh: IntactMesh,
  vertex: number,
): void {
  const { r, g, b } = model.baseColor;
  for (let i = 0; i < surface.positions.length / 3; i++) {
    const v = vertex + i;
    const face = slabFrame(slab.size, tripleAt(surface.positions, i), tripleAt(surface.normals, i));
    mesh.colors.set([r, g, b], 3 * v);
    mesh.pattern.set([face.x, face.y], 2 * v);
    mesh.faceSize.set([face.width, face.height], 2 * v);
    mesh.slab.set([slab.number, slab.seed, slab.wear, face.faceClass], 4 * v);
  }
}

/**
 * The slab's intact mesh: destruction lib's wall mesher over every chunk of the shared
 * builder's model, moved by the slab's pose. Each triangle keeps its own three vertices, and
 * every vertex carries the slab's colour and its face's finish data.
 */
export function meshSlab(slab: Slab): IntactMesh {
  const model = buildSlabModel(slab);
  const surfaces = model.chunks.map((chunk) => createChunkGeometry(model, chunk.index).surface);
  const vertices = surfaces.reduce((sum, surface) => sum + surface.positions.length / 3, 0);
  const [px, py, pz] = slab.position;
  const [qx, qy, qz, qw] = slab.rotation;
  const pose: RigidTransform = {
    position: { x: px, y: py, z: pz },
    rotation: { x: qx, y: qy, z: qz, w: qw },
  };
  const mesh: IntactMesh = {
    positions: new Float32Array(3 * vertices),
    normals: new Float32Array(3 * vertices),
    colors: new Float32Array(3 * vertices),
    pattern: new Float32Array(2 * vertices),
    faceSize: new Float32Array(2 * vertices),
    slab: new Float32Array(4 * vertices),
    indices: Uint32Array.from({ length: vertices }, (_, i) => i),
  };
  let vertex = 0;
  for (const surface of surfaces) {
    const offset = 3 * vertex;
    moveTriples(surface.positions, mesh.positions, offset, (v) => toWorldPoint(v, pose, v));
    moveTriples(surface.normals, mesh.normals, offset, (v) => rotateVector(v, pose.rotation, v));
    writeSlabData(slab, model, surface, mesh, vertex);
    vertex += surface.positions.length / 3;
  }
  return mesh;
}
