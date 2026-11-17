# Level designer architecture

The level designer turns one committed level description into the level pair that sec-111
plays: a `.glb` with the sealed and dressed factory, and a `.json` with the destructible
props and the lighting. Fourteen components carry that flow; three are the only bridges
to the sibling repositories. The [level format](level-format.md) defines the description,
the pair and the validator's rules. The [build plan](build-plan.md) orders the work.

## Data flow

The authoring source of truth is the committed description, `levels/dark-factory.json`.
The level pair is a deterministic build product that nobody edits or commits.

One build runs six steps in order:

1. `level-format` admits the description text once and returns a typed description.
2. `level-glb` assembles the static scene: the base stage under a root scaled by the
   description's `base.scale`, the base material overrides and the seal boxes.
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

`level-cli`, `qa-server` and the tests call this one pipeline, so they agree on each build.

Preparation sees static geometry only: the base stage and the seals. sec-111 keeps
deriving interior, floors, collision, spawns and navigation. The level designer reads
those facts from the prepared static level and stores none of them.

## Components

A component is one workspace package named `@level-designer/<name>`. Components whose
source is browser-safe live in `packages/`. Components that use Bun live in `tools/`: the
command-line tool, the QA server and the two libraries that only they consume. Every
component below names its consumers. `destruction-gateway`, `slab-model` and
`level-rules` run under Bun only, and no page imports them: a page with both sec-111's
physics and destruction lib's debris backend would bundle two copies of Rapier.

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

Two more entries run under Bun only. The stage entry, for `level-pipeline`, re-exports
`prepareLevel` from `@sec111/level-prep` and adds `readBaseStage`, the one reader of the
base stage file, at the path sec-111 names. The testing entry, for tests only, re-exports
`readCommittedLevel` and `readCommittedFiles` from `@sec111/level-data/testing`:
sec-111's committed prepared level of the base stage, typed and as its two files. Both
use Node file access and are checked with the tool sources. The main entry serves
`level-rules`, `level-pipeline`, `level-view`, `qa-client` and `level-cli`.

**`destruction-gateway`** (`packages/`) has one entry in two halves. The runtime half
re-exports from destruction lib's sources by relative path and runs on destruction-poc's
install. The type half re-exports the same names from declarations that an emit script
generates with destruction-poc's own compiler settings, in the setup and lint recipes:
destruction lib's sources cannot enter a NodeNext program. The entry re-exports:

- from core: `WallModel`, `createChunkGeometry`, `snapshotRetainedCuboids`,
  `createDamageBudget` and the types `MaterialId` and `MeshData`;
- from collision: `CollisionScene`, `createPointContact`, `toWorldPoint`,
  `toLocalPoint`, `rotateVector` and the type `RigidTransform`;
- from physics: `RapierBackend`.

Consumers: `slab-model` and `level-rules`. Its tests use every runtime name through the
typed entry, and a separate type check proves that the type half resolves completely.

**`render-gateway`** (`packages/`, browser-safe) depends on the rendering-poc library
through a `file:` path, the only mechanism that gives a page one copy of three.js. The
setup recipe detaches the installed copy from the sibling files, and a root override
pins three.js. It re-exports `createRenderer`, `attachWindowResize`, `NoGraphicsError`,
`createPostUniforms`, `PostPipeline`, `resolveRenderQuality`, `PerfStats` and the types
`RendererContext`, `PostConfig` and `PostUniforms`. Consumer: `level-view`. Its drift
guards assert that the installed copy equals the sibling original, that no installed
file is still a hard link, and that the root override equals the library's pin.

### Formats and geometry

**`level-format`** (`packages/`, no dependency) owns the two persisted shapes. It admits a
description as a typed value or a list of problems with their paths, and it encodes and
decodes a level as canonical `.json` text. One slab admission holds the format caps for
decode and for the build, and one rounding puts a slab on the grid. The lighting section
has one type and one admission for both shapes. It also reads a slab as an oriented box
with eight corners, and `formatLength` prints every length of a message or a report.
Consumers: `level-pipeline` (parse, rounding, admission, encode, `MAX_POINT_LIGHTS`),
`prop-kit` (rounding, admission, colour form, message rules), `level-rules` (boxes,
`LENGTH_SLACK`), `level-cli`, `qa-client` (decode, boxes) and `level-view` (lighting).

