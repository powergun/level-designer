import { expect, test } from "bun:test";
import {
  createChunkGeometry,
  snapshotRetainedCuboids,
  WallModel,
} from "@level-designer/destruction-gateway";

test("a 2 x 1.2 x 0.05 m model meshes to 20 triangles and snapshots its retained cuboids", () => {
  const model = new WallModel({ width: 2, height: 1.2, thickness: 0.05 });
  const triangles = model.chunks
    .map((chunk) => createChunkGeometry(model, chunk.index).surface.positions.length / 9)
    .reduce((sum, count) => sum + count, 0);
  expect(triangles).toBe(20);
  const snapshot = snapshotRetainedCuboids(model);
  expect(snapshot.chunks).toHaveLength(model.chunks.length);
  expect(snapshot.chunks.every((chunk) => chunk.boxes.length > 0)).toBe(true);
});
