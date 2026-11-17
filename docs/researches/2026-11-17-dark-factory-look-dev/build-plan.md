# Look development build plan

This plan orders the look development of TASK-001.07. Terms, premises and component
surfaces come from the [design](design.md), and the data and its rules from the
[finish format](finish-format.md). The working rules of the foundation's build plan hold
unchanged: one tree, one developer and one separate reviewer per subtask, an engineer
edits only their own component, the integrator owns the root files and adds an
engineer's dependency edges when the engineer starts, and root gates run one at a time
under the gate lock.

The plan builds toward the owner's first look at real materials as early as it can. No
subtask builds a tool that measures cost: the owner reads the frame rate in the QA page's
heads-up display, in a normal run, each time finishes land.

**Human note** it is important to pause at the completion of each milestone and let human
test/QA the work-in-progress build to ensure the correct art direction and overall performance.
As said, we focus on the art delivery here rather than optimization; we will avoid disastrous
performance drop. The per-milestone human test can help us identify such art or perf mistakes
timely.

## Milestone 1: the contract and the painter

The pair gains the finish data, and both back ends draw a recipe. At the end the level
looks as it did, because every recipe of the seed table is a plain body, and the art team
has its finish sheet.

Subtasks 1.1 and 1.2 run in parallel. Subtasks 1.3 to 1.5 start when the types of 1.2
have landed, and 1.7 to 1.9 when the painter of 1.3 has.

### 1.1 `finish-paint`, the interface and the kinds

- Scope: the unit `arithmetic` with the interface of fifteen operations, `latticeHash`
  and the number back end; the unit `kinds` with `bands`, `cells`, `dots`, `rectangle`,
  `noise`, `face`, `disc` and `border` and the footprint fade. The source is
  browser-safe and has no dependency yet.
- Checks of the number back end: every operation returns the 32-bit rounding of its
  result on 32-bit inputs. `mix`, `step` and `smoothstep` take their arguments in the
  shading languages' order, each proved at its ends and at its middle. Its `hash` equals
  `latticeHash` over its own fourteen operations.
- Checks of the kinds, each at its limits and one step beside them, on the number back
  end with a footprint of 1 um unless stated:
  - `bands`: coverage 1 inside a band and 0 outside; the mean over one period equals the
    width over the period; a footprint of ten periods returns that share within 1 %.
  - `cells`: gap coverage 1 on a gap's centre line and 0 at a cell's centre; a row shift
    of one half moves the next row's gaps by half a cell; the tone is equal inside a
    cell, lies in 0 to 1 and differs between neighbours.
  - `dots`: 1 at a lattice point, 0 midway between four points, with unequal pitches.
  - `rectangle`: 1 inside, 0 outside, one half on an edge at a footprint of 1 cm.
  - `noise`: values in 0 to 1; equal on both sides of a cell edge; 0.5 at a footprint of
    half its shorter wavelength and beyond.
  - `disc` and `border`: 1 inside, 0 outside and one half on each edge; a ring is empty
    inside its inner radius; a diamond measures along the two coordinates summed.
- Checks of the hash: it returns equal values for equal cells and fills ten equal
  buckets within a fifth of the mean over 10,000 cells. Over a fixed row of eight cells
  the 4,096 seeds give 4,096 different rows of values.
- Depends on: nothing; the integrator's skeleton of the package is in the tree.

### 1.2 `level-format`

- Scope: the finish table with its lengths, layers and caps, the floor's colour and
  lines, a seal's optional finish and number, a slab's four finish keys, and their
  canonical text in the level `.json`. One admission serves the description and the
  level.
- Checks: every rejection returns its path. Each cap passes at its limit and fails one
  step beyond: 24 layers, two `noise` layers, three `glyphs` layers, 32 floor lines, a
  number of 999,999, a seed of 4,095, an effect's factor of 4. A length is read as
  metres, as a share and as a share with an offset. A recipe that leaves out every
  optional key decodes with the defaults the finish format states. An unknown key,
  kind, coordinate, face or glyph, a layer without an effect, a fitted diagonal band, a
  legend with `across` or `up` or on a face other than `outside`, a role that extends a
  missing or an extending role, and a seal's missing path are refused. Encoding then
  decoding a level returns the same level, and equal levels give equal bytes.
- Depends on: nothing.

### 1.3 `finish-paint`, the painter

- Scope: the unit `painter` over the interface, and the pixels and means of a recipe on
  the number back end. The integrator adds the edge to `level-format`.
