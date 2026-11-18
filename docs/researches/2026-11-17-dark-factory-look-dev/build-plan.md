# Look development build plan

This plan orders the look development of TASK-001.07 in seven milestones. The working
rules and milestones 1 to 3 stand here; [milestones 4 to 7](build-plan-milestones-4-7.md)
stand in a document of their own. Terms, premises and component surfaces come from the
[design](design.md), the data and its rules from the [finish format](finish-format.md),
and the static objects and the hall from
[non-destructible objects](non-destructible-objects.md).

## Working rules

The working rules of the foundation's build plan hold: one tree, one developer and one
separate reviewer per subtask, an engineer edits only their own component, the integrator
owns the root files and adds an engineer's dependency edges when the engineer starts, and
root gates run one at a time under the gate lock. This plan adds four:

- The art comes first. No subtask builds a tool that measures cost, a guard for a copy
  that sec-111 does not hold yet, or a bake. Every check below proves behaviour that its
  component owns.
- No subtask writes code that is obviously slow: what is static is computed once, and no
  draw refreshes per frame.
- No agent starts the QA server, a browser or a headless browser, in the foreground or
  in the background. What only a GPU shows is the owner's to judge.
- Every milestone ends in the owner's test, and the team pauses there. The owner's marks
  and words open the next milestone.

The art team is one author and one reviewer, as in the first art pass. They work on the
draft description and judge on sheets, by the loop of the design's "Changing a finish".
A subtask's heading names the subtasks it depends on, after "after"; a subtask without
them depends only on the milestone before.

## How a milestone ends

Every milestone changes what the owner sees in the QA app, and its last subtask is the
owner's test. Before it the integrator brings the documents in line: the authoring guide
and the look and lighting document with what an author gained, and the component
documents by their engineers. The owner commits the lead's tree, whose root gates pass,
and tests that commit on two machines, the Windows desktop and the MacBook Pro M1:

```sh
just setup   # after a commit that changed a manifest
just qa      # prints the run log's path, then the address to open in Chrome
```

Each test step names what the owner starts and judges:

- Art direction: the stated objects against the stated reference images, with a mark by
  `F3` wherever the look is wrong.
- Frame rate: the `<n> fps` of the heads-up display at the stated places, on both
  machines. A rate the owner finds too low brings lighter recipes first.

One file explains a failure: the run log, `.tmp/qa/logs/qa-<start time>.log`. It holds
the build with its errors, every page step with its time and every console error. A
program that fails shows on the page, as a line of its kind in the alarm banner. The
owner sends back the run log and the marks file, `.tmp/qa/marks.log`.

## Milestone 1: the first finish

The pair gains the finish data, the view draws painters, and the housings of the lines
take the first real recipes: the smallest slice that puts real layers in front of the
owner. It tests what only the owner's GPU shows: that the programs compile, how long they
take at the start, the frame rate with a painted prop filling the frame, and whether
brighter props keep the mood.

Every other path of the seed table is a plain body, so the rest of the level looks as it
did, with one known change: every inside face takes its slab's own colour. Partition
backs, facing webs and the tops of hanging slabs lose the mesher's light tint and darken.

### 1.1 `finish-paint`, the interface and four kinds

The integrator adds the manifest's `exports` and the browser bundle, lint and knip
entries of `finish-paint` when its first source lands, before 1.1's root gates; without a
source file they fail the gates.

- Scope: first the skeleton's rules, README and knowledge, rewritten to the design. Then
  the unit `arithmetic` with the interface of fifteen operations, `latticeHash` and the
  number back end; the unit `kinds` with `bands`, `rectangle`, `dots`, `noise` and the
  footprint fade; and the slab's frame rule on plain numbers. No dependency yet.
- Checks of the number back end: every operation returns the 32-bit rounding of its
  result. `mix`, `step` and `smoothstep` take the shading languages' argument order.
  `hash` equals `latticeHash` over the other fourteen.
- Checks of the kinds, each at its limits and one step beside them. `bands`: 1 inside a
  band, 0 outside; ten periods in a footprint return the width over the period. `dots`:
  1 at a lattice point, 0 midway between four. `rectangle`: 1 inside, 0 outside, one half
  on an edge. `noise`: in 0 to 1, equal across a cell edge, 0.5 at a wide footprint.
- Checks of the hash and the frame rule: `latticeHash` returns Wall Lab's `hash31` at
  stated cells, computed by hand from its formula. The 4,096 seeds give 4,096 different
  rows of eight cells. On each of a slab's six faces a point returns its hand-computed
  coordinates, face size and class.

### 1.2 `level-format`

- Scope: the finish table with its lengths, common keys, effects, `extends`, the four
  kinds of 1.1 and the caps of 24 layers and two `noise` layers; a slab's four finish
  keys; `finishes` in the level `.json`; the hash of an id into a seed. One admission
  serves the description and the level.
