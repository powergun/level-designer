import { expect, test } from "bun:test";
import { float } from "three/tsl";
import { Mesh, NodeBuilder } from "three/webgpu";
import { StaticNodeMaterial } from "./static-material.js";

/** A bare builder for observer setup; the observer reads only its material, object and context. */
class ObserverBuilder extends NodeBuilder {}

/** Whether three refreshes every draw of a node-valued static material under the context. */
function refreshesEveryDraw(context: object): boolean {
  const material = new StaticNodeMaterial();
  material.colorNode = float(0.5);
  const builder = new ObserverBuilder();
  builder.object = new Mesh();
  builder.material = material;
  builder.context = context;
  return material.setupObserver(builder).hasNode;
}

test("a static graph reports no node to refresh", () => {
  expect(refreshesEveryDraw({})).toBe(false);
});

test("a per-draw node the build injects keeps the refresh", () => {
  for (const name of ["modelViewMatrix", "modelNormalViewMatrix", "getAO", "getShadow"]) {
    expect(refreshesEveryDraw({ [name]: float(1) })).toBe(true);
  }
});
