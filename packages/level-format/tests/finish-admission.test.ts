import { describe, expect, test } from "bun:test";
import { parseDescription, recipeAt } from "@level-designer/level-format";
import type { Description, Length } from "@level-designer/level-format";
import { finishTable, MACHINE, MACHINE_LAYERS, PLATE_LAYER } from "./finishes.ts";
import type { LimitCase } from "./fixtures.ts";
import {
  changed,
  closedRange,
  expectLimit,
  problemsOf,
  rulePaths,
  validDescription,
} from "./fixtures.ts";

/** The roles of the fixture's one finish, in a description document. */
const ROLES = "finishes.housing.roles";

/** The path of the `machine-plate` role. */
const PLATE = `${ROLES}.machine-plate`;

/** The layers of the `panel` role: cells, face, disc and border. */
const PANEL = `${ROLES}.panel.layers`;

/** `count` rectangle layers that shade. */
function rectangles(count: number): unknown[] {
  return Array.from({ length: count }, () => ({
    kind: "rectangle",
    from: [0, 0],
    to: [1, 1],
    shade: 0.5,
  }));
}

/** `count` noise layers that shade. */
function noises(count: number): unknown[] {
  return Array.from({ length: count }, () => ({ kind: "noise", wavelength: [1, 1], shade: 0.9 }));
}

/** The description admitted from the fixture with the value at `path` set to `value`. */
function admitted(path: string, value: unknown): Description | undefined {
  const admission = parseDescription(JSON.stringify(changed(validDescription(), path, value)));
  return admission.ok ? admission.value : undefined;
}

/** The first corner's across length of the machine role's first layer after setting it. */
function firstCorner(value: unknown): Length | undefined {
  const pattern = admitted(`${MACHINE}.layers[0].from[0]`, value)
    ?.finishes.get("housing")
    ?.roles.get("machine")?.layers[0]?.pattern;
  return pattern?.kind === "rectangle" ? pattern.from[0] : undefined;
}

/** Every size key of the fixture, each a positive length in its layer. */
const SIZE_KEYS = [
  `${MACHINE}.layers[2].period`,
  `${MACHINE}.layers[2].width`,
  `${MACHINE}.layers[4].radius`,
  `${MACHINE}.layers[4].pitch[0]`,
  `${MACHINE}.layers[4].pitch[1]`,
  `${MACHINE}.layers[6].wavelength[0]`,
  `${MACHINE}.layers[6].wavelength[1]`,
];

/**
 * Sizes at their limits: every term 0 or at least the grid step of 0.0001, in metres and
 * in a share's factor, and the size above zero; a ramp also at 0.
 */
const sizes: readonly LimitCase[] = [
  ...SIZE_KEYS.flatMap((key): LimitCase[] => [
    [key, 0.0001, 0.00009],
    [key, "0.0001w", "0.00009w"],
    [key, "0.1h+0.0001", "0.1h+0.00009"],
  ]),
  [`${MACHINE}.layers[2].period`, 0.0001, 0],
  [`${MACHINE}.layers[2].period`, "0.1w", "-0.1w"],
  [`${MACHINE}.layers[2].period`, "1h+0.1", "1h-0.1"],
  [`${MACHINE}.layers[2].period`, "0.1h", "0w"],
  [`${MACHINE}.layers[4].radius`, 0.0001, -0.0001],
  [`${MACHINE}.layers[4].pitch[1]`, "0.5w", 0],
  [`${MACHINE}.layers[2].period`, 0.0001, 1e-300],
  [`${MACHINE}.layers[2].period`, "0.5w", "1e-300w"],
  [`${MACHINE}.layers[3].ramp`, 0, -0.0001],
  [`${MACHINE}.layers[3].ramp`, 0.0001, 0.00009],
  [`${MACHINE}.layers[3].ramp`, "0.1w", "-0.1w+0.2"],
];

/** Every size key of the four kinds of milestone 2, each a positive length in its layer. */
const PANEL_SIZE_KEYS = [
  `${PANEL}[0].width`,
  `${PANEL}[0].height`,
  `${PANEL}[3].radius`,
  `${PANEL}[5].width`,
  `${PANEL}[6].width.ends`,
  `${PANEL}[6].width.top`,
  `${PANEL}[6].width.base`,
];

