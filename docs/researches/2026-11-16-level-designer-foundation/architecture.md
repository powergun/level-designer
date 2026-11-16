# Level designer architecture

The level designer turns one committed level description into the level pair that sec-111
plays: a `.glb` with the sealed and dressed factory, and a `.json` with the destructible
props and the lighting. Fourteen components carry that flow; three are the only bridges
to the sibling repositories. The [level format](level-format.md) defines the description,
the pair and the validator's rules. The [build plan](build-plan.md) orders the work.

## Data flow

The authoring source of truth is the committed level description,
`levels/dark-factory.json`. The level pair is a deterministic build product. Nobody edits
it, and only the description is committed.

One build runs six steps in order:

1. `level-format` admits the description text once and returns a typed description.
2. `level-glb` assembles the static scene: the base stage under a root scaled by the
   description's `base.scale`, the base material overrides and the seal boxes. It writes
   the static GLB bytes.
3. `sec111-gateway` runs sec-111's `prepareLevel` on the static GLB with an empty wall
   list. The prepared static level supplies the interior, floors, spawns and body world.
4. `prop-kit` expands every prop into slabs and stands each prop on its prepared floor.
   The pipeline then rounds every slab once; every later step reads the rounded slabs.
5. `slab-model` meshes every slab with destruction lib's own mesher.
6. `level-glb` appends one object node per prop and writes the level GLB, and
   `level-format` encodes the level `.json`.

`level-pipeline` owns this sequence. It returns one built level: the typed description
and its hash, the first 12 hex digits of the SHA-256 of the description file; the pair
with its typed level; the base stage's image count; and the prepared static level as
sec-111 returns it, typed and as its two files. Three consumers read a built level:

- built level -> `level-rules` -> report, the validator's verdict;
- built level -> `snapshot-render` -> PNG sheets for agents;
- built level -> `qa-server` -> `qa-client` -> the human's walk-through.

The command-line tool, the QA server and the tests call this one pipeline, so they cannot
disagree about what a description builds.

Preparation sees static geometry only: the base stage and the seals. sec-111 keeps
deriving interior, floors, collision, spawns and navigation. The level designer reads
those facts from the prepared static level and stores none of them.

## Components

A component is one workspace package named `@level-designer/<name>`. Components whose
source is browser-safe live in `packages/`. Components that use Bun live in `tools/`: the
command-line tool, the QA server and the two libraries that only they consume. Every
component below names its consumers in this operation. Destruction lib stays on the Bun
side: `destruction-gateway`, `slab-model` and `level-rules` run under Bun only, and no
page imports them. A page with both sec-111's physics and destruction lib's debris
backend would bundle two copies of Rapier.

### Gateways

Each sibling repository has exactly one gateway, and no other component imports a sibling.
A gateway is the bridge to its sibling: re-exports, the reader of a sibling file, the
copied game values and their guards, and no other logic. The synopsis generator cannot
follow a re-export out of the repository, so this section is the gateways' surface document.

**`sec111-gateway`** (`packages/`) re-exports from sec-111's package facades by relative
path. The sources run on sec-111's own install and pass this repository's type checks as
they are. Its main entry is browser-safe:

- from `@sec111/level-data`: `decodePreparedLevel`, `floorHeightAt`, `PLAYER_BODY`,
  `BODY_BOX_LIMIT` and the type `PreparedLevel`;
- from `@sec111/physics`: `createPhysicsWorld` and the types `PhysicsWorld`,
  `CapsuleBody` and `BlockerSet`;
- its own `GAME_VALUES`, the one module of game-owned values that the QA app copies.

Two more entries run under Bun only. The stage entry serves `level-pipeline`: it
re-exports `prepareLevel` from `@sec111/level-prep` and adds `readBaseStage`, the one
reader of the base stage file, at the path sec-111's own constant names. The testing
entry serves tests only: it re-exports `readCommittedLevel` from
`@sec111/level-data/testing`, sec-111's committed prepared level of the base stage. Both
entries use Node file access, so they are exempt from the browser-safe lint rules and
type check and are checked with the tool sources. Consumers of the main entry:
`level-rules`, `level-pipeline`, `level-view`, `qa-client` and `level-cli`.

**`destruction-gateway`** (`packages/`) has one entry in two halves. The runtime half
re-exports from destruction lib's sources by relative path and runs on destruction-poc's
install. The type half re-exports the same names from declarations that a small emit
script generates with destruction-poc's own compiler settings. The script runs in the
setup recipe and at the start of the lint recipe, and writes a git-ignored `generated/`
directory inside the gateway. Destruction lib's sources cannot enter a NodeNext program,
and NodeNext stays law, so the generator is the price. The entry re-exports:

- from core: `WallModel`, `createChunkGeometry`, `snapshotRetainedCuboids`,
  `createDamageBudget` and the types `MaterialId` and `MeshData`;
- from collision: `CollisionScene`, `createPointContact`, `toWorldPoint`,
  `toLocalPoint`, `rotateVector` and the type `RigidTransform`;
- from physics: `RapierBackend`.

Consumers: `slab-model` and `level-rules`. The runtime half sits outside every type-check
program, so its tests use every runtime name through the typed entry, and a separate
type check proves that the type half resolves completely.

**`render-gateway`** (`packages/`, browser-safe) depends on the rendering-poc library
through a `file:` path, which is the only mechanism that gives a page one copy of
three.js. It needs a root override that pins three.js, the compiler flag that allows
`.ts` import extensions, and a detach step in the setup recipe that breaks the hard
links of the installed copy. It re-exports `createRenderer`, `attachWindowResize`,
`NoGraphicsError`, `createPostUniforms`, `PostPipeline`, `resolveRenderQuality`,
`PerfStats` and the types `RendererContext`, `PostConfig` and `PostUniforms`. Consumer:
`level-view`. Its drift guards assert that the installed copy equals the sibling
original, that no installed file is still a hard link, and that the root override equals
the library's pin.

### Formats and geometry

**`level-format`** (`packages/`, no dependency) owns the two persisted shapes. It admits a
description as a typed value or a list of problems with their paths, and it encodes and
decodes a level as canonical `.json` text. One slab admission holds the format caps for
decode and for the build, and one rounding puts a slab on the grid. The lighting section
has one type and one admission for both shapes. It also reads a slab as an oriented box
with eight corners, and `formatLength` prints every length of a message or a report, for
`level-pipeline`, `level-rules` and `level-cli`. Other consumers: `level-pipeline` (parse,
rounding, admission, encode, `MAX_POINT_LIGHTS` for the report), `prop-kit` (rounding,
admission, colour form, message rules), `qa-client` (decode, boxes), `level-rules` (boxes,
`LENGTH_SLACK`) and every component that names a slab or lighting type.

**`level-glb`** (`packages/`, no dependency) owns the GLB contract. It reads a GLB
container, assembles the static scene and the level scene, and writes one-buffer GLB
bytes. Its inspection returns three facts: the triangle count, the primitives without a
material and the image count. A reader returns world-space triangles with their material
colours. Consumers: `level-pipeline` (assembly, inspection), `level-rules` (the
inspection facts as a type) and `snapshot-render` (triangles).

**`slab-model`** (`packages/`; depends on `destruction-gateway` and `level-format`) is
the only place where a slab becomes a destruction lib object. One shared builder
constructs the `WallModel` of a slab, with the inner colour set to the slab's colour so
that edges do not show destruction lib's default tan. From the model the component
derives the intact indexed mesh in world space. Consumers: `level-pipeline` (meshes) and
`level-rules` (the model).

**`prop-kit`** (`packages/`; depends on `level-format`) owns the prop kinds. Each kind has
a parameter table and a generator that returns slabs in the prop's own frame. The kind
tables own every secondary dimension. The kit places a prop by its plan position, its
yaw and the floor height it is given, splits long runs to the slab caps, turns each
panel's +Z face outward and tags glowing slabs. Consumers: `level-pipeline` (expansion)
and `level-cli` (the kind listing).

### Judgement

**`level-rules`** (`packages/`; depends on `level-format`, `level-glb`, `slab-model`,
`sec111-gateway` and `destruction-gateway`) holds every validator check as a pure
function over the facts of a built level, which the level format lists. One judgement
returns the findings, each with a rule id, a subject and the message an author reads,
and the ramp zone and the lane widths that the report shows. It is asynchronous, because
destruction lib's Rapier backend loads that way. Its destructibility unit runs the proof
recipe on every slab through the shared builder. Consumers: `level-pipeline`, and
`level-cli` for `HANG_HEIGHT`, the height its section sheet marks.

### Bun-side components