- Checks: every rejection returns its path. Each cap passes at its limit and fails one
  step beyond: 24 layers, two `noise` layers, a number of 999,999, a seed of 4,095, a
  factor of 4. A length is read as metres, as a share and as a share with an offset. A
  recipe without optional keys takes the format's defaults. An unknown key, kind,
  coordinate or face, a layer without an effect, a fitted diagonal band and a role that
  extends a missing or an extending role are refused. Encoding then decoding a level
  returns the same level. The hash of an id is stable and lies in 0 to 4,095.

### 1.3 `finish-paint`, the painter (after 1.1, 1.2)

- Scope: the unit `painter` over the interface, on a face with a low corner and a size,
  from its caller's base shade. The integrator adds the edge to `level-format`.
- Checks: a body as the base shade returns the tint times its shade. A face that no
  layer covers returns its base shade unchanged, also a shade that no body gave. Each
  effect mixes at a coverage of 0, one half and 1; a later layer draws over an earlier
  one, and `paint` restores the tint. A layer draws only on its faces and inside its
  clip. A detail is whole at 0.44 of its end and gone at its end. A wearing layer follows
  the wear. `ends`, `out`, `top`, a share with an offset and a fitted period land on
  hand-computed places, on a centred face and on one with another low corner. A recipe
  draws its extended layers first. A seeded, edge-biased sample stays in range.

### 1.4 `prop-kit` (after 1.2)

- Scope: a finish path for every slab of every kind, the parameters `wear` and `seed`,
  each slab's seed, and the `finish` error. A slab's number is 0 until milestone 7.
- Checks: at every parameter corner each slab names the path the finish format lists for
  its role: a container's ends `corrugated/end`, a crate's +X and -X sides
  `timber/crate-stencil`, a partition's path by its material. An enclosure takes the
  cabinet role up to a width of 1.2 m and the machine role one step beyond. Every slab of
  a prop with a glow names that glow. One prop's slabs carry different seeds from 0 to
  4,095, stable for the prop's seed. A table without a needed path returns `finish` with
  the kind and the path. The foundation's checks still hold at every corner.

### 1.5 `slab-model` (after 1.1, 1.2)

- Scope: first the component's rule on vertex colours, rewritten to the design. Then
  every vertex carries the slab's colour and its pattern data, by `finish-paint`'s frame
  rule; the mesher's vertices stay. The integrator adds the edge to `finish-paint`.
- Checks: slabs of 1 x 1, 2 x 1.2, 4 x 2.4 and 7 x 3.2 m keep their 12, 20, 44 and 92
  triangles. On a rotated, lifted slab every vertex of the six faces carries the frame of
  its own position and the slab's colour.

### 1.6 `level-glb` (after 1.5)

- Scope: a slab's three new accessors, and one fallback material per finish path and
  glow, with the path and the glow in its `extras`.
- Checks: every sentence of the finish format's GLB section on a slab and its material
  is asserted on a written file, the image count among them. A glow slab whose body is
  lit emits its glow at the glow's strength, as in the first pass. sec-111's level
  preparation still admits the whole file, in the pipeline's test.

### 1.7 `level-pipeline` and the seed table (integrator; after 1.4, 1.6)

- Scope: the build carries the finish data to the pair. The committed description gains
  a table with one plain recipe for every path the kit names: the first pass's metalness
  and roughness, no layer, and a body `lit` of 1 on `luminaire/strip` and
  `luminaire/band`, so every lamp keeps its light. The root README and the project
  knowledge gain `finish-paint`.
- Checks: the committed description builds and is accepted, and the material of each of
  its glow slabs emits at its glow's strength. The root gates pass, and the test recipe
  stays under 30 seconds.

### 1.8 `level-view`, painters (after 1.3, 1.6, 1.7)

- Scope: the unit `paint`: the node back end, the static material class and a painted
  twin for each GLB material whose recipe draws what the GLB's fallback cannot: a layer,
  or a body `shade` other than 1. The start takes the finish table and instantiates each
  twin's shader once, before the compile. The integrator adds the edge to `finish-paint`.

The checks run under Bun without a GPU and assert no pixel:

- The scene, on a GLB built in the test with a stage mesh, a box and two slabs of one
  layered path, a glowing slab of a path with a shade and a plain lamp: the box and the
  two slabs share one twin, the glowing slab has its own, and the lamp and the stage
  keep the GLB's materials. A path the table lacks fails the load. A twin keeps its
  source's colour, side and shadow side.
