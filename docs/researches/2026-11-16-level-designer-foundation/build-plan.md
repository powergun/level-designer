# Build plan

This plan orders the work from the empty workspace to the moment the first dressing pass
is handed to the owner for QA. Component names and surfaces come from the architecture
document of this directory. Shapes, rules and messages come from the
[level format](level-format.md).

## Working rules

- Everyone works in one tree. An engineer edits only their own component. The integrator
  owns the root files: manifests, lockfile, recipes, tool configuration and root
  documents. The art author owns the description once the integrator has seeded it.
- Each milestone opens with the integrator's skeleton subtask. It creates the
  milestone's packages with the dependency lists of the architecture and the test-only
  dependencies the checks need, a facade, a README, the rules file and a knowledge stub.
  Engineers then fill their package, its README and its knowledge document.
- A subtask has one developer and one separate reviewer. The reviewer checks the work
  against these documents line by line and draws its own samples at the rule limits.
- An engineer iterates with the per-package commands. Root gates run one at a time under
  the gate lock.
- A subtask is done when its checks pass and the root gates pass. Its report separates
  what was verified from what is inferred. The owner commits each green milestone.
- Subtasks listed as parallel touch different components and can run at once.

## Milestone 1: bridges and formats

The linking spike proved one mechanism per sibling, and subtask 1.1 lists the root-file
changes the mechanisms need. Subtasks 1.2 to 1.6 run in parallel; the real-stage test
of 1.6 waits for the stage entry of 1.2.

### 1.1 Root wiring and skeletons (integrator)

- Scope: the root-file changes listed below, and the packages `sec111-gateway`,
  `destruction-gateway`, `render-gateway`, `level-format` and `level-glb`.
- Checks: the setup recipe detaches the rendering copy and emits the destruction
  declarations. The test and lint recipes pass with the three facades in place. A page
  entry that uses sec-111's physics and the rendering library bundles with one three.js
  core and one Rapier root. Setup stops with a message that names the sibling when
  sec-111 or destruction-poc has no install.
- Depends on: nothing.

The root-file changes the linking needs:

- `tsconfig.json`: allow `.ts` import extensions, and exclude the runtime half of
  `destruction-gateway`, every `generated/` tree, and the stage and testing entries of
  `sec111-gateway`.
- `tsconfig.tests.json`: exclude the runtime half and the `generated/` trees.
- `tsconfig.tools.json`: include the stage and testing entries of `sec111-gateway`.
- `.oxlintrc.runtime.json`: exempt those two entries from the browser-safe rules.
- `package.json`: the override that pins three.js to the library's version.
- `.gitignore`: the `generated/` directory of a package.
- `knip.jsonc`: the emit script of `destruction-gateway` and the detach script of
  `render-gateway` as entries.
- The setup recipe: after the frozen install, detach the rendering copy, then emit the
  destruction declarations.
- The lint recipe: emit the declarations and check the type half of
  `destruction-gateway` before the first type check. After the browser-safe type check,
  bundle the browser entries: `sec111-gateway` and `render-gateway` now, the QA page
  from milestone 4. `destruction-gateway` is not bundled, because no page imports it.

### 1.2 `sec111-gateway`

- Scope: the three entries and `GAME_VALUES`. The main entry re-exports and holds the
  value module. The stage entry re-exports `prepareLevel` and holds `readBaseStage`.
  The testing entry re-exports `readCommittedLevel`. No other logic.
- Checks: the wiring test reads the base stage and the committed level, then asserts
  relations only: a capsule stops before an installed panel and walks on after its
  removal. The drift guard fails on a deliberately changed value of each group: the
  lens, the post configuration, the player's motion and a private constant found by
  text. The main entry passes the browser-safe type check, and its page bundle holds
  one Rapier copy and no level preparation.
- Depends on: 1.1.

### 1.3 `destruction-gateway`

- Scope: one entry in two halves, the emit script and the tests. Neither half holds
  logic.
