# level-cli knowledge

`@level-designer/level-cli` is the command-line tool of the level designer. It owns the
argument parsing, the file writes under the work directory, the printed text and the exit
statuses. The level pipeline owns what a description builds and how it is judged; the
snapshot renderer owns the sheets.

## Entry and program

`run` takes the arguments after the program, a pipeline and two output streams, and returns
the exit status. The pipeline holds the level pipeline's read, build and validation, its
committed description path and the snapshot renderer. The program file `main.ts` passes the
real ones and the process streams; tests inject fakes. The root recipes run the program file
with Bun and pass the scratch directory as `--workdir`, so no source names it.

## Commands

- `kinds` prints every prop kind of `prop-kit`'s listing and reads no description.
- `validate` reads the description, builds it in memory and prints the report, or the lines
  of a blocked build. It writes nothing.
- `build` runs `validate` and then writes `<workdir>/level/<name>.glb` and
  `<workdir>/level/<name>.json`, only when the validator accepts.
- `export-dressing` reads the description, builds through placement and writes
  `<workdir>/factory-dressing/props.json` and `<workdir>/factory-dressing/decorations.json`.
  Use `validate` to judge a changed level before exporting it.
- `snapshot` builds without judging, so a rejected level can still be seen. It writes
  `plan.png`, `section.png` and `view.png` to `<workdir>/snapshots/`, and `custom.png` when
  `--eye` and `--look-at` name a view. Then it writes one finish page per finish path in
  use to `<workdir>/snapshots/finish/`: the slab pages, the box pages, the seal pages, then
  the hall pages.

Every command takes `--description <path>` and `--workdir <dir>`. The description defaults
to the committed one that `level-pipeline` names. Each writing command needs `--workdir`;
`--eye` and `--look-at` belong to `snapshot` and come together. A point is written
`x,y,z` in metres; a value that starts with a minus sign needs the `=` form, as in
`--eye=-5,1.7,-20`. An option value must not be empty: `--workdir=` would name the current
directory, so an empty value is a usage error. Relative paths resolve against the current
directory. The level name is an id of the format, so `<name>` never leaves the `level`
directory.

## Streams and exit statuses

Standard output carries data and reports. Standard error carries one `wrote <absolute path>`
line per written file, the usage and file errors, and the reason a writing command wrote
nothing: `nothing written: the build is blocked` or `nothing written: the level is
rejected`. Every outcome prints at least one line.

- 0: accepted or done.
- 2: a blocked build or a rejected level, with nothing written.
- 3: a usage error, or a file that cannot be read or written. A usage error prints
  `level-cli: <problem>`, which names the command or option at fault, then the usage line.
  A file error prints `cannot read <path>: <reason>` or `cannot write <path>: <reason>`.
- 1: a defect or a broken sibling install, such as a missing base stage. The run ends with
  Bun's error and stack, which name the file or the failing step.

## Printed text

Every line is tab-separated and starts with its fact's name.

- The report follows the level format: `interior` with its two corners, `floors`, `ramp`
  with its z extent or `none`, one `spawn` per spawn, one line per finding (rule, subject,
  message), then `triangles`, `points`, `body-boxes`, one `lane` per minion spawn, `slabs`
  and `props`, each with its count or width beside its cap, budget or kept width. The last
  line is `accepted` or `rejected: <n> findings`, `rejected: 1 finding` for one.
- A blocked build prints one line per build error (rule, path, message), then
  `blocked: <n> errors`, or `blocked: 1 error` for one.
- The kind listing prints `kind <name>`, then one `param` line per parameter: its name, its
  type, its range, form or choices, and its default, `required` or `optional`. A colour and a
  glow print `required` or `optional` as `prop-kit`'s listing states. A material and a choice
  print their choices joined by commas, a boolean prints `true,false`, and both print their
  default. A finish prints `a path of finishes` and `default by material`, then the listing's
  path for each material as `material=path`, joined by commas. A seed prints its
  whole-number range and `default the hash of the id`.

Every length prints with `level-format`'s `formatLength`, and a point as its three lengths
joined by commas. The kind parameters' ranges and defaults print through it too: most are
lengths, and the arm's angles and the bridge crane's fractions lie on its 0.1 mm grid, so they
print unchanged. Counts and caps print
as plain integers. Every number comes from its owner's value: the report's from the
pipeline's report, the listing's from `prop-kit`.

## Snapshot input

The tool fills the renderer's input from the built level and the game values:

- the interior, the floor heights and the spawns of the prepared static level;
- one point per prop in description order: its `at` on the floor under it, read with
  `floorHeightAt`;
- the lens from `GAME_VALUES`, the figure height from `PLAYER_BODY`, and their eye height,
  the figure height times the eye ratio of `GAME_VALUES`;
- one section line at `level-rules`' hang height, where a hanging prop starts; the tool
  holds no height of its own;
- the custom view of `--eye` and `--look-at`. The two points must differ.

## Finish pages

The art team reads one page per finish path, not one sheet of all paths: an image reader
scales a large sheet down until its marks are lost. A path is in use when a slab, a static
object, a painted seal or a base override names it. Its page is `<finish>.<role>.png`, the path with its
`/` turned into a `.`; a finish and a role are ids, so the name holds no other dot. The
slab pages follow the paths' first use: props in level order, slabs in slab order.

Each slab page's swatch stands on the path's largest outside face: the slab whose width times
height is the largest. On a tie the first slab in level order keeps it, so the same level
gives the same pages. The swatch takes from the built level only:

- the path as its label, and the drawn recipe from `level-format`'s `recipeAt`;
- the slab's colour as the level states it, its `#rrggbb` text;
- the slab's size, seed and wear.