**`level-pipeline`** (`tools/`; depends on `level-format`, `level-glb`, `prop-kit`,
`slab-model`, `level-rules` and `sec111-gateway`) owns the build sequence in three steps.
The read returns the description file's bytes and the base stage, or names a description
file it cannot read. The build takes both and, optionally, a prepared static level that
replaces the preparation; the tests of one file share one preparation this way. It
returns the built level or the build errors. The validation inspects the level GLB, runs
`level-rules` and shapes the report. Consumers: `level-cli` and `qa-server`.

**`snapshot-render`** (`tools/`; depends on `level-glb`) rasterises a level GLB on the
CPU into plan, section and perspective sheets and encodes them as PNG. It is Bun-side
because it compresses with the runtime's zlib and only `level-cli` consumes it.

**`level-cli`** (`tools/`; depends on `level-pipeline`, `snapshot-render`, `prop-kit`,
`sec111-gateway`, `level-rules` for `HANG_HEIGHT` and `level-format` for `formatLength`)
is the command-line tool. It owns argument parsing, file writes under the work directory,
report text and exit statuses. Consumers: the art team's agents and the root recipes.

**`qa-server`** (`tools/`; depends on `level-pipeline` and `qa-client`) is the loopback
server of the QA app. Consumer: the human, through the QA recipe.

### Browser components

**`level-view`** (`packages/`; depends on `render-gateway`, `level-format`,
`sec111-gateway` and three.js) draws a level pair through the game's pipeline. It loads
the GLB, applies the generic mesh rules, builds the environment and the lights from the
lighting section by the mapping rules, and runs the post pipeline with the game's look.
It starts on WebGPU only and raises its own typed error for a WebGL fallback. It
compiles against the complete light set and renders the warm-up frames before it shows
the level. It sets the renderer's device-lost and error hooks and reports both to its
caller. Consumer: `qa-client`.

**`qa-client`** (`packages/`; depends on `level-view`, `level-format` and
`sec111-gateway`) is the QA page: boot, input, walk, fly, marks, heads-up display and the
page side of the run log. It also owns the JSON protocol types it shares with
`qa-server`. It imports no destruction lib.

### Dependency order

The workspace graph is acyclic and points down:

- the gateways, `level-format` and `level-glb` depend on no workspace package;
- `slab-model`, `prop-kit` and `snapshot-render` depend only on that layer;
- `level-rules` and `level-view` depend on the two layers below them;
- `level-pipeline` adds `level-rules`, and `qa-client` adds `level-view`;
- `level-cli` and `qa-server` sit on `level-pipeline`; `level-cli` also reads
  `level-rules`, the gateway and `level-format`, and `qa-server` depends on `qa-client`.

## Collision the game owns

The QA app walks the game's collision. The prepared static level becomes sec-111's physics
world. Every slab then enters that world through the blocker sink the game's walls engine
uses. The page installs one blocker box per slab, built from the slab's `size`,
`position` and `rotation` in the level `.json`. The game splits the same box into one
set per chunk; an intact slab's chunks tile its box exactly, so the solid is the same
and only the seams differ.

These behaviours were measured in sec-111's physics world, with one box per slab and with
one set per chunk; both gave the same numbers. The wiring test of `sec111-gateway` repeats
the stop and the release; a guard in `level-rules` repeats climb, gap and headroom.

- An upright 4 x 2 x 0.05 m panel across the path stops the player capsule 0.405 m from
  the panel's centre plane. After `blockers.remove` the capsule walks through, and a
  panel yawed 30 degrees makes it slide along the face.
- A deck with its top at 0.90 m blocks. A slab with its underside at 2.17 m lets the
  capsule pass; one at 1.80 m blocks it.
- The capsule climbs tops up to 0.30 m and stops at 0.35 m. It passes a gap of 0.76 m
  between two panels and stops at 0.74 m.

The static scene was measured too. Under one new root scaled by 3.89956, today's
`prepareLevel` returns scale 1 and the unchanged interior, floors and spawns, with 226
body boxes. The 13 seal boxes make it 227 and move each +z minion spawn by one 0.25 m
grid step. Today's reader also admits a destructible node with `extras`. One preparation
takes about 3 s. The tests of `level-pipeline` repeat the scale and the admission.

## Command-line tools and recipes

`level-cli` has four commands. The integrator adds one root recipe per command, under the
command's name, plus the QA recipe, which only the human runs. Every recipe passes the
scratch directory as `--workdir <dir>`, so no package source names it. Every command also
takes `--description <path>`; `level-pipeline` names the default, the committed file.

- `kinds` prints each prop kind and, one per line, its parameters with their ranges,
  forms or choices and their defaults. It reads no description.
- `validate` builds in memory and prints the report of the level format, or the errors
  of a blocked build. Neither command writes a file.