- The graphs: every twin of the committed table builds to a vertex and a fragment
  program on the CPU, through three's node builder on a renderer that the test never
  initialises or disposes. Every program declares the face's size and the four slab
  numbers flat. Each of the fourteen operations yields the shader node of its meaning,
  and `hash` is built from `latticeHash`. The static material reports no node to
  refresh.

### 1.9 `qa-client` (after the start's type of 1.8)

- Scope: the page hands the level's finish table to the view. In every run a console
  error raises the console alarm: one line of the alarm banner that says that programs
  may have failed and props may be missing, and names the run log. A shader that fails
  to compile stops the drawing as a GPU error and needs nothing new.
- Checks: the view starts with the level's finish table. A console error raises the
  alarm with its fixed text and the run log's path, and its line is in a log batch; a
  second error adds no second line. The QA app's list of visible failures gains the row.

### 1.10 The housing finish (art team; after 1.3, 1.7)

- Scope: first the art team's painter notes, brought in line with the finish format: the
  keys' names, the caps, a container code of six digits and floor lines as layers. Then
  the roles of `housing` by the briefs, with the marks the four kinds draw and without
  legends. The housings' tints rise onto the value ladder's mid step, the floor's level.
- Checks: the validator accepts. No sheet exists yet, so the reviewer reads each recipe
  against its brief and the format. The reviewer also evaluates each role on the number
  back end, through `finish-paint`'s facade from the scratch directory, at stated points
  of each face, inside each mark, outside it and on its edge, and reports what it
  computed.

### 1.11 The owner's test (lead)

- Starts: a setup, then the QA app, on both machines. A failure: the run log. The
  hand-over says that the housing recipes were computed and not seen.
- Judges the programs: the level shows, every housing is drawn, no GPU error stops the
  drawing and no banner reports a console error; and how long the start stays on the
  level view's step, which the run log times.
- Judges the frame rate: at the player spawn, and one metre from a housing's long side,
  where the housing fills the frame, on the MacBook Pro M1 above all.
- Judges the art direction: the housings against the blue lines and the teal aisle
  images, whether housings at the floor's level keep the mood, and the darker insides.

## Milestone 2: the finish sheet, containers and cranes

The art team gets its finish sheet, and the containers and both cranes take their
finishes. The view needs no change: a kind is a template over the interface, and a
`face` layer the painter's constant.

### 2.1 `finish-paint`, four more kinds and the swatch

- Scope: in the unit `kinds`, `cells`, `disc` and `border`; in the painter, a `face`
  layer's coverage of 1; in a unit of its own, the swatch of a recipe on the number back
  end: a face, or a window of it, as pixels, and their mean albedo. A kind's constant
  `smoothstep` edges rise, here and in 7.1: WGSL refuses any others.
- Checks: `cells` covers 1 on a gap's centre line and 0 at a cell's centre; a row shift
  of one half moves the next row's gaps by half a cell; a cell's tone is equal inside
  it, lies in 0 to 1 and differs from its neighbour's. `disc` and `border` cover 1
  inside, 0 outside and one half on each edge; a ring is empty inside its inner radius,
  and a diamond measures along the summed coordinates. The mean of a swatch of bands
  equals the hand-computed mix of its two shades.

### 2.2 `level-format`

- Scope: in the unit `layer`, the patterns and keys of 2.1's four kinds, and `jitter`.
- Checks: each new key passes at its limit and fails one step beyond, with its path; a
  size keeps a length's limits. A `jitter` on another kind than `cells` is refused.

### 2.3 `prop-kit`

- Scope: the parameters that choose a role: `door` of a container, `stencil` of a crate
  and `finish` of a partition; and the girder web of 1.25 m.
- Checks: `door` moves the door role between the ends, and `none` leaves two plain ends.
  `stencil` switches the stencil role on the +X and -X sides. A partition's `finish`
  takes any path of the table and defaults by its material; a path the table lacks
  returns `finish`. The deeper crane rises 2.4 m or less above `railHeight`.

### 2.4 `snapshot-render` (after 2.1)

- Scope: the finish sheet, one page per swatch, as the design's "What agents see" states
  it. A swatch states its path, its recipe, its tint and its slab: the size, the seed and
  the wear. The sheet owns the scales and takes each face from the slab frame rule. The
  integrator adds the edges to `finish-paint` and `level-format`.
- Checks: on a recipe of bands of a known period the page shows each band on its
  hand-computed pixel columns at 5 mm, the bands' mean at 40 mm, its ruler on whole
  metres and its printed mean. A face of 9 m is drawn at 20 mm. Two renders are equal.

### 2.5 `level-cli` (after 2.4)

- Scope: the snapshot command fills one swatch per finish path in use, on the path's
  largest outside face of the level, and writes its page to
  `snapshots/finish/<finish>.<role>.png`, after it has emptied that directory.
