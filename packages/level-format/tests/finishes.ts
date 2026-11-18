import type { FinishTable, Layer, Length, SlabFinish } from "@level-designer/level-format";

/** The four finish keys of a fixture slab, naming a path the fixture table holds. */
export const SLAB_FINISH: SlabFinish = { finish: "housing/machine", number: 0, seed: 0, wear: 0.3 };

/** The path of the fixture's `machine` role in a description or a level document. */
export const MACHINE = "finishes.housing.roles.machine";

/** The `panel` layers as a document states them: cells, face, disc and border. */
function panelDocument(): unknown[] {
  return [
    {
      kind: "cells",
      width: 0.6,
      height: "0.25h",
      gap: 0.004,
      shift: 0.5,
      fit: "across",
      share: 0.1,
      shade: 0.8,
      jitter: { low: 0.9, high: 1.1 },
    },
    { kind: "cells", width: 1.2, height: 0.6, gap: 0, jitter: { high: 1.05, low: 0.95 } },
    { kind: "face", paint: 1 },
    { kind: "disc", at: [0, "0.5h"], radius: 0.08, inner: 0.05, diamond: true, color: "#ffcc00" },
    { kind: "disc", at: ["-0.5w+0.1", 0.1], radius: 0.02, metalness: 1 },
    { kind: "border", width: 0.03, shade: 0.7 },
    {
      kind: "border",
      width: { ends: 0.05, top: "0.1h", base: 0.12 },
      inset: 0.01,
      roughness: 0.9,
    },
  ];
}

/**
 * The fixture finish table as a document states it: every kind, every length form, layers
 * with and without their optional keys, a stated and a defaulted body, and an extension.
 */
export function finishesDocument(): Record<string, unknown> {
  const machine = [
    { kind: "rectangle", from: ["-0.5w", 0], to: ["0.5w", 0.12], shade: 0.6 },
    {
      kind: "rectangle",
      from: ["-0.5w+0.2", 0],
      to: ["0.5w-0.2", "1h-0.1"],
      on: "sides",
      across: "ends",
      up: "top",
      clip: { from: [0, 0], to: ["0.25w", 1] },
      detail: "fine",
      wear: true,
      amount: 0.5,
      shade: 1.1,
      roughness: 0.8,
    },
    { kind: "bands", along: "up", period: 0.4, width: 0.02, paint: 1 },
    {
      kind: "bands",
      along: "across",
      period: "0.1w",
      width: 0.05,
      phase: 0,
      offset: -0.1,
      fit: true,
      ramp: 0.01,
      color: "glow",
      lit: 1,
    },
    { kind: "dots", pitch: [0.3, 0.25], radius: 0.01, metalness: 1 },
    {
      kind: "dots",
      pitch: [0.3, 0.3],
      radius: "0.01h",
      phase: [0, 1],
      offset: [0.05, "0.5h"],
      fit: "both",
      color: "#C0C0C0",
    },
    { kind: "noise", wavelength: [0.5, 0.25], shade: 0.9 },
    { kind: "bands", along: "diagonal", period: "0.2w", width: 0.03, ramp: 0.005, shade: 0.85 },
  ];
  const plate = [
    { kind: "noise", wavelength: [1, 1], threshold: 0.6, softness: 0.1, roughness: 0.9 },
  ];
  return {
    housing: {
      cut: { family: "metal", color: "#556070" },
      light: "#fff2d0",
      roles: {
        machine: { body: { roughness: 0.5 }, layers: machine },
        "machine-plate": { layers: plate, extends: "machine" },
        plain: {},
        panel: { layers: panelDocument() },
      },
    },
  };
}

/** A length of `metres` with no share of the face. */
function length(metres: number): Length {
  return { metres };
}

/** A length of `metres` plus `factor` times the face's width. */
function width(metres: number, factor: number): Length {
  return { metres, share: { of: "w", factor } };
}

/** A length of `metres` plus `factor` times the face's height. */
function height(metres: number, factor: number): Length {
  return { metres, share: { of: "h", factor } };
}

/** The common keys every layer takes by default. */
const PLAIN = { on: "outside", wear: false, amount: 1 } as const;