The snapshot renderer decodes the colour and the finish's `light` and draws the page. A
page shows albedo only, so a `"glow"` mark takes the finish's `light`, whatever glow a prop
names.

The finish page tests run `snapshot` on a hand-built level with a small finish table. Every
page is written and announced in order of first use. A tie keeps the first slab, a slab one
0.1 mm grid step wider takes the path, and a thick slab loses to a thinner one with a larger
face.

## Box pages

A static object is a box, and its finish path gets a box page when neither a slab nor a
base override names the path: a slab's path keeps its slab page, and an override's path
keeps its hall page. The box pages come after the slab pages and before the hall pages,
under the same name rule, in the paths' first use in description order.

A box page is a slab's page, so the snapshot renderer draws it unchanged. The swatch takes
the description alone, never the placement:

- the path as its label, and the drawn recipe from `recipeAt`;
- the static object's colour as the description states it, its `#rrggbb` text;
- a slab subject of the static object's width, height and length as the thickness, with
  its admitted seed and wear.

The page stands on the static object with the largest shown face, its width times the
larger of its height and its length: the page shows the box's upper face and its sides
along the width. On a tie the first static object keeps the path. The page's `top` tile
is the box's upper face in the box's own frame, and its `outside` tile the side along the
width.

The box page tests run `snapshot` on the hall fixture with static objects. They prove the
order of the three kinds of page, the swatch's fields, the tie whether the height or the
length is the larger, a 0.1 mm grid step wider that takes the path, the length that counts
where it exceeds the height, and the slab and hall pages that keep a shared path.

## Seal pages

A seal with a finish is a painted box, and its path gets a seal page when no slab, static
object or base override names the path. A flat seal names no path. The seal pages come
after the box pages and before the hall pages, under the same name rule, in the paths'
first use in description order: the slab and box pages hold the stronger claims on a
shared path, and the hall pages are a page of another form.

A seal page is a slab's page too. Its swatch takes the description alone: the path and its
recipe from `recipeAt`, the seal's colour text, its admitted seed and wear, and a slab
subject from the seal's extents. A seal has no yaw, so its longer plan extent is the width,
X on a tie, its height the height, and its shorter plan extent the thickness. The page
stands on the seal with the path's largest side, its width times its height; on a tie the
first seal keeps the path. The `outside` tile is then the seal's large side, and the `top`
and `bottom` tiles are its faces only where the longer extent runs along X.

The seal page tests run `snapshot` on the box fixture with seals. They prove the order of
the four kinds of page, the swatch's fields, the width along Z and along X, also by one
0.1 mm grid step, the largest side, also over a thicker seal, the tie, and the slab, box and hall pages that keep a
shared path while a flat seal adds none.

## Hall pages

A hall finish is in use when a base override of the description names it as `finish`; the
level `.json` holds no override, so the description is the source. Each hall finish gets
one page under the same name rule, after the slab pages, in the order the overrides first
name it. A path that both a slab and an override name gets its hall page only.

A hall swatch takes the path, its drawn recipe from `recipeAt` and a plain grey ground,
`#808080`, as its tint: the sheet reads no stage texture, so it shows the marks and not the
surface's value. Its subject holds the interior box of the prepared static level and the
classes the role draws on: the distinct `on` of its drawn layers, extended ones first, in
order of first appearance. The format limits them to `top`, `bottom` and `outside`. The
snapshot renderer owns the rest: the hall's frame, a wall's or a ceiling's window of 16 by
8 m, and a floor whole in the plan sheet's scale and orientation. A role without layers
gets a page with its title only.

The hall page tests prove the order, one page per path, the hall page that wins a shared
path, and each swatch's interior, classes, recipe and grey.

## Finish directory

After a successful build and before it writes, `snapshot` removes the finish directory with
everything in it, so the directory holds exactly the pages of this level. A level whose
slabs, static objects, seals and overrides name no finish writes the sheets and no page. A blocked build writes nothing and leaves the
directory as it was. The finish page tests prove the empty and the blocked case.

## What the tests prove

Every test enters through `run` with a fake pipeline, captured streams and a fresh
temporary work directory that it removes. The fake answers with a built level on sec-111's
committed prepared level and hand-written reports; no test prepares a level.

- `validate` prints an accepted report line by line, and a report's lengths print through
  the format's rendering; a rejected report prints its findings and verdict; a blocked
  build prints its error lines and is not judged.
- The committed description is the default and `--description` replaces it. An unreadable
  description is named with exit 3 and is not built.
- `kinds` lists every kind and parameter of `prop-kit`'s listing, each form included, and
  reads no description. `validate` and `kinds` write nothing.
- `build` writes the pair only for an accepted report and names a directory it cannot
  write; a rejected or blocked level writes nothing and says why.
- `snapshot` writes the finish, box, seal and hall pages as their sections above state.
- `snapshot` writes three sheets, and a fourth for a custom view, without judging. Its input
  equals the prepared level's facts, the description's prop points, the game values and the
  hang height of `level-rules`.
- Each usage problem exits 3 before any read and names its command or option.

Its dependency documents:

- [level-pipeline knowledge](../../level-pipeline/docs/KNOWLEDGE.md);
- [snapshot-render knowledge](../../snapshot-render/docs/KNOWLEDGE.md);
- [prop-kit knowledge](../../../packages/prop-kit/docs/KNOWLEDGE.md);
- [level-format knowledge](../../../packages/level-format/docs/KNOWLEDGE.md);
- [level-rules knowledge](../../../packages/level-rules/docs/KNOWLEDGE.md);
- [sec111-gateway knowledge](../../../packages/sec111-gateway/docs/KNOWLEDGE.md).