- Checks: a body alone returns the tint times its shade. Each effect mixes at a coverage
  of 0, one half and 1, and a later layer draws over an earlier one; `paint` restores
  the tint over it. A layer draws only on its faces and inside its clip. A detail is
  whole at 0.44 of its end and gone at its end. A wearing layer follows the slab's wear.
  The coordinates `ends`, `out` and `top`, a length as a share with an offset, and a
  fitted period land on hand-computed places. An extending recipe draws the extended
  layers first. A seeded, edge-biased sample of recipes stays in range on every output.
- Depends on: 1.1, 1.2.

### 1.4 `prop-kit`

- Scope: a finish path for every slab of every kind, the new parameters, the number and
  the seed of each slab, the `finish` error, and the girder web of 1.25 m.
- Checks: at every parameter corner each slab names the path the finish format lists
  for its role. `door` moves the door role between the ends, `stencil` switches the
  stencil role, and an enclosure takes the cabinet role up to a width of 1.2 m and the
  machine role one step beyond. Every slab of a prop with a glow names that glow. A
  girder's number is its capacity times ten plus its number. A number left out, and the
  number of a kind without one, is stable for one seed and differs between seeds. The
  slabs of one prop carry one number and different seeds, each seed from 0 to 4,095. A
  table without a needed path returns `finish` with the kind and the path. The checks of
  the foundation's plan still hold at every corner, the deeper crane among them: it
  rises 2.4 m or less above `railHeight`.
- Depends on: 1.2.

### 1.5 `slab-model` and `level-glb`

- Scope: `slab-model` returns the indexed mesh with the pattern data of each vertex, by
  mapping rule 1. `level-glb` writes that data, the 16-bit colours and indices, one
  fallback material per finish path and glow, and the data of a seal that names a
  finish.
- Checks of the mesh: slabs of 1 x 1, 2 x 1.2, 4 x 2.4 and 7 x 3.2 m keep their 12, 20,
  44 and 92 triangles and hold fewer than three vertices per triangle. On a rotated,
  lifted slab every vertex of each of the six faces carries its hand-computed
  coordinates, face size and class.
- Checks of the file: every sentence of the finish format's GLB section is asserted on
  a written file, the fallback materials and the image count among them. Today's level
  preparation of sec-111 still admits the whole file, in the pipeline's test.
- Depends on: 1.2.

### 1.6 `level-pipeline` and the seed table (integrator)

- Scope: the build carries the finish data to the pair. The committed description gains
  a table with one plain recipe for every path the kit names: a body with today's
  metalness and roughness and no layer. The report gains the value table; the
  integrator adds the edge from `level-pipeline` to `finish-paint`.
- Checks: the committed description builds and is accepted. The integrator measures the
  size of its `.glb` once: it is smaller than the 14,329,916 bytes before. The report of
  the committed level holds one row per path and tint in use. The root gates pass, and
  the test recipe stays under 30 seconds.
- Depends on: 1.3, 1.4, 1.5.

### 1.7 `level-view`, painters

- Scope: the unit `paint`: the node back end, the static material class and a painted
  twin for each GLB material of a seal or a slab. The start takes the level's finish
  table and instantiates each twin's shader from its recipe once, before the compile:
  the recipe's numbers are constants of the shader, which reads only the GLB's vertex
  data and takes its emission from the glow.
- Checks of the scene, under Bun without a GPU, on a GLB built in the test with a stage
  mesh, a seal with a finish, two slabs of one finish path and a glowing slab: the seal
  and the slabs draw with twins, the two slabs share one twin, the stage keeps its
  materials, and the count of twins equals the paths and glows in use. A twin keeps its
  source's colour, side and shadow side.
- Checks of the graphs: every path of the committed table builds to a vertex and a
  fragment program on the CPU, through three's node builder on a renderer that the test
  constructs and never initialises or disposes. Every built program declares the face's
  size and the slab's four numbers with flat interpolation. Each of the fourteen
  operations yields the shader node of its meaning with its arguments in order, and
  `hash` is built from `latticeHash` and builds in a program. The static material
  reports no node to refresh in the builds the test makes.
- No pixel is asserted. Only the owner's browser shows that a graph compiles on a GPU.
  The page bundle of the QA server's test still holds one three.js core.
- Depends on: 1.3, 1.5.

### 1.8 `qa-client`

- Scope: the page hands the level's finish table to the view. In every run a console
  error raises the page alarm: one banner that says that programs may have failed and
  props may be missing, and names the run log.