/** The `machine` layers as the admission reads them, defaults filled. */
export const MACHINE_LAYERS: readonly Layer[] = [
  {
    pattern: {
      kind: "rectangle",
      from: [width(0, -0.5), length(0)],
      to: [width(0, 0.5), length(0.12)],
    },
    ...PLAIN,
    effects: { shade: 0.6 },
  },
  {
    pattern: {
      kind: "rectangle",
      from: [width(0.2, -0.5), length(0)],
      to: [width(-0.2, 0.5), height(-0.1, 1)],
    },
    on: "sides",
    across: "ends",
    up: "top",
    clip: { from: [length(0), length(0)], to: [width(0, 0.25), length(1)] },
    detail: "fine",
    wear: true,
    amount: 0.5,
    effects: { shade: 1.1, roughness: 0.8 },
  },
  {
    pattern: {
      kind: "bands",
      along: "up",
      period: length(0.4),
      width: length(0.02),
      phase: 0.5,
      offset: length(0),
      fit: false,
      ramp: length(0),
    },
    ...PLAIN,
    effects: { paint: 1 },
  },
  {
    pattern: {
      kind: "bands",
      along: "across",
      period: width(0, 0.1),
      width: length(0.05),
      phase: 0,
      offset: length(-0.1),
      fit: true,
      ramp: length(0.01),
    },
    ...PLAIN,
    effects: { color: "glow", lit: 1 },
  },
  {
    pattern: {
      kind: "dots",
      pitch: [length(0.3), length(0.25)],
      radius: length(0.01),
      phase: [0.5, 0.5],
      offset: [length(0), length(0)],
    },
    ...PLAIN,
    effects: { metalness: 1 },
  },
  {
    pattern: {
      kind: "dots",
      pitch: [length(0.3), length(0.3)],
      radius: height(0, 0.01),
      phase: [0, 1],
      offset: [length(0.05), height(0, 0.5)],
      fit: "both",
    },
    ...PLAIN,
    effects: { color: "#C0C0C0" },
  },
  {
    pattern: { kind: "noise", wavelength: [length(0.5), length(0.25)] },
    ...PLAIN,
    effects: { shade: 0.9 },
  },
  {
    pattern: {
      kind: "bands",
      along: "diagonal",
      period: width(0, 0.2),
      width: length(0.03),
      phase: 0.5,
      offset: length(0),
      ramp: length(0.005),
    },
    ...PLAIN,
    effects: { shade: 0.85 },
  },
];

/** The `machine-plate` layer as the admission reads it. */
export const PLATE_LAYER: Layer = {
  pattern: {
    kind: "noise",
    wavelength: [length(1), length(1)],
    mask: { threshold: 0.6, softness: 0.1 },
  },
  ...PLAIN,
  effects: { roughness: 0.9 },
};

/** The `panel` layers as the admission reads them: the four kinds of milestone 2. */
const PANEL_LAYERS: readonly Layer[] = [
  {
    pattern: {
      kind: "cells",
      width: length(0.6),
      height: height(0, 0.25),
      gap: length(0.004),
      shift: 0.5,
      share: 0.1,
      fit: "across",
    },
    ...PLAIN,
    effects: { shade: 0.8, jitter: { low: 0.9, high: 1.1 } },
  },
  {
    pattern: {
      kind: "cells",
      width: length(1.2),
      height: length(0.6),
      gap: length(0),
      shift: 0,
      share: 0,
    },
    ...PLAIN,
    effects: { jitter: { low: 0.95, high: 1.05 } },
  },
  { pattern: { kind: "face" }, ...PLAIN, effects: { paint: 1 } },
  {
    pattern: {
      kind: "disc",
      at: [length(0), height(0, 0.5)],
      radius: length(0.08),
      inner: length(0.05),
      diamond: true,
    },
    ...PLAIN,
    effects: { color: "#ffcc00" },
  },
  {
    pattern: {
      kind: "disc",
      at: [width(0.1, -0.5), length(0.1)],
      radius: length(0.02),
      inner: length(0),
      diamond: false,
    },
    ...PLAIN,
    effects: { metalness: 1 },
  },
  {
    pattern: {
      kind: "border",
      width: { ends: length(0.03), top: length(0.03), base: length(0.03) },
      inset: length(0),
    },
    ...PLAIN,
    effects: { shade: 0.7 },
  },
  {
    pattern: {
      kind: "border",
      width: { ends: length(0.05), top: height(0, 0.1), base: length(0.12) },
      inset: length(0.01),
    },
    ...PLAIN,
    effects: { roughness: 0.9 },
  },
];

/** The fixture table as the admission returns it from `finishesDocument`. */
export function finishTable(): FinishTable {
  const roles = new Map([
    [
      "machine",
      { body: { shade: 1, metalness: 0, roughness: 0.5, lit: 0 }, layers: MACHINE_LAYERS },
    ],
    ["machine-plate", { layers: [PLATE_LAYER], extends: "machine" }],
    ["plain", { layers: [] }],
    ["panel", { layers: PANEL_LAYERS }],
  ]);
  const cut = { family: "metal", color: "#556070" } as const;
  return new Map([["housing", { cut, light: "#fff2d0", roles }]]);
}
