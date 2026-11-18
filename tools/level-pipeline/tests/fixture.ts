/**
 * The build fixture: the real base stage at its scale under one end-wall seal, with one crate
 * on each floor level and one point light. Tests vary it by replacing root keys.
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
    luminaire: {
      cut: { family: "metal", color: "#5a5d61" },
      light: "#7ccbd6",
      roles: { strip: { body: { metalness: 0.8, roughness: 0.4, lit: 1 } } },
    },
  },
  glows: {},
  props: [FRONT_CRATE, SLAB_CRATE],
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

/** The one glow the light strips name. */
export const CYAN_GLOWS = { cyan: { color: [0, 0.8, 1], strength: 4 } } as const;