- `build` runs `validate` and writes `<workdir>/level/<name>.glb` and `<name>.json` only
  when the validator accepts.
- `snapshot` builds without judging, so a rejected level can still be seen. It writes
  `plan.png`, `section.png` and `view.png` to `<workdir>/snapshots/`, and `custom.png`,
  one perspective sheet, when `--eye <x,y,z>` and `--look-at <x,y,z>` name a view.

A command that writes needs `--workdir` and announces each file on standard error as
`wrote <absolute path>`; usage and file errors go there too. Standard output carries data
and reports. Exit status 0 means accepted or done; 2 a blocked build or a rejected level,
with nothing written; 3 a usage error or a file that cannot be read or written; 1 a
defect or a broken sibling install, which ends with Bun's error and its stack.

## The QA app

### Server

`qa-server` binds `127.0.0.1` only, on port 4327 unless `--port` names another. A taken
port is a start error; the server never moves to another port. At start it does five
things in order:

1. It opens the run log, before anything can fail.
2. It checks that sec-111 and destruction-poc have their installs and records the
   resolved sibling paths in the start facts. A missing install is a logged start
   failure that names the sibling and the fix.
3. It imports the pipeline dynamically, reads the committed description and the base
   stage, then builds and validates.
4. It bundles the client page once.
5. It serves its routes.

The routes are few:

- `GET /`: the page, with its script and style;
- `GET /level/<file>`: the level pair and the two files of the prepared static level;
- `GET /api/session`: the run name, the log and marks paths, the level name, the
  description hash, the build outcome and the validator's verdict;
- `POST /api/log`: a batch of page lines for the run log;
- `POST /api/mark`: one mark.

The server builds once. A description edit needs a restart, because QA judges one known
description: the heads-up display and every mark carry its hash. A blocked build does not
stop the server. The session facts carry the build errors, and the page shows them.
A rejected level is served with a visible verdict banner. `Host` must name loopback, and
`Origin` too when it is present. A body must be one JSON object. A log that cannot be
written never fails a request; the page says so once.

### Client

`qa-client` boots in a fixed order: boot watch, session facts, WebGPU probe, level files,
`level-view`, walk world, input, frame loop. Each step logs its start and its outcome,
and the status strip names the step that is running. Every request has a 15 s timeout
that ends in `failed: no answer`.

The page keeps two regions that never collapse: a heads-up display and a status strip.
The page script sets both heights as inline styles, so no stylesheet can take them away.
The heads-up display shows the mode, eye and feet position, yaw and pitch, frame rate,
mark count, level name, description hash and validator verdict.

A click captures the mouse. `W`, `A`, `S` and `D` move, `Shift` sprints, `V` switches
between walk and fly, `F3` or `M` records a mark, and `Esc` releases the mouse. The boot
flag `?leak=1` swaps the near-black clear colour for a loud one, so an opening shows.

### Walk and fly

Walk mode moves sec-111's player capsule in sec-111's physics world at a fixed 60 Hz tick.
It starts at the player spawn. Walk speed, sprint speed and eye height are the game's
values. The capsule meets the prepared body world and every slab's blocker box, so the
human walks where the player will. The human cannot shoot: the validator proves
destructibility, and the QA app shows the intact level.

Fly mode moves the camera freely with no collision, at 8 m/s, or 24 m/s with `Shift`; `E`
rises and `Q` sinks. Switching back to walk stands the capsule on the floor under the
camera. When the camera is outside the interior, the page stays in fly and says why.

### F3 marks

1. `F3` freezes movement, releases the mouse and opens a comment box that shows the
   captured pose. The box takes at most 2,000 characters.
2. `Enter` sends the mark with the run name the page booted with; `Esc` cancels it. An
   empty comment is blocked with a message.
3. The server appends one line to `<workdir>/qa/marks.log` and answers with the mark
   number and the file path. It refuses a mark of another run and a longer comment.
4. The status strip shows exactly one outcome: saved with number and path, cancelled, or
   failed with the reason. A mark of another run fails with `reload the page`. After a
   failure the box stays open with the comment kept.

The marks file is JSON Lines, one mark per line, appended across runs, so an agent
parses it without a grammar. Each line holds:

- `time`: local time with UTC offset, ISO 8601 with milliseconds;
- `run`: the name of the run log, and `mark`: the number within the run;
- `level` and `description`: the level name and the description hash, so a stale mark
  is recognisable;
