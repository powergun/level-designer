import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type DrawnRecipe, type Layer, parseDescription } from "@level-designer/level-format";
import {
  BoxGeometry,
  BufferAttribute,
  type Camera,
  type Material,
  type NodeBuilder,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Texture,
  WebGPURenderer,
  WGSLNodeBuilder,
} from "three/webgpu";
import { paintedTwin, type TwinLook } from "./twin.js";
import { paintLevel } from "./twins.js";
import { stageWrap } from "./wrap.js";

/** Members of three's node builder that a CPU program build sets and reads; its typings omit them. */
interface ProgramBuilder {
  scene: Scene | null;
  camera: Camera | null;
  vertexShader: string | null;
  fragmentShader: string | null;
  build(): void;
}

/** True for a node builder that builds programs; it narrows the members the typings omit. */
function buildsPrograms(builder: object): builder is ProgramBuilder {
  return "build" in builder && typeof builder.build === "function" && "fragmentShader" in builder;
}

/** A WebGPU renderer that is never initialised or disposed; construction asks for a canvas. */
function offlineRenderer(): WebGPURenderer {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    value: { createElementNS: () => ({ style: {} }) },
    configurable: true,
  });
  try {
    return new WebGPURenderer();
  } finally {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else Reflect.deleteProperty(globalThis, "document");
  }
}

/** A box with the four vertex attributes of a painted slab, by the loader's names. */
function slabGeometry(): BoxGeometry {
  const geometry = new BoxGeometry(2, 1.2, 0.2);
  const count = geometry.getAttribute("position").count;
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("uv1", new BufferAttribute(new Float32Array(count * 2), 2));
  geometry.setAttribute("_slab", new BufferAttribute(new Float32Array(count * 4), 4));
  return geometry;
}

const renderer = offlineRenderer();
const geometry = slabGeometry();

/** An interior box of a hall, in metres. */
const HALL = { low: [-30, -2, -60], size: [60, 18, 120] } as const;

/** A program builder for a material on a slab, ready to build on the CPU. */
function programBuilder(material: Material): ProgramBuilder & NodeBuilder {
  const builder = new WGSLNodeBuilder(new Mesh(geometry, material), renderer);
  if (!buildsPrograms(builder)) throw new Error("Expected a node builder that builds programs");
  builder.scene = new Scene();
  builder.camera = new PerspectiveCamera();
  return builder;
}

/** The WGSL programs of a material on a slab, built on the CPU as the renderer builds them. */
function programsOf(material: Material): { readonly vertex: string; readonly fragment: string } {
  const builder = programBuilder(material);
  builder.build();
  return { vertex: builder.vertexShader ?? "", fragment: builder.fragmentShader ?? "" };
}

/** The WGSL programs of a twin of a look on a slab. */
function twinPrograms(look: TwinLook): { readonly vertex: string; readonly fragment: string } {
  return programsOf(paintedTwin(new MeshStandardMaterial(), look));
}

/**
 * The twins that `paintLevel` gives a slab of each path of the committed description's
 * table, by path; a path whose material stays has none.
 */
function committedTwins(): ReadonlyMap<string, Material> {
  const file = join(import.meta.dir, "../../../../levels/dark-factory.json");
  const admission = parseDescription(readFileSync(file, "utf8"));
  if (!admission.ok) throw new Error("Expected the committed description to be admitted");
  const table = admission.value.finishes;
  const twins = new Map<string, Material>();
  for (const [finish, { roles }] of table) {
    for (const role of roles.keys()) {
      const source = new MeshStandardMaterial();
      source.userData = { finish: `${finish}/${role}` };
      const slab = new Mesh(geometry, source);
      paintLevel(slab, table, HALL);
      if (slab.material !== source) twins.set(`${finish}/${role}`, slab.material);
    }
  }
  return twins;
}

/** The format's default body. */
const PLAIN_BODY = { shade: 1, metalness: 0, roughness: 0.6, lit: 0 };

/** A length of plain metres. */
const m = (metres: number) => ({ metres });

/** A noise layer that shades by its coverage, at a wavelength in metres. */
function noiseLayer(wavelength: number): Layer {
  return {
    pattern: { kind: "noise", wavelength: [m(wavelength), m(wavelength)] },
    on: "all",
    wear: true,
    amount: 1,
    effects: { shade: 0.8 },
  };
}

/**
 * A wearing rectangle on the outside, sized by shares of the face, and two noise layers: it
 * reads the face's size, its class, its wear and its seed.
 */
