import { expect, test } from "bun:test";
import { BackSide, Color, DoubleSide, MeshStandardMaterial } from "three/webgpu";
import { StaticNodeMaterial } from "./static-material.js";
import { paintedTwin } from "./twin.js";

/** A plain recipe with the format's default body and no layer. */
const PLAIN = {
  body: { shade: 1, metalness: 0, roughness: 0.6, lit: 0 },
  layers: [],
  light: "#ffffff",
};

test("a twin is a static material that keeps its source's colour, side and shadow side", () => {
  const source = new MeshStandardMaterial({ color: new Color(0.2, 0.4, 0.6), side: DoubleSide });
  source.shadowSide = BackSide;
  const twin = paintedTwin(source, { recipe: PLAIN, light: [1, 1, 1] });
  expect(twin).toBeInstanceOf(StaticNodeMaterial);
  expect(twin.color.toArray()).toEqual(source.color.toArray());
  expect([twin.side, twin.shadowSide]).toEqual([DoubleSide, BackSide]);
});
