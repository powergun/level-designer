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
- `snapshot` builds without judging, so a rejected level can still be seen. It writes
  `plan.png`, `section.png` and `view.png` to `<workdir>/snapshots/`, and `custom.png` when
  `--eye` and `--look-at` name a view.

Every command takes `--description <path>` and `--workdir <dir>`. The description defaults
to the committed one that `level-pipeline` names. `build` and `snapshot` need `--workdir`;
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
  glow print `required` or `optional` as `prop-kit`'s listing states.

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