const FACE_READING: DrawnRecipe = {
  body: PLAIN_BODY,
  light: "#ffffff",
  layers: [
    {
      pattern: {
        kind: "rectangle",
        from: [{ metres: 0, share: { of: "w", factor: -0.25 } }, m(0)],
        to: [
          { metres: 0, share: { of: "w", factor: 0.25 } },
          { metres: 0, share: { of: "h", factor: 0.5 } },
        ],
      },
      on: "outside",
      wear: true,
      amount: 1,
      effects: { color: "glow" },
    },
    noiseLayer(0.5),
    noiseLayer(2),
  ],
};

/** A length of a share of the face's width or height, plus metres. */
const share = (of: "w" | "h", factor: number, metres = 0) => ({ metres, share: { of, factor } });

/**
 * One layer of each kind, together holding every optional key and every effect: fitted and
 * diagonal bands with a ramp, fitted dots, a rectangle of shares, and a noise mask.
 */
const EVERY_KEY: DrawnRecipe = {
  body: { shade: 0.9, metalness: 0.3, roughness: 0.5, lit: 0 },
  light: "#ffd8a0",
  layers: [
    {
      pattern: {
        kind: "bands",
        along: "across",
        fit: true,
        period: share("w", 0.1),
        width: m(0.02),
        phase: 0.25,
        offset: share("h", 0.1, 0.01),
        ramp: m(0.005),
      },
      on: "sides",
      across: "ends",
      up: "top",
      clip: { from: [m(0), share("h", 0.1)], to: [share("w", 0.5), share("h", 0.9)] },
      detail: "fine",
      wear: true,
      amount: 0.7,
      effects: {
        shade: 0.6,
        paint: 1.2,
        color: "#c08040",
        metalness: 0.9,
        roughness: 0.2,
        lit: 0.5,
      },
    },
    {
      pattern: {
        kind: "bands",
        along: "diagonal",
        period: m(0.3),
        width: m(0.15),
        phase: 0,
        offset: m(0),
        ramp: m(0),
      },
      on: "edges",
      detail: "medium",
      wear: false,
      amount: 1,
      effects: { color: "glow", lit: 1 },
    },
    {
      pattern: {
        kind: "dots",
        pitch: [m(0.05), m(0.05)],
        radius: m(0.01),
        phase: [0, 0],
        offset: [m(0), m(0)],
        fit: "both",
      },
      on: "all",
      across: "out",
      wear: false,
      amount: 1,
      effects: { roughness: 0.9 },
    },
    {
      pattern: {
        kind: "rectangle",
        from: [share("w", -0.5), m(0)],
        to: [share("w", 0.5, -0.01), share("h", 1)],
      },
      on: "end+",
      wear: false,
      amount: 1,
      effects: { color: "#ffffff" },
    },
    {
      pattern: {
        kind: "noise",
        wavelength: [m(0.3), share("h", 0.5)],
        mask: { threshold: 0.6, softness: 0.1 },
      },
      on: "bottom",
      wear: true,
      amount: 1,
      effects: { shade: 0.4, roughness: 1 },
    },
  ],
};

/** The face data's varyings a fragment program declares, each with its interpolation. */
function faceVaryings(fragment: string): string[] {
  const declared = /(@interpolate\(\s*flat\s*\)\s*)?(vFaceSize|vSlab)\s*:/g;
  return [...fragment.matchAll(declared)].map(
    (found) => `${found[1] ? "flat" : "smooth"} ${found[2]}`,
  );
}