- Checks: the view starts with the level's finish table. A console error raises the
  alarm with its message and the run log's path, and its line is in a log batch; a
  second error adds no second banner. The reviewer adds the row to the QA app's list of
  visible failures and maps it to this test.
- Depends on: the start's type of 1.7.

### 1.9 `snapshot-render` and `level-cli`

- Scope: the finish sheet, as the design's "What agents see" states it, drawn on the
  number back end; the snapshot command writes it beside the other sheets. The
  integrator adds the edge from `snapshot-render` to `finish-paint`.
- Checks: on a recipe of bands of a known period the sheet shows each band on its
  hand-computed pixel columns at 5 mm, the bands' mean at 40 mm, and its ruler on whole
  metres. A face of 9 m is drawn at 20 mm. The sheet holds every finish path in use,
  each on its largest face of the level. Two renders are byte-identical. The developer
  reports the snapshot's time on the committed level.
- Depends on: 1.3, 1.5.

### 1.10 Documents and hand-over (integrator)

- Scope: `finish-paint` in the root README and the project knowledge; the component
  documents of the changed components, by their engineers.
- Checks: the root gates pass, and the test recipe's time is recorded and stays under
  30 seconds. The owner starts the QA app once on the committed level: it looks as it
  did, and the hand-over names the run log as the file that explains a failure.
- Depends on: 1.6 to 1.9.

## Milestone 2: the first materials

The art team is one author and one reviewer, as in the first art pass. They work on the
draft description and judge on sheets.

```sh
just validate --description levels/dark-factory.draft.json
just snapshot --description levels/dark-factory.draft.json
```

### 2.1 Corrugated, housing and beam (art team)

- Scope: the recipes of the three finishes that cover most prop pixels of the two spawn
  views, with their marks except legends, by the art direction's briefs. The scope
  holds the two seal roles of the corrugated finish, named on the seals that take them:
  from the spawns the seals cover up to 8 % of the frame, beside 0 to 14 % for the
  props. It also moves the tints and body values of the three finishes onto the value
  ladder.
- Checks: the validator accepts. The reviewer reads the finish sheet against the briefs
  and the reference crops, and the value table against the value ladder.
- Depends on: milestone 1.

### 2.2 The owner's first look (lead)

- Scope: the owner walks the level with the three finishes in the QA app and reads the
  frame rate in the heads-up display, at the spawns and close to a painted prop.
- Checks: the owner's marks and words on the look and on the frame rate are the input
  of milestone 3. A frame rate the owner finds too low brings lighter recipes first.
- Depends on: 2.1.

## Milestone 3: the rest

- 3.1 `finish-paint` and `level-view`, glyphs: the kind `glyphs` and its stroke masks on
  both back ends, with no new operation. Checks: each of the 20 glyphs draws its
  hand-written strokes; a `#` reads every digit from 0 to 9 at every place of 0,
  100,000 and 999,999, also on a back end whose `mul` errs by three units in the last
  place; a legend's box is empty outside its glyphs.
- 3.2 `level-view` and `qa-client`, the floor wrap: the stage materials that carry a
  floor draw through the wrap when the level has floor lines, and the page hands the
  lines and the floor heights to the view. Checks: a wrapped material keeps its
  source's maps, factors, side and shadow side; a material without a floor is not
  wrapped; a level without lines wraps nothing.
- 3.3 The other finishes (art team): cast concrete, bed, casting, timber, steel stock,
  luminaire and block, with their lit parts.
- 3.4 Floor lines (art team): the lines of the briefs.
- 3.5 Legends (art team): codes, capacities and numbers in the plant's one numbering, at
  most three in a recipe.
- Checks of 3.3 to 3.5: as 2.1. The owner walks the level and reads the frame rate
  again, on the complete set and with the floor lines.

## Milestone 4: the level and the hand-off

- 4.1 The level (art team): the changes of the art study that the rulings allow: values
  on the ladder, cabinets beside the housings, the references' stock in the yard, block
  walls for the two fences, one station repeated at one pitch with the sixteen arms
  kept, in three poses, and each bridge parked with a web toward a main view. Checks:
  the validator accepts inside the budget of 800 slabs; the reviewer reads every sheet.
- 4.2 Documents (integrator): the authoring guide gains the finishes, how to change
  one, the value ladder and the finish sheet; the component documents state what each
  component now owns. Checks: the lint gate passes.
- 4.3 Hand-off (lead): the final gates and the owner's QA of the look, with the frame
  rate read once more. Checks: the level stays under 300,000 triangles with no image
  beyond the base stage's.