- Checks: the tests use every runtime name through the typed entry. A
  2 x 1.2 x 0.05 m model meshes to 20 triangles, one cast hits it, one rail removes
  material, and a Rapier sync of the slab yields a collider. A separate type check
  proves that the type half resolves completely, so no name falls back to `any`.
- Depends on: 1.1.

### 1.4 `render-gateway`

- Scope: the facade, the detach script and the drift guards.
- Checks: a browser entry that names every re-export type-checks and bundles with one
  three.js core. The guards hold: every installed library file equals its sibling
  original, no installed file is a hard link to the sibling, and the root override
  equals the library's three.js pin.
- Depends on: 1.1.

### 1.5 `level-format`

- Scope: the description shape, the level `.json` shape, the one slab admission and the
  reading of a slab as an oriented box. No mesh and no kind parameters.
- Checks: every rejection returns its path. Each cap and each numeric range passes at
  its limit and fails one step beyond. The decoder and the slab admission reject the
  same slab with the same message. Encoding then decoding a rounded level returns the
  same level, and equal levels give equal bytes. The corners of a rotated, lifted slab
  equal hand-computed values.
- Depends on: 1.1.

### 1.6 `level-glb`

- Scope: container, assembly, the three inspection facts and world triangles. No
  description type and no sibling import in its source.
- Checks: on the real base stage, read through the gateway as a test-only dependency,
  the static scene keeps the 97 base nodes at their indices, adds `stage` with the
  scale matrix and appends the seal objects. Inspection counts 113,697 base triangles
  and 12 per seal. Every sentence of the GLB contract is asserted on the written file:
  roles, mesh node names, indexed primitives, materials, one buffer. On a synthetic
  file, inspection reports a primitive without a material.
- Depends on: 1.1.

## Milestone 2: slabs, props and sheets

Subtasks 2.2 to 2.4 run in parallel.

### 2.1 Skeleton (integrator)

- Scope: the packages `slab-model`, `prop-kit` and `snapshot-render`.
- Checks: the root gates pass.
- Depends on: milestone 1.

### 2.2 `slab-model`

- Scope: the shared builder and the intact mesh. It runs under Bun only.
- Checks: slabs of 1 x 1, 2 x 1.2, 4 x 2.4 and 7 x 3.2 m mesh to 12, 20, 44 and 92
  triangles. On a dark slab, the +Z face and the four edge faces carry the slab's
  colour and the -Z face its tint; no face shows another colour. The mesh of a rotated,
  lifted slab is indexed and stays inside the slab's box.
- Depends on: 1.3, 1.5.

### 2.3 `prop-kit`, the box kinds

- Scope: placement, run splitting, the parameter tables with every secondary
  dimension, and the kinds `conveyor`, `enclosure`, `container`, `crate`, `partition`
  and `light-strip`.
- Checks: for each kind, at every corner of its parameter ranges: no two slabs enter
  each other by more than 1 mm, every slab passes the slab admission, the slab count
  matches the format document, and every panel's +Z face looks outward. A standing kind
  touches its floor; a hanging kind hangs at its stated height. A yaw of 90 degrees
  turns local +Z to world +X. A bad parameter returns `param` with its range. The
  reviewer judges each kind's secondary dimensions against the references, and judges
  each kind for a pocket that a player can enter and a minion cannot.
- Depends on: 1.5.

### 2.4 `snapshot-render`

- Scope: the three sheets and the custom view, on a loud background. The lens and the
  eye height are inputs. No lighting model beyond the one fixed light.
- Checks: a box at a known place covers the expected pixels of a plan tile and a section
  tile within one pixel. A known point lands on the expected pixel of a perspective
  tile. A box room with a hole shows background pixels through the hole. Two renders in
  one run are byte-identical. The developer reports the render time of the real base
  stage; no test asserts a time.
- Depends on: 1.6.

## Milestone 3: the sealed hall builds

Subtasks 3.2 and 3.3 run in parallel. At the end, an empty sealed hall builds, is
accepted and renders to sheets.

### 3.1 Skeleton (integrator)

