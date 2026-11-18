import { describe, expect, test } from "bun:test";
import { grid } from "./checks.ts";
import { expanded, KIT_PATHS, ODD_SITE, ORIGIN, refused, tableOf } from "./fixtures.ts";
import type { Params } from "./fixtures.ts";

// Owner: prop-kit's finish paths, the glow on every slab of a glowing prop, and the `finish`
// error. The paths are the list of "What the kit names" in the finish format.

const DARK = "#3b4046";

/** One kind's parameter corners and the paths its slabs name at a corner, in slab order. */
interface PathCase {
  readonly kind: string;
  readonly corners: readonly Params[];
  readonly paths: (corner: Params) => readonly string[];
}

/** A role's path once per run. */
function runs(path: string, count: number): string[] {
  return Array<string>(count).fill(path);
}

/** The two glow slabs' paths of a hollow kind, where the corner has a glow. */
function bandPair(corner: Params): readonly string[] {
  return corner.glow === undefined ? [] : runs("luminaire/band", 2);
}

/** An enclosure's roof path, its +X side's path and the path of its other walls. */
function enclosureRoles(
  concrete: boolean,
  width: number,
): { readonly top: string; readonly plate: string; readonly plain: string } {
  if (concrete) {
    const wall = "cast-concrete/wall";
    return { top: "cast-concrete/top", plate: wall, plain: wall };
  }
  if (width <= 1.2) {
    return { top: "housing/top", plate: "housing/cabinet", plain: "housing/cabinet" };
  }
  return { top: "housing/top", plate: "housing/machine-plate", plain: "housing/machine" };
}

/**
 * An enclosure's paths at a corner. At a length of 8 m the roof splits above a width of
 * 3.125 m, and each long side above a height of 3.175 m on metal and 3.225 m on concrete; the
 * walls follow the material and, on metal, the width.
 */
function enclosurePaths(c: Params): readonly string[] {
  const concrete = c.material === "concrete";
  const long = c.length === 8;
  const roofRuns = long && Number(c.width) > 3.125 ? 2 : 1;
  const sideRuns = long && Number(c.height) > (concrete ? 3.225 : 3.175) ? 2 : 1;
  const { top, plate, plain } = enclosureRoles(concrete, Number(c.width));
  return [
    ...runs(top, roofRuns),
    ...runs(plate, sideRuns),
    ...runs(plain, sideRuns),
    ...runs(plain, 2),
    ...bandPair(c),
  ];
}

/** A container's paths: its long sides split above 9.8425 m and its roof above 10.2459 m. */
function containerPaths(c: Params): readonly string[] {
  const length = Number(c.length);
  const roofRuns = length > 10.2459 ? 2 : 1;
  const sideRuns = length > 9.8425 ? 2 : 1;
  return [
    ...runs("corrugated/roof", roofRuns),
    ...runs("corrugated/side", 2 * sideRuns),
    ...runs("corrugated/end", 2),
  ];
}

/** A partition's path by its material, as the finish format lists the defaults. */
const PARTITION_PATHS: Readonly<Record<string, string>> = {
  concrete: "cast-concrete/panel",
  metal: "steel-stock/stack",
  wood: "timber/stack",
  brick: "block/wall",
};

/**
 * A bridge crane's paths: each runway role splits in two above a travel of 40 m, and each girder
 * web above a span of 20.3 m.
 */
function bridgePaths(c: Params): readonly string[] {
  const r = Number(c.travel) > 40 ? 2 : 1;
  const g = Number(c.span) > 20.3 ? 2 : 1;
  const beam = [...runs("beam/runway", r), ...runs("beam/flange", r)];
  const girder = [...runs("beam/girder", g), "beam/flange"];
  return [
    ...beam,
    ...beam,
    ...runs("beam/truck", 2),
    ...girder,
    ...girder,
    "housing/top",
    ...runs("housing/hoist", 4),
    "beam/hook",
  ];
}

