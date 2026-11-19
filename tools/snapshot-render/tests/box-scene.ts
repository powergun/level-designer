import type { SealBox } from "@level-designer/level-glb";
import { assembleStaticScene } from "@level-designer/level-glb";

/** A box of the test scene in the level frame, with its `#rrggbb` colour. */
export interface SceneBox {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
  readonly color: string;
}

/** The bytes of a GLB with one empty scene and one empty buffer. */
function emptyStage(): Uint8Array {
  const document = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [] }],
    nodes: [],
    meshes: [],
    materials: [],
    accessors: [],
    bufferViews: [],
    buffers: [{ byteLength: 0 }],
  };
  const text = JSON.stringify(document);
  const json = new TextEncoder().encode(text.padEnd(Math.ceil(text.length / 4) * 4, " "));
  const out = new Uint8Array(12 + 8 + json.length + 8);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, out.length, true);
  view.setUint32(12, json.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  out.set(json, 20);
  view.setUint32(20 + json.length, 0, true);
  view.setUint32(24 + json.length, 0x004e4942, true);
  return out;
}

/**
 * A level GLB that holds only the given boxes, built by level-glb's own assembly: each box
 * becomes a seal of an empty base stage, so its triangles carry the box's colour.
 */
export function boxScene(boxes: readonly SceneBox[]): Uint8Array {
  const seals: SealBox[] = boxes.map((box, index) => ({
    id: `box-${index}`,
    min: box.min,
    max: box.max,
    color: box.color,
    metalness: 0,
    roughness: 1,
  }));
  const built = assembleStaticScene(
    emptyStage(),
    { scale: 1, materials: new Map(), doubleSided: [] },
    seals,
    { bodies: new Map(), glows: new Map() },
  );
  if (!built.ok) throw new Error("an empty base stage names no base material");
  return built.glb;
}