- Scope: the packages `level-rules`, `level-pipeline` and `level-cli`, the `levels`
  directory, and a git-ignore entry for the author's draft description.
- Checks: the root gates pass.
- Depends on: milestone 2.

### 3.2 `level-rules`

- Scope: every check of the format document, as pure functions over the facts of a
  built level. One judgement returns the findings, the ramp zone and the lane widths;
  the facade also offers the triangle cap, which the report shows.
- Checks: each rule passes a box-room case at its limit and fails one step beyond with
  the documented subject: 0.69 and 0.70 m, 1.49 and 1.50 m for `gap`; 0.49 and 0.50 m
  for `low-top`; 2.16 and 2.17 m for `support`. Props typed 1.5 m apart, at -0.8 and
  -2.3, pass `gap`. A corridor of exactly 3.0 m measures 3.0 m. On sec-111's committed
  prepared level three lanes measure more than 7 m and the +x-z lane 1.8 m, and a
  partition across a lane fails `lane`. `scale` fails on a prepared level that measures
  another scale and names the value to set.
- Depends on: 1.2, 1.3, 1.5, 1.6, 2.2, and 2.3 for its tests.

Four more checks hold the footprint, the filled gap, the proof and the limits themselves:

- The footprint: a hollow prop of 0.05 m walls under a roof at 2.17 m, laid across a
  lane at an odd yaw, fails `lane`. Two tall enclosures of `prop-kit` without a glow,
  typed 0.68 m apart, measure 0.74 m and fail `gap`.
- The filled gap: three touching crates in a row, a touching block, chained conveyors
  and a row against a wall of two body boxes pass `gap`, also at an odd yaw. A 1.0 m
  gap between two props fails, also with a third prop in part of it, and a corridor
  that widens from 1.0 m fails with its narrow end plugged. A third prop that leaves
  0.70 m free fails with its own pair; 0.69 m passes.
- The proof: it passes a seeded sample of 200 slabs of every material at random poses,
  the cap corners down to a 0.02 m face, and the glow slabs that `prop-kit` expands for
  the longest conveyor, enclosure and light strip.
- The guard: on sec-111's capsule, a 0.7 m gap blocks and 0.76 m lets pass; a 0.30 m
  top is climbed and a 0.5 m top blocks; an underside at 2.17 m lets pass.

### 3.3 `level-pipeline`, the build

- Scope: reading the inputs, the six build steps, the rounding of slabs with
  `level-format`'s rounding, the build errors in their step order, the `place` error,
  the optional prepared static level and the committed description's path. The
  preparation takes the empty wall list `{"walls":[]}`, which sec-111 cannot reject, so
  a rejected result is a defect and throws. No judgement.
- Checks, the real-data home for builds: a fixture with one crate on each floor level
  builds. The preparation measures scale 1, the crates stand at 0 and 0.3241 m, every
  slab lies on the format's grid, the `.json` decodes to the same level, and today's
  `prepareLevel` admits the whole GLB. A description error and an unknown base name
  block the build before any preparation. A prop outside the interior blocks it with
  `place` on the fixture's prepared static level.
- Checks of the budget: one test file holds every case that builds. It makes two full
  preparations: the fixture's static scene, and the fixture's level GLB as a whole file.
  The `prepare` error case adds one call, which sec-111 refuses at its survey. Every
  other build of the file passes the fixture's prepared static level.
- Depends on: 1.2, 1.5, 1.6, 2.2, 2.3.

### 3.4 `level-pipeline`, the validation

- Scope: running `level-rules` on a built level and shaping the report as a value.
- Checks: the fixture of 3.3 is accepted. Its report holds the interior, the floor
  heights, the ramp zone and the spawns, and its summary the body boxes beside
  `BODY_BOX_LIMIT`. The same fixture with one point light moved under the floor is
  rejected with `light-floor`. A level above the first-pass budget is accepted, and its
  summary shows the counts beside the budget. Every case builds in the test file of 3.3
  on the fixture's prepared static level; no case prepares again.
- Depends on: 3.2, 3.3.