const CASES: readonly PathCase[] = [
  {
    kind: "conveyor",
    corners: grid({
      length: [1, 12],
      width: [0.6, 1.6],
      height: [0.6, 1.2],
      glow: [undefined, "cyan"],
    }),
    paths: (c) => ["bed/deck", ...runs("housing/skirt", 2), ...bandPair(c)],
  },
  {
    kind: "enclosure",
    corners: grid({
      width: [1, 1.2, 1.2001, 3.125, 3.1251, 6],
      length: [1, 8],
      height: [1.5, 3.175, 3.1751, 3.225, 3.2251, 3.5],
      material: ["metal", "concrete"],
      glow: [undefined, "amber"],
    }),
    paths: enclosurePaths,
  },
  {
    kind: "robot-arm",
    corners: grid({
      reach: [1.5, 3.5],
      shoulder: [30, 90],
      elbow: [60, 160],
      glow: [undefined, "cyan"],
    }),
    paths: (c) => [
      "housing/top",
      ...runs("housing/pedestal", 4),
      "casting/shoulder",
      "casting/upper-arm",
      "casting/forearm",
      "casting/head",
      ...(c.glow === undefined ? [] : ["luminaire/band"]),
    ],
  },
  {
    kind: "container",
    corners: grid({ length: [3, 9.8425, 9.8426, 10.2459, 10.246, 12.2] }),
    paths: containerPaths,
  },
  {
    kind: "crate",
    corners: grid({ size: [0.6, 1.8] }),
    paths: () => ["timber/lid", ...runs("timber/crate-stencil", 2), ...runs("timber/crate", 2)],
  },
  {
    kind: "partition",
    corners: grid({
      width: [1, 6.25, 6.2501, 8],
      height: [1, 4],
      thickness: [0.1, 0.6],
      material: ["wood", "brick", "concrete", "metal"],
    }),
    paths: (c) => {
      const split = Number(c.width) * Number(c.height) > 25 ? 2 : 1;
      return runs(PARTITION_PATHS[String(c.material)] ?? "", split);
    },
  },
  {
    kind: "bridge-crane",
    corners: grid({
      span: [10, 20.2999, 20.3, 20.3001, 30],
      travel: [10, 40, 40.0001, 60],
      railHeight: [6, 15.5],
      bridgeAt: [0, 1],
      trolleyAt: [0, 1],
      hookDrop: [0.5, 3.5],
    }),
    paths: bridgePaths,
  },
  {
    kind: "jib-crane",
    corners: grid({ height: [3, 8], boom: [2, 8] }),
    paths: () => [
      "beam/plinth",
      "beam/mast-front",
      ...runs("beam/mast", 3),
      "beam/boom",
      "beam/flange",
      "beam/tie",
      "housing/hoist",
    ],
  },
  {
    kind: "light-strip",
    corners: grid({ length: [0.5, 12], width: [0.1, 0.6], height: [2.5, 17], glow: ["cyan"] }),
    paths: () => ["luminaire/strip"],
  },
];

describe("every slab names the finish path of its role at every parameter corner", () => {
  for (const c of CASES) {
    test(`${c.kind}, ${c.corners.length} corners, on both sites`, () => {
      for (const corner of c.corners) {
        const glow = typeof corner.glow === "string" ? corner.glow : undefined;
        for (const site of [ORIGIN, ODD_SITE]) {
          const slabs = expanded(c.kind, { color: DARK, ...corner }, site);
          expect(slabs.map((s) => s.slab.finish)).toEqual([...c.paths(corner)]);
          for (const s of slabs) expect(s.glow).toBe(glow);
        }
      }
    });
  }
});

/** The paths of an enclosure's four walls, after its roof, at the given width and material. */
function enclosureWalls(width: number, material: string): string[] {
  return expanded("enclosure", { width, length: 2, material, color: DARK })
    .slice(1)
    .map((s) => s.slab.finish);
}

describe("the roles whose path depends on a parameter or a side", () => {
  test("a metal enclosure is a cabinet up to 1.2 m wide and a machine one step beyond", () => {
    expect(enclosureWalls(1.2, "metal")).toEqual(Array(4).fill("housing/cabinet"));
    expect(enclosureWalls(1.2001, "metal")).toEqual([
      "housing/machine-plate",
      "housing/machine",
      "housing/machine",
      "housing/machine",
    ]);
    expect(enclosureWalls(1.2, "concrete")).toEqual(Array(4).fill("cast-concrete/wall"));
  });

  test("a container's two ends and a crate's +X and -X sides take their roles", () => {
    const container = expanded("container", { color: DARK }).map((s) => s.slab.finish);
    expect(container.slice(3)).toEqual(["corrugated/end", "corrugated/end"]);
    const crate = expanded("crate", { color: DARK }).map((s) => s.slab.finish);
    expect(crate.slice(1)).toEqual([
      "timber/crate-stencil",
      "timber/crate-stencil",
      "timber/crate",
      "timber/crate",
    ]);
  });
});