- `mode`, `eye` and `feet`: `walk` or `fly`, and positions in scaled metres; `feet` is
  null in fly mode;
- `yaw` and `pitch` in degrees; yaw 0 looks along +Z and grows toward +X;
- `comment`: one line of text.

### Run log

Each server run writes `<workdir>/qa/logs/qa-<local start time>.log`. It covers the whole
lifecycle: start facts with the resolved sibling paths, the build and its verdict, every
request, every page line and how the run ended. One event takes one line: time, `server`
or `page`, level, text. Line terminators inside a text are folded, so no text can forge a
line. Lines are written synchronously, so an abrupt end loses none.

Page lines carry the page's clock and arrive in batches. The page flushes its batch
before each boot step and on every error, so a stalled step is on file. The lines record
the user agent, window size, the WebGPU adapter, every boot step, every mode switch,
every mark from start to outcome, every status message, every `console.error` and
`console.warn`, and every uncaught error with its stack. A boot watch inside the page
reports a script that fails to load or to start.

### Visible failures

The app never fails silently: each blocking condition shows a message and logs a line.

- no WebGPU, or a renderer that fell back to WebGL: the page names the requirement;
- a blocked build: the page lists each build error with its path;
- a level file that fails to load or decode: the page names the file and the reason;
- a request without an answer: the step or the mark fails with `no answer`;
- a renderer or shader start failure: the page shows the error text;
- a lost GPU device or a GPU error after start: the page shows it and stops drawing;
- a physics start failure: walk is disabled, fly stays, and the page says so;
- a refused mouse capture: the page says to click again;
- a mark that is not saved: the comment box stays open with the reason;
- a run log that cannot be written, or any uncaught error: one banner or status line.

### Game values copied under the drift test

`GAME_VALUES` holds every game-owned value the QA app copies. The drift guard loads
sec-111's `engine/view/src/look/look.ts` and `games/arena-sim/src/tuning/tuning.ts` by a
computed path at run time, so their types never enter this repository's programs. It
fails when a value differs:

- the camera lens: field of view 92 degrees, near 0.05 m, far 160 m;
- the post configuration: `arenaLook` at scale 1, over which `level-view` writes the
  level's haze and exposure;
- the player's walk speed 3.5 m/s, sprint speed 5.5 m/s, eye ratio 0.92, pitch limit and
  the 60 Hz tick.

Four values are private constants that no import reaches: the pixel-ratio cap 1.5, the
12 signature slots, the 1/15 s frame clamp and the two warm-up frames. The guard finds
each by name in sec-111's source text and compares its value, so a changed or renamed
constant fails the test. The walk values are copied, not re-exported: arena-sim's facade
imports siblings that only sec-111's own link map resolves. `PLAYER_BODY` is live.

## Snapshots

`snapshot-render` draws the level GLB as stored, without a browser or a GPU. Dressing shows
its vertex colours and seals their colour. The base stage shows flat greys: the renderer
reads no texture. Emissive materials show their emissive colour. One light at the upper
left of each tile shades every surface; outlines mark depth steps and cuts. The background
is a loud colour, so an opening shows on every tile but a cross section. `level-cli` passes
every input: the interior, floors and spawns from the prepared static level, each prop's
plan point, the lens and the eye ratio from `GAME_VALUES`, the figure height from
`PLAYER_BODY`, their product as the eye height, and the hang height from `level-rules`.

- The plan sheet has two top-down tiles at 20 pixels per metre: the floor plan below
  5.9 m, under the gantry decks, and the overhead plan below 16.2 m, under the trusses.
  Both carry a 10 m coordinate grid, the spawns with their 6 m circles, and each prop's
  number in description order.
- The section sheet has two long elevations seen from the centre plane toward each side
  wall, and six cross sections toward the back wall, one every 20 m, each showing the 10 m
  behind its station, the first with the back wall. Lines mark each floor and the hang
  height, 2.17 m above it. The 3 m top of sec-111's static prisms has no line: it
  concerns static parts only, and dressing adds none.
- The view sheet has eight perspective tiles with the game's lens at eye height: the
  player spawn looking each way along the hall, each minion spawn looking at the player
  spawn, and two overviews from 12 m up at the hall's ends. A 1.87 m figure marks each spawn.

An agent can judge layout, spacing, alignment with the base structure, scale, silhouette
and what an eye-level view hides. An agent cannot judge lighting, shadow, haze, bloom,
exposure, glow, texture or material response. The human alone judges mood.

## Test strategy