### 3.5 `level-cli` and the recipes

- Scope: the four commands with their options and the printed report; the integrator
  adds the four recipes. The tool fills the snapshot input: the markers, the lens, the
  eye height, the figure height and the hang height of `level-rules`.
- Checks: through the tool's `run` entry with an injected pipeline, captured streams and
  a temporary work directory: `validate` prints the report from the hall facts to the
  verdict line, and a blocked build as its error lines; `build` writes the pair only
  for an accepted report; `snapshot` writes three sheets, and a fourth with an eye and
  a look-at point; `validate` and `kinds` write nothing; a `--description` path replaces
  the default; and the exit statuses are 0, 2 and 3. The integrator runs each recipe
  once on the seed description.
- Depends on: 3.4, 2.4, 1.2.

### 3.6 Seed description (integrator)

- Scope: `levels/dark-factory.json` with no props. `base.scale` is 3.89956. Base
  overrides copy the values sec-111's view audit applies today: five PBR overrides, the
  fixture material at its dimmed strength and seven double-sided meshes. Lighting takes
  the baseline of the rendering report: today's game values with the key turned
  overhead. `finishes` holds plain starting values and `glows` is empty; the art pass
  tunes both. The 13 seals follow below.
- Checks: the build is accepted, with scale 1 and the body boxes under the limit. A
  test in `level-pipeline` builds the committed description and expects acceptance; it
  is the gate's third preparation. A reviewer reads the sheets and finds each of the
  13 seals in place and no background colour inside the hall on the plan tiles, the
  elevations and the view tiles, nor on a custom view from 15.5 m down into a pier on
  each side.
- Depends on: 3.5.

Thirteen seals close the hall. Seven follow the measured openings of the contract
report. Two side boxes close the band between each side wall's top and the ceiling,
behind the sloped upper panels. The eight piers outside the window bays are folds of
the wall, open at the back and the top. The -X box runs down to the floor behind that
wall and closes its four. The +X wall's upper band stands on the interior's edge, so a
long box that passes `seal` would cover it; each +X pier takes a back plate between its
own sides instead.

## Milestone 4: the QA app

Subtasks 4.2 and 4.3 run in parallel. Subtask 4.5 starts when 4.4 has delivered its
protocol unit.

### 4.1 Skeleton (integrator)

- Scope: the packages `level-view`, `qa-client` and `qa-server`, and a lint step that
  bundles the page entry for the browser.
- Checks: the root gates pass.
- Depends on: milestone 3.

### 4.2 `level-view`

- Scope: GLB loading, the mesh rules, the mapping rules, the frame call, the failure
  hooks and the clear colour choice. No input and no page.
- Checks, under Bun without a GPU: the baseline lighting yields one directional light
  aimed at the interior centre whose shadow volume equals the interior box, and its
  point lights with decay 2 and no shadow. The look equals `GAME_VALUES` with the
  level's haze and exposure. A texture-free fixture GLB gets the mesh rules. A renderer
  that reports a WebGL fallback is refused with the component's own typed error. A
  fired device-lost hook and a fired error hook each reach the caller's failure
  callback. No pixel is asserted.
- Depends on: 1.2, 1.4, 1.5.

### 4.3 `prop-kit`, the articulated and overhead kinds

- Scope: `robot-arm` with `baseColor`, `bridge-crane` with `runwayColor`, and
  `jib-crane`.
- Checks: the checks of 2.3 at every parameter corner, and for the arm a seeded sweep
  of shoulder and elbow between the corners. A runway of 60 m splits into runs of at
  most 40 m. The reviewer judges these kinds as in 2.3.
- Depends on: 2.3.

### 4.4 `qa-client`

- Scope: the page of the architecture document. The protocol unit lands first.
- Checks of boot: the real page entry boots on a hand-built document against a scripted
  fake of the protocol. The status strip names the running step. Both regions carry
  their inline heights. A request that never answers ends in `failed: no answer`. The
  log batch is flushed before each step and on an error. A `console.error` and a
  `console.warn` reach the log. `?leak=1` selects the loud clear colour.