/** A container's end paths, +Z then -Z, for each `door`. */
const DOOR_ENDS: Readonly<Record<string, readonly string[]>> = {
  "+z": ["corrugated/door", "corrugated/end"],
  "-z": ["corrugated/end", "corrugated/door"],
  none: ["corrugated/end", "corrugated/end"],
};

describe("the parameters that choose a role", () => {
  test("door moves the door role between the ends at every split, and none leaves two ends", () => {
    for (const length of [3, 9.8425, 9.8426, 10.2459, 10.246, 12.2]) {
      const plain = containerPaths({ length }).slice(0, -2);
      for (const [door, ends] of Object.entries(DOOR_ENDS)) {
        for (const site of [ORIGIN, ODD_SITE]) {
          const paths = expanded("container", { color: DARK, length, door }, site).map(
            (s) => s.slab.finish,
          );
          expect(paths).toEqual([...plain, ...ends]);
        }
      }
    }
  });

  test("door +z paints the end that faces the prop's +Z", () => {
    const slabs = expanded("container", { color: DARK, door: "+z" });
    const door = slabs.find((s) => s.slab.finish === "corrugated/door");
    expect(door?.slab.position[2]).toBeGreaterThan(0);
  });

  test("stencil switches the stencil role on the +X and -X sides", () => {
    for (const size of [0.6, 1.8]) {
      const paths = (stencil: boolean): string[] =>
        expanded("crate", { color: DARK, size, stencil }).map((s) => s.slab.finish);
      expect(paths(true)).toEqual([
        "timber/lid",
        ...runs("timber/crate-stencil", 2),
        ...runs("timber/crate", 2),
      ]);
      expect(paths(false)).toEqual(["timber/lid", ...runs("timber/crate", 4)]);
    }
  });

  test("a partition's finish names any path of the table on every run, of any material", () => {
    for (const material of Object.keys(PARTITION_PATHS)) {
      for (const width of [6.25, 6.2501]) {
        for (const finish of ["corrugated/door", "beam/hook"]) {
          const params = { width, height: 4, material, color: DARK, finish };
          const paths = expanded("partition", params).map((s) => s.slab.finish);
          expect(paths).toEqual(runs(finish, width > 6.25 ? 2 : 1));
        }
      }
    }
  });
});

describe("the finish error", () => {
  test("a partition's finish the table lacks names the kind and the path", () => {
    const wall = { width: 2, height: 2, color: DARK };
    for (const finish of ["block/fence", "panel", ""]) {
      expect(refused("partition", { ...wall, finish })).toEqual([
        {
          rule: "finish",
          path: "props[3].kind",
          message: `props[3].kind: partition needs the finish "${finish}"`,
        },
      ]);
    }
  });

  test("a table without a needed path names the kind and the path", () => {
    const table = tableOf(KIT_PATHS.filter((path) => path !== "timber/crate-stencil"));
    const problems = refused("crate", { color: DARK }, undefined, table);
    expect(problems).toEqual([
      {
        rule: "finish",
        path: "props[3].kind",
        message: 'props[3].kind: crate needs the finish "timber/crate-stencil"',
      },
    ]);
  });

  test("each missing path is named once, in slab order, also a role its finish lacks", () => {
    const table = tableOf(["housing/top", "housing/machine"]);
    const params = { width: 3, length: 8, height: 3.5, color: DARK, glow: "cyan" };
    const problems = refused("enclosure", params, undefined, table);
    expect(problems.map((p) => [p.rule, p.path, p.message])).toEqual([
      [
        "finish",
        "props[3].kind",
        'props[3].kind: enclosure needs the finish "housing/machine-plate"',
      ],
      ["finish", "props[3].kind", 'props[3].kind: enclosure needs the finish "luminaire/band"'],
    ]);
  });

  test("a refused parameter is reported before any finish is looked up", () => {
    const problems = refused("crate", { color: DARK, size: 9 }, undefined, tableOf([]));
    expect(problems.map((p) => [p.rule, p.path])).toEqual([["param", "props[3].params.size"]]);
  });
});
