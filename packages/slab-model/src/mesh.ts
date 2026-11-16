import {
  createChunkGeometry,
  rotateVector,
  toWorldPoint,
} from "@level-designer/destruction-gateway";
import type { MeshData, RigidTransform } from "@level-designer/destruction-gateway";
import type { Slab } from "@level-designer/level-format";
import { buildSlabModel } from "./model.js";

/**
 * The intact indexed mesh of one slab in level coordinates: xyz positions and unit normals,
 * linear RGB colours per vertex, and triangle indices.
 */
interface IntactMesh {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly colors: Float32Array;
  readonly indices: Uint32Array;
}

/** The surfaces of every chunk of the slab's model, in slab-local metres. */
function chunkSurfaces(slab: Slab): MeshData[] {
  const model = buildSlabModel(slab);
  return model.chunks.map((chunk) => createChunkGeometry(model, chunk.index).surface);
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

/**
 * The slab's intact mesh: destruction lib's wall mesher over every chunk of the shared
 * builder's model, moved by the slab's pose. Colours are the mesher's, already linear; each
 * triangle keeps its own three vertices.
 */
export function meshSlab(slab: Slab): IntactMesh {
  const surfaces = chunkSurfaces(slab);
  const length = surfaces.reduce((sum, surface) => sum + surface.positions.length, 0);
  const [px, py, pz] = slab.position;
  const [qx, qy, qz, qw] = slab.rotation;
  const pose: RigidTransform = {
    position: { x: px, y: py, z: pz },
    rotation: { x: qx, y: qy, z: qz, w: qw },
  };
  const positions = new Float32Array(length);
  const normals = new Float32Array(length);
  const colors = new Float32Array(length);
  let offset = 0;
  for (const surface of surfaces) {
    moveTriples(surface.positions, positions, offset, (v) => toWorldPoint(v, pose, v));
    moveTriples(surface.normals, normals, offset, (v) => rotateVector(v, pose.rotation, v));
    colors.set(surface.colors, offset);
    offset += surface.positions.length;
  }
  const indices = Uint32Array.from({ length: length / 3 }, (_, i) => i);
  return { positions, normals, colors, indices };
}