**`level-glb`** (`packages/`, no dependency) owns the GLB contract. It reads a GLB
container, assembles the static scene and the level scene, and writes one-buffer GLB
bytes. Its inspection returns three facts: the triangle count, the primitives without a
material and the image count. A reader returns world-space triangles with their material
colours. Consumers: `level-pipeline` (assembly, inspection), `level-rules` (the
inspection facts as a type) and `snapshot-render` (triangles).

**`slab-model`** (`packages/`; depends on `destruction-gateway` and `level-format`) is
the only place where a slab becomes a destruction lib object. One shared builder
constructs the `WallModel` of a slab, with the inner colour set to the slab's colour.
From the model the component derives the intact indexed mesh in world space. Consumers:
`level-pipeline` (meshes) and `level-rules` (the model).

**`prop-kit`** (`packages/`; depends on `level-format`) owns the prop kinds. Each kind has
a parameter table and a generator that returns slabs in the prop's own frame: upright,
lying or pitched about local X. The kind tables own every secondary dimension. The kit
places a prop by its plan position, its yaw and the floor height it is given, splits
long runs to the slab caps, turns each panel's +Z face outward and tags glowing slabs.
Consumers: `level-pipeline` (expansion) and `level-cli` (the kind listing).

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
server of the QA app. It owns its arguments, the run log, the marks file, the page
bundle and the routes. Its tests also read `sec111-gateway`'s testing entry and encode a
level with `level-format`. Consumer: the human, through the QA recipe.

### Browser components