- Checks, through the `run` entry with an injected pipeline: the pages hold every path in
  use, each on its largest outside face, and each page's file is announced.

### 2.6 Corrugated and beam (art team; after 2.2, 2.3, 2.5)

- Scope: the roles of `corrugated` for a container and of `beam` for both cranes, with
  their marks except legends, by the briefs; the containers' door ends; both tints on the
  value ladder, crane yellow on its signal step. The author corrects 1.10 on the sheet.
- Checks: the validator accepts. The reviewer reads the finish sheet against the briefs
  and the reference crops, and each printed mean against the value ladder.

### 2.7 The owner's test (lead)

- Starts: a setup, then the QA app, on both machines. A failure: the run log.
- Judges the art direction: the containers, and the cranes with their deeper girders,
  against the three cranes, the crane shop, the double girder and both jib images.
- Judges the frame rate: at each spawn, and one metre from a container's long side.

## Milestone 3: the hall's surfaces

The two floors and the side walls take hall finishes, drawn over the stage's own
materials. The hall covers most of every frame: this is the frame rate's hardest test.

### 3.1 The hall's brief (art team)

- Scope: a brief, beside the painter notes, for the hall finishes of the front floor, the
  raised slab and the side walls: each mark with its size, value and reference, and what
  "more interesting and detailed" means there. The slab's role keeps to `top` layers.
- Checks: the reviewer reads the brief against the references, the surfaces report and
  the finish format: every mark is a layer the format can state, inside the caps.

### 3.2 `level-format`

- Scope: `finish` on a base override, in the unit `description`, and what a hall finish
  leaves out, in the unit `finish`.
- Checks: an override's path that the table lacks returns `finish` with its path. A
  named role with a body, a `lit` effect or a layer on a face other than `top`, `bottom`
  and `outside` returns `shape`, also when it gains one through `extends`. A hall finish
  with a `noise` layer passes. An override without a finish decodes as before.

### 3.3 `level-glb` (after 3.2)

- Scope: the finish path in the `extras` of a stage material and of its twin.
- Checks: both are asserted on a written file, and a stage material without a finish
  gains no `extras`.

### 3.4 `finish-paint`, the hall's frame

- Scope: in the unit `frame`, the hall's frame rule over the interface: from a position,
  a normal and the interior box to a face.
- Checks, on the number back end, at hand-computed points: a floor, a ceiling, a wall
  that faces along X, one that faces along Z, and a slope on each side of the 0.7 limit.
  Each returns its coordinates, its class and the interior's low corner and size.

### 3.5 `level-view`, the stage wrap (after 3.3, 3.4)

- Scope: a stage material whose `extras` carry a hall finish with at least one layer
  draws through the wrap, a static material: its own look as the painter's base shade,
  the hall's frame on the node back end, and the role's layers over it. A mesh with the
  slab's vertex data takes the twin rule, a stage mesh the wrap.
- Checks, under Bun without a GPU: a stage material with a finish draws through a wrap
  that keeps its source's maps, factors, side and shadow side; one without a finish, or
  with a role of no layer, keeps its material; one whose path the table lacks fails the
  load. The wrapped graph builds
  to a program and reports no node to refresh. For that build the test stubs the
  renderer's feature query, which a textured material asks before a backend exists: its
  one departure from 1.8.

### 3.6 `snapshot-render` and `level-cli` (after 3.2, 3.4)

- Scope: one page per hall finish that an override names, with one tile per class its
  layers draw on, over a plain grey ground: a wall or a ceiling as a window of 16 by 8 m
  from the interior's low corner at 20 mm, a floor whole at the plan sheet's 50 mm and
  orientation, split into parts side by side, with rulers in level coordinates.
  `snapshot-render` draws the page; `level-cli` fills the swatch from the description's
  overrides and the prepared interior.
- Checks: the pages hold each hall finish once, each with the classes it draws on; the
  window, the floor's parts and the rulers land on hand-computed pixels; a slab's page
  keeps its bytes.

### 3.7 The hall finishes (art team; after 3.1, 3.5, 3.6)

- Scope: the hall finishes of the brief: both floors' joints, the walls' darker base, and
  the floor lines the layout keeps: at the aisle, the ramp's foot and the slab's edge.
- Checks: the validator accepts. The reviewer reads the hall's pages against the brief
  and the references, and each floor line against the plan sheet beside the floor's
  page.

### 3.8 The owner's test (lead)

- Starts: the QA app, on both machines. A failure: the run log.
- Judges the art direction: the floors' joints and lines against the crane shop and the
  assembly hall, the walls' base against the pillar jib and the double girder, and
  whether the hall, away from its marks, looks as it passed.
- Judges the frame rate: at each spawn, looking down the hall, and one metre from a side
  wall. A rate under milestone 2's brings fewer layers on the floors first.