/** The lengths of those kinds that take a size's limits and may also be 0. */
const PANEL_GAP_KEYS = [`${PANEL}[0].gap`, `${PANEL}[3].inner`, `${PANEL}[6].inset`];

/** The lengths and ranges of cells, disc and border at their limits. */
const panelLimits: readonly LimitCase[] = [
  ...PANEL_SIZE_KEYS.flatMap((key): LimitCase[] => [
    [key, 0.0001, 0.00009],
    [key, "0.0001w", "0.00009w"],
    [key, 0.0001, 0],
    [key, 1000, 1000.0001],
  ]),
  ...PANEL_GAP_KEYS.flatMap((key): LimitCase[] => [
    [key, 0, -0.0001],
    [key, 0.0001, 0.00009],
    [key, "0.1h", "-0.1h"],
  ]),
  [`${PANEL}[3].at[0]`, -1000, -1000.0001],
  [`${PANEL}[4].at[1]`, "1h+1000", "1h+1000.0001"],
  ...closedRange(`${PANEL}[0].shift`, 0, 1),
  ...closedRange(`${PANEL}[0].share`, 0, 1),
  ...closedRange(`${PANEL}[0].jitter.low`, 0, 4),
  ...closedRange(`${PANEL}[0].jitter.high`, 0, 4),
];

/** The bound of every term's magnitude, 1,000, on a size key and on a position key. */
const bounds: readonly LimitCase[] = [
  [`${MACHINE}.layers[2].period`, 1000, 1000.0001],
  [`${MACHINE}.layers[2].period`, "1000w", "1000.0001w"],
  [`${MACHINE}.layers[2].period`, "1w+1000", "1w+1000.0001"],
  [`${MACHINE}.layers[2].period`, 0.5, 3.5e38],
  [`${MACHINE}.layers[0].from[0]`, -1000, -1000.0001],
  [`${MACHINE}.layers[0].from[0]`, 1000, 1000.0001],
  [`${MACHINE}.layers[0].from[0]`, "-1000h", "-1000.0001h"],
  [`${MACHINE}.layers[0].from[0]`, "1w-1000", "1w-1000.0001"],
  [`${MACHINE}.layers[0].from[0]`, 0.5, 1e308],
  [`${MACHINE}.layers[0].from[0]`, "1w", "1w+1e39"],
];

/** The caps of a recipe, the extended role's layers counted. */
const caps: readonly LimitCase[] = [
  [`${ROLES}.plain.layers`, rectangles(24), rectangles(25)],
  [
    `${ROLES}.kick`,
    { extends: "machine", layers: rectangles(16) },
    { extends: "machine", layers: rectangles(17) },
    `${ROLES}.kick.layers`,
  ],
  [`${ROLES}.plain.layers`, noises(2), noises(3)],
  [`${PLATE}.layers`, noises(1), noises(2)],
];

/** The closed ranges of the body, the effects, the phases and the mask. */
const ranges: readonly LimitCase[] = [
  ...closedRange(`${MACHINE}.body.shade`, 0, 4),
  ...closedRange(`${MACHINE}.body.metalness`, 0, 1),
  ...closedRange(`${MACHINE}.body.roughness`, 0, 1),
  ...closedRange(`${MACHINE}.body.lit`, 0, 1),
  ...closedRange(`${MACHINE}.layers[0].shade`, 0, 4),
  ...closedRange(`${MACHINE}.layers[2].paint`, 0, 4),
  ...closedRange(`${MACHINE}.layers[4].metalness`, 0, 1),
  ...closedRange(`${MACHINE}.layers[1].roughness`, 0, 1),
  ...closedRange(`${MACHINE}.layers[3].lit`, 0, 1),
  ...closedRange(`${MACHINE}.layers[1].amount`, 0, 1),
  ...closedRange(`${MACHINE}.layers[3].phase`, 0, 1),
  ...closedRange(`${MACHINE}.layers[5].phase[1]`, 0, 1),
  ...closedRange(`${PLATE}.layers[0].threshold`, 0, 1),
  [`${PLATE}.layers[0].softness`, 1, 1.0001],
  [`${PLATE}.layers[0].softness`, 0.0001, 0],
];

