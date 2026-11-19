/**
 * The build fixture: the real base stage at its scale under a flat end-wall seal and a painted
 * door seal, with one crate on each floor level, a floor litter, a hung sign, a litter on a crate
 * and one point light. Tests vary it by replacing root keys.
 */

/** One prop record of a description. */
export interface PropRecord {
  readonly id: string;
  readonly kind: string;
  readonly at: readonly [number, number];
  readonly yaw: number;
  readonly params: Readonly<Record<string, unknown>>;
}

/** A crate of the default size at `at`, turned by `yaw`. */
export function crate(id: string, at: readonly [number, number], yaw = 0): PropRecord {
  return { id, kind: "crate", at, yaw, params: { color: "#6b4a2b" } };
}

/** The front floor's crate, off the grid at an odd yaw, so its slabs need rounding. */
export const FRONT_CRATE: PropRecord = crate("front-crate", [-5.03217, 10.00001], 17);

/** The raised slab's crate, in the cross lane. */
export const SLAB_CRATE: PropRecord = crate("slab-crate", [0, -55]);

/** One static object record of a description, its paint keys left to their defaults. */
export interface StaticRecord {
  readonly id: string;
  readonly at: readonly [number, number];
  readonly yaw: number;
  readonly size: readonly [number, number, number];
  readonly lift?: number;
  readonly on?: string;
  readonly color: string;
  readonly finish: string;
}

/** A sheet of litter on the front floor, off the ramp, turned askew. */
export const FLOOR_SHEET: StaticRecord = {
  id: "floor-sheet",
  at: [3, 5],
  yaw: 31,
  size: [0.6, 0.02, 0.4],
  color: "#8b9097",
  finish: "litter/sheet",
};

/** A sign board hung 4 m over the front floor, above the hang height over the raised slab. */
export const HUNG_SIGN: StaticRecord = {
  id: "hung-sign",
  at: [0, 0],
  yaw: 90,
  size: [1.6, 0.8, 0.06],
  lift: 4,
  color: "#9a2a1c",
  finish: "litter/board",
};

/**
 * A sheet on the raised slab's crate, over its +X side: the side's top (1.15 m) and the lid
 * (1.2 m) both lie under its `at`, which sits mid-panel, 0.025 m inside the crate's edge.
 */
export const CRATE_SHEET: StaticRecord = {
  id: "crate-sheet",
  on: SLAB_CRATE.id,
  at: [0.575, -55],
  yaw: 20,
  size: [0.3, 0.02, 0.2],
  color: "#d8d2c0",
  finish: "litter/sheet",
};

/** The one glow the light strips and the door seal name. */
const CYAN_GLOWS = { cyan: { color: [0, 0.8, 1], strength: 4 } } as const;

/**
 * A painted seal in the committed door's box, glowing `cyan`, its constants left to their
 * defaults. Its role extends another, so only the table's reading yields its body.
 */
export const DOOR_SEAL = {
  id: "door-plus-x",
  min: [16.06, -0.1, -15.25],
  max: [16.36, 7.35, -7.8],
  color: "#55595d",
  finish: "shutter/door",
  glow: "cyan",
} as const;

/** The body the door seal's role extends: neither the default nor any other role's. */
export const SHUTTER_BODY = { metalness: 0.5, roughness: 0.45, lit: 0.5 } as const;

/** The fixture description as a JSON value. */
export const FIXTURE = {
  schema: "level-designer-description/1",
  name: "fixture",
  base: { scale: 3.89956, materials: {}, doubleSided: [] },
  seals: [
    {
      id: "end-wall",
      min: [-17, -0.5, 30.27],
      max: [17, 19.2, 30.6],
      color: "#2a2d31",
      metalness: 0.2,
      roughness: 0.8,
    },
    DOOR_SEAL,
  ],
  finishes: {
    timber: {
      cut: { family: "wood", color: "#6b4a2b" },
      light: "#7ccbd6",
      roles: {
        "crate-stencil": { body: { roughness: 0.9 } },
        crate: { body: { roughness: 0.9 } },
        lid: { body: { roughness: 0.9 } },
      },
    },
    litter: {
      cut: { family: "metal", color: "#5a5d61" },
      light: "#7ccbd6",
      roles: { sheet: { body: { metalness: 0.6 } }, board: { body: { roughness: 0.7 } } },
    },
    luminaire: {
      cut: { family: "metal", color: "#5a5d61" },
      light: "#7ccbd6",
      roles: { strip: { body: { metalness: 0.8, roughness: 0.4, lit: 1 } } },
    },
    shutter: {
      cut: { family: "metal", color: "#5a5d61" },
      light: "#7ccbd6",
      roles: { panel: { body: SHUTTER_BODY }, door: { extends: "panel" } },
    },
  },
  glows: CYAN_GLOWS,
  props: [FRONT_CRATE, SLAB_CRATE],
  statics: [FLOOR_SHEET, HUNG_SIGN, CRATE_SHEET],
  lighting: {
    environment: { intensity: 0.3, ambient: [0.05, 0.05, 0.06], overhead: [0.1, 0.1, 0.12] },
    points: [{ position: [0, 6, 0], color: [1, 0.8, 0.6], intensity: 40, range: 20 }],
    haze: { density: 0.01, color: [0.1, 0.1, 0.12], glow: 0 },
    exposure: 1,
  },
} as const;

/** The description file bytes of the fixture with the given root keys replaced. */
export function fixtureBytes(changes: Readonly<Record<string, unknown>> = {}): Uint8Array {
  return new TextEncoder().encode(JSON.stringify({ ...FIXTURE, ...changes }));
}

/** The bytes of a GLB with an empty scene, which sec-111's stage survey refuses. */
export function emptyStage(): Uint8Array {
  const document = {
    asset: { version: "2.0" },
    scenes: [{ nodes: [] }],
    nodes: [],
    buffers: [{ byteLength: 4 }],
  };
  const text = JSON.stringify({ ...document, scene: 0 });
  const json = new TextEncoder().encode(text.padEnd(Math.ceil(text.length / 4) * 4, " "));
  const total = 12 + 8 + json.byteLength + 8 + 4;
  const bytes = new Uint8Array(total);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  view.setUint32(12, json.byteLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(json, 20);
  view.setUint32(20 + json.byteLength, 4, true);
  view.setUint32(24 + json.byteLength, 0x004e4942, true);
  return bytes;
}

/** A light strip of the shortest length hanging 8 m over the floor, glowing `cyan`. */
export function lightStrip(id: string, at: readonly [number, number]): PropRecord {
  return {
    id,
    kind: "light-strip",
    at,
    yaw: 0,
    params: { length: 0.5, width: 0.1, height: 8, glow: "cyan", color: "#20262c" },
  };
}