- Checks of failures and marks: each visible-failure message appears in the status
  strip and in the log. `F3` and `M` open the comment box; `Enter` saves and shows the
  number and path; `Esc` cancels; an empty comment is blocked with a message; a refused
  mark of another run shows `reload the page`; a failed save keeps the comment.
- Checks of walk: on sec-111's committed prepared level the page installs one blocker
  box per slab from a level `.json`, the capsule stops at a slab, and fly returns to
  walk on the floor under the camera.
- Depends on: 4.2, 1.2, 1.5.

### 4.5 `qa-server`

- Scope: the server of the architecture document.
- Checks, with an injected build and one real server on a temporary port: the real page
  boots against the real handler, and the page and the four level files are served.
  One mark request appends exactly one line with every field. A mark of another run and
  a comment above 2,000 characters are refused with a message. The run log holds the
  start facts with the sibling paths, the verdict, each request and the stop line. A
  missing sibling install is a logged start failure that names the sibling.
- More checks: a taken port and a foreign `Host` are refused; a request without `Origin`
  is served. A blocked build still serves the session facts. The page bundle holds one
  three.js core, one Rapier root and no destruction lib module. Tests remove what they
  create.
- Depends on: 3.4, 4.4.

### 4.6 Recipe and documents (integrator)

- Scope: the QA recipe, the launch and QA steps in the README, and the knowledge
  documents with the accepted limits.
- Checks: the lint gate passes; the recipe passes the work directory.
- Depends on: 4.5.

### 4.7 Silent-failure audit (reviewer)

- Scope: one list of every step of boot, walk, fly, mark and logging, every way each
  step can fail or stall, and the message the human sees. The list covers a stalled
  step, a lost GPU device, a console-only error and a page left open across a restart.
- Checks: every row of the list maps to one test in `qa-client` or `qa-server`. The
  integrator measures the test recipe; above 30 s the milestone stays open.
- Depends on: 4.4, 4.5.

## Milestone 5: the art pass

The art team is one author and one reviewer. The author edits a draft copy of the
description and replaces the committed file only when the validator accepts the draft,
so the root gate stays green beside milestone 4. Passes run one after another, because
they edit one file. The section "The art pass" below gives the team's inputs, loop and
exit.

### 5.1 Authoring guide (integrator)

- Scope: one root document with the hall in numbers, the placement rules in plain
  words, the budgets and the accepted limits. The integrator measures the corbel and
  pier numbers from the stage's triangles once. The guide says that a hanging height
  counts from the floor under `at`, with the corbel example: the same corbels take
  `railHeight` 13.66 over the front floor and 13.34 over the raised slab. It says that
  `gap` and `lane` measure a prop's standing slabs: a tall hollow prop counts by its
  walls, and a tall enclosure without a glow stands narrower than its `width` by the
  eave on each long side. It copies no kind parameter; the kinds command prints those.
- Checks: the lint gate passes.
- Depends on: 3.6.

### 5.2 Storage and cover

- Scope: containers, crates and partitions on the raised slab and along the front
  floor's edges. Box kinds only.
- Checks: the validator accepts; the reviewer reads the sheets against the layout
  references.
- Depends on: 5.1.

### 5.3 Assembly lines

- Scope: two lines of conveyors, enclosures and robot arms along the front floor, with
  a main lane between them and open spawn areas.
- Checks: the validator accepts; the slab count leaves room for 5.4; the reviewer reads
  the sheets against the mood references' line layout.
- Depends on: 5.2, 4.3.

### 5.4 Overhead

- Scope: bridge cranes resting on the pier corbels under the trusses, jib cranes beside
  the lines, and light strips.
- Checks: the validator accepts inside the budget; the section sheet shows every runway
  beam on its corbels and every hook above 2.17 m.
- Depends on: 5.3.

### 5.5 Look and lighting

- Scope: finishes, glows, base overrides and the lighting section, moved toward the
  dark factory by the numbers: a low environment, deeper haze, glowing strips, and
  point lights last. No prop moves.