**`level-view`** (`packages/`; depends on `render-gateway`, `level-format`,
`sec111-gateway` and three.js at the library's version, with its types for development)
draws a level pair through the game's pipeline. Its start takes the canvas, the GLB
bytes, the lighting section, the interior box, the clear colour choice and a failure
callback, and resolves to a result of kind started, refused or failed; it never rejects
for an expected failure. It loads the GLB, applies the mesh and mapping rules, and runs
the post pipeline with the game's look. It starts on WebGPU only and refuses a WebGL
fallback with its own typed error. It compiles against the complete light set and renders
the warm-up frames before it shows the level. Its frame call takes the eye position, the
yaw, the pitch and the caller's clock in seconds, so no consumer needs three.js. It gives
one read-only frame rate, the rendering library's own counter, and reports the renderer's
device-lost and error hooks through the failure callback. Consumer: `qa-client`.

**`qa-client`** (`packages/`; depends on `level-view`, `level-format` and
`sec111-gateway`) is the QA page: boot, input, walk, fly, marks, heads-up display and the
page side of the run log. It also owns the JSON protocol it shares with `qa-server`,
its only consumer. It imports no destruction lib.

### Dependency order

The workspace graph is acyclic and points down:

- the gateways, `level-format` and `level-glb` depend on no workspace package;
- `slab-model`, `prop-kit` and `snapshot-render` depend only on that layer;
- `level-rules` depends on the two layers below it, and `level-view` on the first;
- `level-pipeline` adds `level-rules`, and `qa-client` adds `level-view`;
- `level-cli` and `qa-server` sit on `level-pipeline`; `level-cli` also reads the lower
  libraries its paragraph names, and `qa-server` depends on `qa-client`.

## Collision the game owns

The QA app walks the game's collision. The prepared static level becomes sec-111's physics
world. Every slab then enters that world through the blocker sink the game's walls engine
uses. The page installs one blocker box per slab, built from the slab's `size`,
`position` and `rotation` in the level `.json`, and steps the world once, because a
blocker blocks from the next step on. The game splits the same box into one set per
chunk; an intact slab's chunks tile its box exactly, so only the seams differ.

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
`prepareLevel` returns scale 1 and the unchanged interior, floors and spawns. The 13
seal boxes add one body box and move each +z minion spawn by one 0.25 m grid step.
Today's reader also admits a destructible node with `extras`. The tests of
`level-pipeline` repeat the scale and the admission.

## Command-line tools and recipes

`level-cli` has four commands. The integrator adds one root recipe per command, under the
command's name, plus the QA recipe, which only the human runs. Every recipe passes the
scratch directory as `--workdir <dir>`, so no package source names it. Every command also
takes `--description <path>`; `level-pipeline` names the default, the committed file.

- `kinds` prints each prop kind with its parameters, ranges and defaults; it reads no file.
- `validate` builds in memory and prints the report of the level format, or the errors
  of a blocked build. Neither command writes a file.
- `build` runs `validate` and writes `<workdir>/level/<name>.glb` and `.json` if accepted.
- `snapshot` builds without judging, so a rejected level can still be seen. It writes
  the three sheets to `<workdir>/snapshots/`, and `custom.png` when `--eye <x,y,z>` and
  `--look-at <x,y,z>` name a view.

A command that writes needs `--workdir` and announces each file on standard error, where
usage and file errors go too; standard output carries data and reports. Exit status 0
means accepted or done; 2 a blocked build or a rejected level, with nothing written; 3 a
usage error or a file that cannot be read or written; 1 a defect or a broken sibling
install, which ends with Bun's error and its stack.

## The QA app

### Server

`qa-server` binds `127.0.0.1` only, on port 4327 unless `--port` names another; port 0
takes any free port, for the tests. Its `run` entry takes the arguments, the output
streams, a clock, a stop signal and a loader of the pipeline: the program file `main.ts`
passes a dynamic import of `level-pipeline`, and tests inject a build. The QA recipe
passes `--workdir <dir>` and one `--sibling <dir>` for each of sec-111 and
destruction-poc, so no source names a sibling. At start it does five things in order:

1. It opens the run log and prints its path.
2. It records each sibling's resolved path in the start facts and checks that the
   sibling holds its own install, a `node_modules` directory.
3. It loads the pipeline, reads the committed description and the base stage, then
   builds and validates.
4. It bundles the two page scripts of `qa-client` once, each on its own.
5. It binds the port, then prints the address.

A step that fails is a start failure: the server logs the reason with the error's
stack, prints the reason and the log's path on standard error and exits with status 1.
A missing install names the sibling and its fix, the sibling's own setup. An unreadable
description names the file, and a taken port names the port: the server never moves to
another. Only a run log that cannot be opened prints on the terminal alone. A usage
error exits with status 3, as in `level-cli`. The stop signal writes the last line and
prints it; during the start it first prints that it waits for the running step.

The routes are few:

- `GET /`: the page document; its style and its two scripts answer beside it;
- `GET /level/<file>`: the level pair and both prepared files, under the protocol's names;
- `GET /api/session`: the session facts;
- `POST /api/log`: a batch of page lines for the run log;
- `POST /api/mark`: one mark.

The session facts hold the run name, the paths of the run log and the marks file, and
the build outcome. A built level gives its name, its description hash and its verdict:
accepted, or rejected with the number of findings. A blocked build gives its build
errors alone. It has no name and no hash: both are facts of a built level, and their
consumers, the heads-up display and the marks, exist only with a level.

The server builds once. A description edit needs a restart, because QA judges one known
description. Neither a blocked build nor a rejected level stops the server: the page
lists the build errors, or shows the level under a verdict banner, and the run log holds
each error or finding on its own line. `Host` must name loopback, and `Origin` too when
it is present. A request body is one JSON object that names its run, and the server
refuses another run's. Every API answer is one JSON object that says whether the run log
could be written, and a refusal carries its reason. An unwritten log fails no request.

### Client

`qa-client` has four entries. The facade holds `bootPage`, the page entry, the boot
watch's entry and the surroundings. The protocol entry holds the protocol unit alone,
with no dependency, and is all the server's production code imports: the facade loads
sec-111's physics under Bun, and the run log opens before any sibling loads. The protocol
unit owns the routes, the level file names, the shapes of the session facts, a log batch,
a mark and their answers, and the line terminators that the comment rule and the run
log's fold both read. `bootPage` takes its surroundings as one value: the document, the
window's events, clock and timers, `fetch`, the GPU probe, and the view and physics
starters, whose failures no data can produce. The page files are a document, a style and
two scripts: the boot watch and the page program, which passes the real surroundings and
`level-view`. The testing entry serves tests only: the hand-built document and the
scripted view on which the tests of `qa-client` and `qa-server` boot the page.

The page boots in a fixed order: session facts, WebGPU probe, level files, `level-view`,
walk world, input, frame loop. Each step logs its start and its outcome, and the status
strip names the step that is running, so a stalled step shows. A blocked build ends the
boot after the session facts. Every request has a 15 s timeout that ends in
`failed: no answer`. The boot watch is bundled apart, so it runs without the page
program: when that program fails to load, or has not started within 10 s, the watch
writes the reason into the document and posts it to the run log under the session's run.

The page keeps two regions that never collapse and never clip: a heads-up display and a
status strip. The page script sets an inline minimum height on each, so no stylesheet can
take it away and a region grows with its text. The heads-up display shows the mode, eye
and feet position, yaw and pitch, the frame rate of `level-view`, mark count, level name,
description hash, validator verdict and the leak colour when it is selected.

A click captures the mouse. `W`, `A`, `S` and `D` move, `Shift` sprints, `V` switches
between walk and fly, `F3` or `M` records a mark, and `Esc` releases the mouse. The boot
flag `?leak=1` swaps the near-black clear colour for a loud one, so an opening shows.

### Walk and fly

Walk mode moves sec-111's player capsule in its physics world at a fixed 60 Hz tick. It
starts at the player spawn, facing the game's start direction, toward the back wall;
`GAME_VALUES` holds that direction. Its speeds and eye height are the game's values. The
capsule meets the prepared body world and every slab's blocker box, so the human walks
where the player will. The human cannot shoot: the validator proves destructibility.

Fly mode moves the camera freely with no collision, at 8 m/s, or 24 m/s with `Shift`; `E`
rises and `Q` sinks. Switching back to walk drops the capsule from the camera onto the
floor or the top below, where it can stand free. Outside the interior, within the
capsule's radius of its sides, or inside a body, the page stays in fly and says why.

### F3 marks

1. `F3` freezes movement, releases the mouse and opens a comment box that shows the
   captured pose. The box takes at most 2,000 characters.
2. `Enter` sends the run name, the pose and the comment; the status strip shows
   `saving mark` until the answer. `Esc` cancels. A message blocks an empty comment.
3. The server adds the time, the mark number, the level name and the description hash,
   appends one line to `<workdir>/qa/marks.log` and answers with the number and the file
   path. It refuses a mark of another run, a longer comment and a malformed pose.
4. The status strip shows exactly one outcome: saved with number and path, blocked,
   cancelled, or failed with the reason. A block or a failure keeps the box and its text.

The marks file is JSON Lines, one mark per line, appended across runs, so an agent
parses it without a grammar. Each line holds:

- `time`: local time with UTC offset, ISO 8601 with milliseconds;
- `run`: the name of the run log, and `mark`: the number within the run;
- `level` and `description`: the level name and the description hash, against stale marks;
- `mode`, `eye`, `feet`: `walk` or `fly`; positions in scaled metres, `feet` null in fly;
- `yaw`, `pitch`: degrees; yaw 0 looks along +Z, grows toward +X and lies in (-180, 180];
- `comment`: one line of text.

### Run log

Each server run writes `<workdir>/qa/logs/qa-<local start time>.log`. It covers the whole
lifecycle: start facts with the resolved sibling paths, the build and its verdict, every
request, every page line and how the run ended. One event takes one line: time, `server`
or `page`, level, text. Line terminators inside a text are folded, so no text can forge a
line. Lines are written synchronously, so an abrupt end loses none.

Page lines carry the page's clock and arrive in batches. The page flushes its batch
before each boot step, on every error, after each mark outcome and every 5 s while it
runs, so a stalled step is on file. The lines record the user agent, window size, WebGPU
adapter, every boot step, mode switch and status message, every mark from start to
outcome, every `console.error` and `console.warn`, and each uncaught error with its stack.

### Visible failures

The app never fails silently. A server start failure shows on the terminal and in the run
log. Each condition below shows a page message and sends it in a log batch. A failed
session step shows its message alone, which says so: the page knows no run yet. At boot:

- the page program fails to load or to start: the boot watch says so;
- a request without an answer: the step or the mark fails with `no answer`;
- a blocked build: the page lists each build error with its rule and path;
- no WebGPU, or a renderer that fell back to WebGL: the page names the requirement;
- a level file that fails to load or decode: the page names the file and the reason;
- a renderer or shader start failure: the page shows the error text;
- a physics start failure: walk is disabled, fly stays, and the page says so.

While the page runs:

- a rejected level: the verdict banner stays in view;
- a lost GPU device or a GPU error: the page shows it and stops drawing;
- a refused mouse capture: the page says to click again;
- a switch to walk where no capsule can stand free: the page stays in fly and says why;
- a mark that is not saved: the comment box stays open with the reason;
- a page left open across a restart: its mark or log batch fails with `reload the page`,
  also on a blocked build, and the page stops posting and keeps one banner line;
- a console error: one banner says that programs may have failed and props may be
  missing, and names the run log;
- a run log that cannot be written, or any uncaught error or rejection: one banner.

### Game values copied under the drift test

`GAME_VALUES` holds every game-owned value the QA app copies. The drift guard loads
sec-111's `engine/view/src/look/look.ts` and `games/arena-sim/src/tuning/tuning.ts` by a
computed path, so their types stay out of this repository. It fails on a difference:

- the camera lens: field of view 92 degrees, near 0.05 m, far 160 m;
- the post configuration `arenaLook(1)`, whose haze and exposure the level overwrites;
- the player: walk 3.5 m/s, sprint 5.5 m/s, eye ratio 0.92, pitch limit; the 60 Hz tick.

Six values are private constants that no import reaches: the pixel-ratio cap 1.5, the 12
signature slots, the 1/15 s frame clamp, the two warm-up frames, the clear colour and the
player's start look. The guard finds each by name in sec-111's source text and compares
its value, or for the start look its relation to the copied start direction, so a change
or a new name fails the test. The walk values are copied, not re-exported: arena-sim's
facade imports siblings that only sec-111's link map resolves. `PLAYER_BODY` is live.

## Snapshots

`snapshot-render` draws the level GLB as stored, without a browser or a GPU: flat colours
under one fixed light, on a loud background, so an opening shows. `level-cli` passes
every input: the interior, floors and spawns from the prepared static level, each prop's
plan point, the lens and the eye ratio from `GAME_VALUES`, the figure height from
`PLAYER_BODY`, their product as the eye height, and the hang height from `level-rules`.
The plan sheet holds the floor plan below 5.9 m and the overhead plan below 16.2 m, with
a 10 m grid, the spawns with their 6 m circles and each prop's number. The section sheet
holds two long elevations and six cross sections, with lines at each floor and at the
hang height. The view sheet holds eight perspective tiles with the game's lens at eye
height: one or two from each spawn, and two overviews from 12 m up.

An agent can judge layout, spacing, alignment with the base structure, scale, silhouette
and what an eye-level view hides. An agent cannot judge lighting, shadow, haze, bloom,
exposure, glow, texture or material response. The human alone judges mood.

## Test strategy

The whole root gate stays fast. A preparation costs about 3 s, so the gate runs at most
three, all in `level-pipeline`, where the builds of one test file share one prepared static
level. Every other test uses sec-111's committed prepared level through the gateway's
testing entry, or a small hand-built box room. The integrator measures the test recipe at
every milestone; a gate above 30 s is a blocker. Tests remove every file they create.

The built components keep the tests their knowledge documents state. The gateways own
wiring and drift, nothing else. Each library proves its rules at their limits, and
`prop-kit` each kind at every parameter corner: no overlapping slabs, caps held,
documented slab counts, panel faces outward. `level-pipeline` is the real-data home for
builds, and `level-cli` runs each command through its `run` entry with captured streams.

The QA app:

- `level-view`: the mapping rules as scene facts under Bun: light types, positions,
  shadow volume and look values. No pixel is asserted.
- `qa-client`: the real page entry on the hand-built document against a scripted fake of
  the protocol; every visible-failure message; the inline minimum heights; the mark flow
  from key to outcome; walk on sec-111's committed prepared level.
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
- A switch to walk can land on a top the player cannot reach in the game, and is
  refused within about 0.65 m of the closed end of a narrow corridor.
- The browser's own console messages, such as WebGPU validation warnings, go unlogged.
- An arm's links hinge on one edge and leave an open wedge at each joint, and a crane's
  hook block hangs free, without a cable.
- Only the sheets and the human's QA show a prop that enters or floats off the base stage.
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
  level designer stays buildable then, because in-game QA can send the level back.
- A browser may keep `F3` for itself. Owner: `qa-client`; `M` records a mark too.
- The game's cost at 800 slabs is unmeasured. Owner: the adoption task.