describe("the twins' programs", () => {
  test("every twin of the committed table builds both programs", () => {
    const twins = committedTwins();
    expect(twins.size).toBeGreaterThan(0);
    for (const twin of twins.values()) {
      const { vertex, fragment } = programsOf(twin);
      expect(vertex).toContain("fn main");
      expect(fragment).toContain("fn main");
      expect(faceVaryings(fragment).every((varying) => varying.startsWith("flat"))).toBe(true);
    }
  });

  test("a recipe that reads the face declares its size and the slab numbers flat", () => {
    for (const recipe of [FACE_READING, EVERY_KEY]) {
      const { vertex, fragment } = twinPrograms({ recipe, light: [1, 1, 1] });
      expect(vertex).toContain("fn main");
      expect(faceVaryings(fragment).toSorted()).toEqual(["flat vFaceSize", "flat vSlab"]);
    }
  });

  test("the vertex colour enters the fragment once", () => {
    const { vertex, fragment } = twinPrograms({
      recipe: { body: PLAIN_BODY, layers: [], light: "#ffffff" },
      light: [1, 1, 1],
    });
    const varying = /varyings\.(\w+)\s*=\s*vec4<f32>\(\s*color\b/.exec(vertex)?.[1];
    expect(varying).toBeDefined();
    const main = fragment.slice(fragment.indexOf("fn main"));
    expect(main.match(new RegExp(`\\b${varying}\\b`, "g"))).toHaveLength(2);
  });

  test("the hash is one shader function that each of two noise layers calls four times", () => {
    const recipe = { body: PLAIN_BODY, layers: [noiseLayer(0.5), noiseLayer(2)], light: "#ffffff" };
    const { fragment } = twinPrograms({ recipe, light: [1, 1, 1] });
    expect(fragment.match(/fn finishLatticeHash\s*\(/g)).toHaveLength(1);
    expect(fragment.match(/finishLatticeHash\(/g)).toHaveLength(8);
    const body = fragment.slice(
      fragment.indexOf("fn finishLatticeHash"),
      fragment.indexOf("fn main"),
    );
    expect(body).toContain("0.1031");
    expect(body).toContain("31.32");
  });

  test("a glow emits its colour times its strength, and a plain twin emits no glow", () => {
    const recipe = { body: { ...PLAIN_BODY, lit: 1 }, layers: [], light: "#ffffff" };
    const glow = { color: [1, 0.5, 0.25] as const, strength: 8 };
    const lit = twinPrograms({ recipe, light: glow.color, glow }).fragment;
    const plain = twinPrograms({ recipe, light: [1, 1, 1] }).fragment;
    expect(lit).toContain("vec3<f32>( 8.0, 4.0, 2.0 )");
    expect(plain).not.toContain("vec3<f32>( 8.0, 4.0, 2.0 )");
  });
});

/**
 * A hall finish with one layer of each kind a hall role uses: floor joints of cells and a
 * floor line on `top`, a dado border on `outside`, and wear noise on every face.
 */
const HALL_FINISH: DrawnRecipe = {
  body: PLAIN_BODY,
  light: "#ffffff",
  layers: [
    {
      pattern: { kind: "cells", width: m(5), height: m(5), gap: m(0.015), shift: 0, share: 0 },
      on: "top",
      detail: "medium",
      wear: false,
      amount: 1,
      effects: { shade: 0.6 },
    },
    {
      pattern: { kind: "rectangle", from: [m(-2.65), m(-27)], to: [m(-2.55), m(29.5)] },
      on: "top",
      wear: false,
      amount: 1,
      effects: { color: "#9c7618" },
    },
    {
      pattern: { kind: "border", width: { ends: m(0), top: m(0), base: m(1.2) }, inset: m(0) },
      on: "outside",
      wear: false,
      amount: 1,
      effects: { shade: 0.5, roughness: 0.9 },
    },
    noiseLayer(4),
  ],
};

/**
 * The renderer's feature query, answered false: a textured material asks it while it builds,
 * before a backend exists. It is the one stub of a program build.
 */
function withoutFeatures<T>(build: () => T): T {
  const previous = Object.getOwnPropertyDescriptor(renderer, "hasFeature");
  Object.defineProperty(renderer, "hasFeature", { value: () => false, configurable: true });
  try {
    return build();
  } finally {
    if (previous) Object.defineProperty(renderer, "hasFeature", previous);
    else Reflect.deleteProperty(renderer, "hasFeature");
  }
}

/** A textured stage material: a colour map, a roughness and metalness map and a normal map. */
function texturedStage(): MeshStandardMaterial {
  const map = new Texture();
  const roughnessMap = new Texture();
  const normalMap = new Texture();
  return new MeshStandardMaterial({ map, roughnessMap, metalnessMap: roughnessMap, normalMap });
}

/** The textured wrap of the hall finish and its builder, after a CPU build of its programs. */
function builtWrap(): {
  readonly wrap: ReturnType<typeof stageWrap>;
  readonly builder: ProgramBuilder & NodeBuilder;
} {
  const wrap = stageWrap(texturedStage(), { recipe: HALL_FINISH, light: [1, 1, 1] }, HALL);
  const builder = programBuilder(wrap);
  withoutFeatures(() => builder.build());
  return { wrap, builder };
}

describe("the stage wrap's program", () => {
  test("a textured wrap of a hall finish builds both programs on the CPU", () => {
    const { builder } = builtWrap();
    const fragment = builder.fragmentShader ?? "";
    expect(builder.vertexShader).toContain("fn main");
    expect(fragment).toContain("fn main");
    expect(fragment).toContain("textureSample");
    expect(fragment).toContain("finishLatticeHash(");
    expect(faceVaryings(fragment)).toEqual([]);
  });

  test("the wrapped graph reports no node to refresh", () => {
    const { wrap, builder } = builtWrap();
    expect(wrap.setupObserver(builder).hasNode).toBe(false);
  });
});