- Checks: the validator accepts. No agent judges the result; the owner does.
- Depends on: 5.4.

## Milestone 6: hand-off

### 6.1 Hand-off (lead)

- Scope: the final gate run, the green tree handed to the owner for the commit, and the
  hand-off checklist sent to the owner.
- Checks: every line of "Ready for the owner's QA" holds on the tree the owner commits.
- Depends on: milestones 4 and 5.

## The art pass

### What the art team receives

- The tools: the four recipes of `level-cli`.
- The authoring guide of 5.1. It holds the measured hall: interior, floors, ramp,
  piers, corbels, trusses, fixtures, decks, static blockers and free rectangles. The
  validator's report opens with the live interior, floors, ramp zone and spawns.
- The references in `docs/art-direction/references`. The layout images show bridge
  cranes on runway beams, jib cranes on columns and stock on an open floor. The mood
  images show long assembly lines with robot arms, near-black ambient, cyan strips and
  small point accents.
- The budget: 800 slabs in 200 props. The caps: 1,024 slabs, 300,000 triangles and
  eight point lights.
- The accepted limits: thin edges ignore SMG rounds, nothing collapses, debris does not
  rest on slabs, and a hollow prop wider than about 1 m can become a hiding spot once
  destroyed.

### The loop

The author keeps the draft at `levels/dark-factory.draft.json`, which git ignores.

```sh
just kinds                                                # once
just validate --description levels/dark-factory.draft.json
just snapshot --description levels/dark-factory.draft.json
just fmt                                                  # before the owner commits
```

Edit the draft -> validate -> read the findings -> snapshot -> read the sheets -> edit
again. The author reads every sheet after every pass. A sheet shows layout, scale and
silhouette; it shows no mood. When the validator accepts the draft, the author copies it
over the committed description.

After each pass the reviewer reads the sheets against the references and reruns the
validator. The reviewer also places its own probe props at the rule limits, on a copy of
the draft.

### Ready for the owner's QA

- The validator accepts the committed description with no finding.
- The level stays inside the first-pass budget of 800 slabs in 200 props. The validator
  only prints the budget, so this line holds the art team to it.
- The reviewer has checked the sheets against the references: both lines, the storage
  area, the cranes, open spawn areas and open main lanes. No plan tile, elevation or
  view tile shows the background colour inside the hall.
- The root gates pass on the tree handed over, and the test recipe's time is recorded.
- The silent-failure audit of 4.7 is closed.
- The owner has committed that tree on the working branch. QA runs that commit.

## Hand-off checklist

The lead sends the owner this checklist with the green tree; the owner commits it first.

```sh
just setup   # once
just qa      # prints the address and the path of the run log
```

- Before the first setup: sec-111, destruction-poc and rendering-poc are checked out
  beside this repository, and sec-111 and destruction-poc have run their own setup.
- Open the printed address in Chrome with hardware acceleration.
- Move: click to capture the mouse; `W`, `A`, `S`, `D` and `Shift`; `V` for walk or fly;
  `E` and `Q` rise and sink in fly.
- Mark: go to a problem, press `F3` (or `M`), type a comment, press `Enter`. The status
  strip confirms the mark number and the file.
- Judge what agents cannot: the mood against the references, shadows, haze and glow.
- Judge the seals with `?leak=1` added to the address: no loud colour shows at the end
  wall, the four window panels, the door panel, the back slot, above either side wall
  or, from fly height, down into a pier.
- Judge the play space: spawn areas, main lanes, gaps, and collision against every kind
  of prop.
- Send back two files: the marks file and the run log.

If the app fails on the owner's machine, the run log tells us why:
`<workdir>/qa/logs/qa-<local start time>.log`. It opens before the sibling check and the
build, and records the start facts, the build, every request, every page step and how
the run ended. Only a failure to open the log itself prints on the terminal alone. The
marks are in `<workdir>/qa/marks.log`. The recipes pass the repository's scratch
directory as the work directory.