describe("the finish table admission", () => {
  test("reads every kind and length form, and fills every default of a stated record", () => {
    const admission = parseDescription(JSON.stringify(validDescription()));
    expect(problemsOf(admission)).toEqual([]);
    expect(admission.ok ? admission.value.finishes : undefined).toEqual(finishTable());
  });

  test("an admitted extending role draws the extended layers and body first", () => {
    const description = admitted("name", "dark-factory");
    const drawn =
      description === undefined
        ? undefined
        : recipeAt(description.finishes, "housing/machine-plate");
    expect(drawn).toEqual({
      body: { shade: 1, metalness: 0, roughness: 0.5, lit: 0 },
      layers: [...MACHINE_LAYERS, PLATE_LAYER],
      light: "#fff2d0",
    });
  });

  test("reads a length as metres, as a share and as a share with an offset", () => {
    expect(firstCorner(1.5)).toEqual({ metres: 1.5 });
    expect(firstCorner("0.25w")).toEqual({ metres: 0, share: { of: "w", factor: 0.25 } });
    expect(firstCorner("1h-0.1")).toEqual({ metres: -0.1, share: { of: "h", factor: 1 } });
    expect(firstCorner("-0.5w+0.2")).toEqual({ metres: 0.2, share: { of: "w", factor: -0.5 } });
    expect(firstCorner("-0w")).toEqual({ metres: 0, share: { of: "w", factor: 0 } });
  });

  for (const text of ["w", "0.25x", "1h-", "0.25 w", "", "1w+0.1h", ".5w", true]) {
    test(`refuses the length ${JSON.stringify(text)} at its path`, () => {
      const path = `${MACHINE}.layers[0].from[0]`;
      const admission = parseDescription(JSON.stringify(changed(validDescription(), path, text)));
      expect(rulePaths(admission)).toEqual([["shape", path]]);
    });
  }
});

describe("finish table limits", () => {
  for (const probe of [...sizes, ...bounds, ...caps, ...ranges, ...panelLimits]) {
    const [at, beyond] = [JSON.stringify(probe[1]).slice(0, 12), JSON.stringify(probe[2])];
    test(`${probe[0].slice(ROLES.length + 1)} passes at ${at} and fails at ${beyond}`, () => {
      expectLimit(parseDescription, validDescription(), probe);
    });
  }

  test("a border takes neither across nor up, which a rectangle on the same role takes", () => {
    const border = { kind: "border", width: 0.03, shade: 0.7 };
    const rectangle = { kind: "rectangle", from: [0, 0], to: [1, 1], shade: 0.7 };
    for (const [key, value] of [
      ["across", "ends"],
      ["across", "out"],
      ["up", "top"],
    ] as const) {
      const placed = (layer: object): unknown => ({ ...layer, [key]: value });
      const refused = changed(validDescription(), `${PANEL}[5]`, placed(border));
      expect(rulePaths(parseDescription(JSON.stringify(refused)))).toEqual([
        ["shape", `${PANEL}[5].${key}`],
      ]);
      expect(admitted(`${PANEL}[5]`, placed(rectangle))).toBeDefined();
    }
    expect(admitted(`${PANEL}[5]`, border)).toBeDefined();
  });

  test("states a cap with the role's layers and the count the extension brings", () => {
    const document = changed(validDescription(), `${PLATE}.layers`, noises(2));
    expect(problemsOf(parseDescription(JSON.stringify(document))).map((p) => p.message)).toEqual([
      `${PLATE}.layers: expected at most 2 noise layers with the extended role's, got 3 noise layers`,
    ]);
  });
});

