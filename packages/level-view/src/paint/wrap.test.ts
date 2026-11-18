import { expect, test } from "bun:test";
import { BackSide, Color, DoubleSide, MeshStandardMaterial, Texture } from "three/webgpu";
import { StaticNodeMaterial } from "./static-material.js";
import { stageWrap } from "./wrap.js";

/** A hall finish with no layer: the wrap's slots do not depend on its layers. */
const PLAIN = {
  body: { shade: 1, metalness: 0, roughness: 0.6, lit: 0 },
  layers: [],
  light: "#ffffff",
};

/** An interior box of a hall, in metres. */
const HALL = { low: [-30, -2, -60], size: [60, 18, 120] } as const;

/** A textured stage material with every slot a base stage material can fill. */
function texturedSource(): MeshStandardMaterial {
  const source = new MeshStandardMaterial({
    color: new Color(0.2, 0.4, 0.6),
    map: new Texture(),
    normalMap: new Texture(),
    roughnessMap: new Texture(),
    metalnessMap: new Texture(),
    emissiveMap: new Texture(),
    aoMap: new Texture(),
    emissive: new Color(0.1, 0.05, 0),
    metalness: 0.3,
    roughness: 0.7,
    alphaTest: 0.25,
    side: DoubleSide,
  });
  source.shadowSide = BackSide;
  source.name = "Material.003";
  return source;
}

/** The slots a wrap keeps of its source: every map, factor and side. */
const KEPT = [
  "name",
  "color",
  "map",
  "normalMap",
  "normalScale",
  "roughnessMap",
  "metalnessMap",
  "emissiveMap",
  "aoMap",
  "emissive",
  "emissiveIntensity",
  "metalness",
  "roughness",
  "alphaTest",
  "side",
  "shadowSide",
] as const;

test("a wrap is a static material that keeps its source's maps, factors, side and shadow side", () => {
  const source = texturedSource();
  const wrap = stageWrap(source, { recipe: PLAIN, light: [1, 1, 1] }, HALL);
  expect(wrap).toBeInstanceOf(StaticNodeMaterial);
  for (const slot of KEPT) expect([slot, wrap[slot]]).toEqual([slot, source[slot]]);
  expect([wrap.normalNode, wrap.emissiveNode, wrap.positionNode]).toEqual([null, null, null]);
});