The whole root gate stays fast. A preparation costs about 3 s, so the gate runs at most
three, all in `level-pipeline`, where the builds of one test file share one prepared static
level. Every other test uses sec-111's committed prepared level through the gateway's
testing entry, or a small hand-built box room. The integrator measures the test recipe at
every milestone; a gate above 30 s is a blocker. Tests remove every file they create.

Gateways own wiring and drift, nothing else:

- `sec111-gateway`: the wiring test asserts relations only: the capsule stops before an
  installed panel and walks on after its removal. The drift guard compares `GAME_VALUES`
  with sec-111. The bundle test finds one Rapier copy in the main entry's page bundle.
- `destruction-gateway`: the tests use every runtime name through the typed entry: one
  model is meshed, cast at, cut and synced into Rapier.
- `render-gateway`: the installed copy equals its sibling original and holds no hard
  link; the root three.js override equals the library's pin.

Library components:

- `level-format`: every rejection through the parser, with its path; caps at and beyond
  their limits; encode and decode return the same rounded level.
- `level-glb`: the real base stage in, node tree and triangle count out; every sentence
  of the contract asserted on the file it writes. The real reader judges a whole file
  in `level-pipeline`.
- `slab-model`: triangle counts equal destruction lib's measured counts; every face of
  a slab carries the slab's colour or its tint; a rotated slab's mesh stays in its box.
- `prop-kit`: per kind, at every parameter corner: no overlapping slabs, caps held,
  documented slab counts, panel faces outward.
- `level-rules`: each rule at its limit on a box room; the lane rule on the real hall;
  the proof on a seeded sample of slabs. One guard walks sec-111's capsule against the
  three behaviours the limits rest on: the gap, the climb and the headroom.
- `level-view`: the mapping rules as scene facts under Bun: light types, positions,
  shadow volume and look values. No pixel is asserted.

Tools and the QA app:

- `level-pipeline`: the real-data home for builds. A small fixture builds, round-trips
  and passes today's `prepareLevel` as a whole file; the committed level is accepted.
- `snapshot-render`: known boxes land on known pixels in each projection; coverage is
  compared with a tolerance, never bytes.
- `level-cli`: each command through its `run` entry with captured streams; exit statuses.
- `qa-client`: the real page entry on a hand-built document against a scripted fake of
  the protocol; every visible-failure message; the inline heights; the mark flow from
  key to outcome; walk on sec-111's committed prepared level.
- `qa-server`: the real handler and one real server on a temporary port, with an
  injected build; the real page against the real handler; the mark line; the run log's
  last lines. One test asserts one three.js core and one Rapier root in the page bundle.

## Accepted limits and risks

Accepted limits, each recorded in the knowledge documents by the integrator:

- SMG rounds do nothing on a slab's thin edges; a shot-through prop never collapses;
  settled debris does not rest on slabs; a destroyed object keeps its shadow.
- A damaged glowing slab loses its glow in the game while a point light beside it stays.
- A hollow prop wider than about 1 m can become a hiding spot once destroyed, because
  its footprint stays a navigation obstacle. Adoption fixes it.
- The QA app shows the GLB look of an intact slab. The game shows the same until the
  slab's first damage, then its own wall finish.
- The QA app blocks with one box per slab; the game splits the same box per chunk.
- The validator does not see a prop that penetrates or floats off the base stage. The
  sheets and the human's QA show it.
- Snapshots show no mood, and the QA frame rate overstates the game's.

The first pass cannot express props standing on props, stock lower than 0.5 m, racks,
strips under 0.5 m (a conveyor's glow under its deck edge is the lowest), round columns
and joints, glass, or single lit ceiling fixtures. These wait for the owner's feedback.

Risks, each with its owner:

- Navigation with dressing is first baked at adoption. Until then the gap and lane rules
  stand in, and the 1.5 m gap has no raster margin. Owner: `level-rules`, then adoption.
- The key's shadow volume and the look of bright strips are inferred from source. Owner:
  `level-view`; the human's QA settles them.
- The working trees of sec-111 and destruction-poc are live input, and both need their
  own install. A sibling change can break a build. Owner: the integrator.
- The linking is unproved on Linux. Owner: the integrator.
- Where the base stage file lives after adoption is the adoption task's decision. The
  level designer stays buildable after adoption, because in-game QA can send the level
  back for changes.
- A browser may keep `F3` for itself. Owner: `qa-client`; `M` records a mark too.
- The game's cost at 800 slabs is unmeasured. Owner: the adoption task.