/** Rejections of one fault each: a name, the value's path, the value, and the problem's path. */
const refusals: readonly [string, string, unknown, string?][] = [
  ["an unknown layer key", `${MACHINE}.layers[0].glint`, 1],
  ["an unknown recipe key", `${MACHINE}.tint`, 1],
  ["an unknown body key", `${MACHINE}.body.gloss`, 1],
  ["an unknown finish key", "finishes.housing.extra", 1],
  ["an unknown kind", `${MACHINE}.layers[0].kind`, "stripes"],
  [
    "an unknown kind without an effect",
    `${MACHINE}.layers[0]`,
    { kind: "stripes" },
    `${MACHINE}.layers[0].kind`,
  ],
  ["an empty layer", `${MACHINE}.layers[0]`, {}, `${MACHINE}.layers[0].kind`],
  ["a missing kind", `${MACHINE}.layers[0].kind`, undefined],
  ["a layer that is no object", `${MACHINE}.layers[0]`, 3],
  ["a missing key of the kind", `${MACHINE}.layers[2].period`, undefined],
  ["an unknown across coordinate", `${MACHINE}.layers[1].across`, "left"],
  ["an unknown up coordinate", `${MACHINE}.layers[1].up`, "bottom"],
  ["an unknown band direction", `${MACHINE}.layers[2].along`, "sideways"],
  ["an unknown fitted coordinate of dots", `${MACHINE}.layers[5].fit`, "diagonal"],
  ["an unknown detail", `${MACHINE}.layers[1].detail`, "coarse"],
  ["an unknown face", `${MACHINE}.layers[0].on`, "front"],
  ["a layer without an effect", `${MACHINE}.layers[0].shade`, undefined, `${MACHINE}.layers[0]`],
  ["a fitted diagonal band", `${MACHINE}.layers[3].along`, "diagonal", `${MACHINE}.layers[3].fit`],
  ["a band's fit of false", `${MACHINE}.layers[3].fit`, false],
  ["a colour that is no #rrggbb or glow", `${MACHINE}.layers[5].color`, "red"],
  ["a wear that is no boolean", `${MACHINE}.layers[1].wear`, "yes"],
  ["a clip without its high corner", `${MACHINE}.layers[1].clip.to`, undefined],
  [
    "a threshold without a softness",
    `${PLATE}.layers[0].softness`,
    undefined,
    `${PLATE}.layers[0]`,
  ],
  ["an extension of a missing role", `${PLATE}.extends`, "ghost"],
  [
    "an extension of an extending role",
    `${ROLES}.trim`,
    { extends: "machine-plate" },
    `${ROLES}.trim.extends`,
  ],
  ["a role that extends itself", `${ROLES}.plain`, { extends: "plain" }, `${ROLES}.plain.extends`],
  ["a role name that is no id", `${ROLES}.Machine`, {}],
  ["a finish name that is no id", "finishes.Housing", {}],
  ["an unknown cut family", "finishes.housing.cut.family", "glass"],
  ["a light that is no #rrggbb", "finishes.housing.light", "white"],
  ["a finish without its light", "finishes.housing.light", undefined],
  ["a jitter on bands", `${MACHINE}.layers[2].jitter`, { low: 0.9, high: 1.1 }],
  ["a jitter on a face", `${PANEL}[2].jitter`, { low: 0.9, high: 1.1 }],
  [
    "a jitter as the only effect of a disc",
    `${PANEL}[4]`,
    { kind: "disc", at: [0, 0], radius: 0.1, jitter: { low: 1, high: 1 } },
    `${PANEL}[4].jitter`,
  ],
  ["a jitter without its high factor", `${PANEL}[0].jitter.high`, undefined],
  ["an unknown key of a jitter", `${PANEL}[0].jitter.mid`, 1],
  ["a jitter that is no object", `${PANEL}[1].jitter`, 1.1],
  ["an unknown fitted coordinate of cells", `${PANEL}[0].fit`, "diagonal"],
  ["a missing width of cells", `${PANEL}[1].width`, undefined],
  ["a missing height of cells", `${PANEL}[1].height`, undefined],
  ["a missing gap of cells", `${PANEL}[1].gap`, undefined],
  ["a missing at of a disc", `${PANEL}[4].at`, undefined],
  ["a key of another kind on a face", `${PANEL}[2].width`, 0.1],
  ["a diamond that is no boolean", `${PANEL}[3].diamond`, "yes"],
  ["a missing radius of a disc", `${PANEL}[4].radius`, undefined],
  ["a missing width of a border", `${PANEL}[5].width`, undefined],
  ["a border width without its top", `${PANEL}[6].width.top`, undefined],
  ["an unknown key of a border width", `${PANEL}[6].width.side`, 0.1],
  ["a border width that is a list", `${PANEL}[5].width`, [0.1, 0.1], `${PANEL}[5].width`],
];

describe("finish table refusals", () => {
  for (const [name, path, value, failsAt = path] of refusals) {
    test(`refuses ${name} with one problem at its path`, () => {
      const admission = parseDescription(JSON.stringify(changed(validDescription(), path, value)));
      expect(rulePaths(admission)).toEqual([["shape", failsAt]]);
    });
  }
});
