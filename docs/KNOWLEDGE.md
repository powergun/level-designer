# Level designer knowledge

## The mental model

The level designer dresses the factory stage of the sec-111 game and writes the
result as a level pair: a `.glb` file for meshes, materials and textures, and a
`.json` file for the in-house gameplay, lighting and finish data. sec-111 consumes the
level pair; it never imports the designer's code.

The pair holds two kinds of dressing. A prop is a destructible object for gameplay,
built from slabs: the `.json` lists its slabs, and the `.glb` holds their meshes. A
static object is one box that is only drawn, litter or an overhead object: the `.glb`
alone holds it, and nothing collides with it. The `.glb` names the slab that a litter
lies on, so that the game can hide the litter with that slab at its first damage. The
QA app shows no damage, so a litter stays on its prop there.

## Workspace

This is a Bun workspace run through `just`. Its components are the workspace
packages under `packages/` and `tools/`.

- `packages/*` holds the library components. Their source is browser-safe: it
  uses no Bun or Node modules and no Bun or Node globals. The exceptions are the
  stage and testing entries of `sec111-gateway`, which read sec-111's files
  under Bun. The browser-safe type check and oxlint rules exempt them, and the
  tool-source type check covers them. The two page scripts of `qa-client` sit in
  its `page/` directory beside `src/`, and the browser-safe checks cover them too.
- `tools/*` holds the components that run under Bun and may use Bun and Node
  modules.

`mise.toml` pins the toolchain (Node, Bun, Biome, jscpd, tokei, coreutils).
`package.json` and `bun.lock` pin the Node-ecosystem lint tools (TypeScript,
oxlint, oxlint-tsgolint, knip), so oxlint finds tsgolint in `node_modules` and
the three bump in lockstep. Bun installs packages in isolated mode, so a package
reaches only the dependencies its own manifest declares.

Each package exposes its public entries through its manifest, normally one, the
package facade. Three packages are deliberate exceptions: sec111-gateway has three
entries, destruction-gateway routes its one entry to a type half and a runtime
half, and qa-client has four entries, so the server reads the protocol and the
page files without loading sec-111's physics. Their knowledge documents give the
reasons. Units inside a package meet through their own facades. A generated,
git-ignored `synopsis.xml` beside each facade summarizes the unit's API.

### Components

The gateways bridge the sibling repositories:

- [sec111-gateway](../packages/sec111-gateway/docs/KNOWLEDGE.md): the bridge to
  sec-111, with a browser-safe main entry and Bun-side stage and testing entries.
- [destruction-gateway](../packages/destruction-gateway/docs/KNOWLEDGE.md): the
  bridge to destruction lib, for Bun-side meshing and the destructibility proof.
- [render-gateway](../packages/render-gateway/docs/KNOWLEDGE.md): the bridge to
  the rendering-poc library.

The library components in `packages/` carry the level's data and judgement. Three
hold its formats and its finishes:

- [level-format](../packages/level-format/docs/KNOWLEDGE.md): the level
  description and the level `.json`. It admits a description with its static
  objects and its painted seals, encodes and decodes the level `.json`, admits the
  finish table, rounds a slab to the format's grid and reads a slab or a static
  object as an oriented box.
- [finish-paint](../packages/finish-paint/docs/KNOWLEDGE.md): the finishes'
  arithmetic interface, layer kinds, painter, slab and hall frame rules and
  swatch, browser-safe. Its layer kinds and painter run on the number back end under Bun
  and on level-view's node back end.
- [level-glb](../packages/level-glb/docs/KNOWLEDGE.md): the GLB contract. It
  assembles the static scene and the level scene, with one painted box per static
  object and per painted seal and one material per finish path and glow, inspects
  a GLB and returns world triangles. Its tests read the base stage through
  sec111-gateway's stage entry, a test-only dependency.

Three turn props into slabs and judge the built level:

- [slab-model](../packages/slab-model/docs/KNOWLEDGE.md): the only place where a
  slab becomes a destruction lib model. It gives every vertex the slab's colour
  and its pattern data, and runs under Bun only.
- [prop-kit](../packages/prop-kit/docs/KNOWLEDGE.md): the prop kinds. It expands a
  prop into slabs by its kind's parameter table, names each slab's finish path and
  places them.
- [level-rules](../packages/level-rules/docs/KNOWLEDGE.md): the validator's
  checks. It judges a built level from its facts, the placed static objects among
  them, by every rule the build does not own, the destructibility proof included.
  Like slab-model, it reaches destruction lib and runs under Bun only.

The QA app lets the human walk and fly through the level in a browser:

- [level-view](../packages/level-view/docs/KNOWLEDGE.md): draws a level pair
  through the rendering-poc pipeline with the game's look, the level's lighting
  and one painter per finish path in use: a twin for a slab or a box, a stage
  wrap for a stage material whose hall finish holds a layer. It starts on WebGPU
  only and takes no input.
- [qa-client](../packages/qa-client/docs/KNOWLEDGE.md): the QA page: boot, walk,
  fly, marks, heads-up display, the console-error banner and the page side of the
  run log. It owns the
  protocol it shares with qa-server and imports no destruction lib.
- [qa-server](../tools/qa-server/docs/KNOWLEDGE.md): the loopback server, in
  `tools/`. It builds the committed description once through level-pipeline,
  bundles and serves the page, and writes the run log and the marks file.

The other tools in `tools/` run under Bun:

- [snapshot-render](../tools/snapshot-render/docs/KNOWLEDGE.md): the CPU renderer
  of a level GLB into PNG sheets, and of a finish path's swatch, a slab's or a hall
  finish's, into its page of the finish sheet.
- [level-pipeline](../tools/level-pipeline/docs/KNOWLEDGE.md): the one build
  sequence. It reads the description and the base stage, builds a level with its
  finish data, its painted seals and its static objects, which it alone places, or
  returns its build errors, and validates a built level into a report. It is the
  only test home that prepares a level.
- [level-cli](../tools/level-cli/docs/KNOWLEDGE.md): the command-line tool. It
  owns the argument parsing, the file writes under the work directory, the printed
  text and the exit statuses, and fills the finish pages' swatches: a slab's, a
  static object's, a painted seal's and a hall finish's.

## The sibling repositories

Each sibling has exactly one gateway, and no other component imports a sibling
or reads a sibling file. Each gateway links its sibling the cheapest way the
compiler settings allow:

- sec-111: relative re-exports from its package facades. Its sources run and
  type-check in place, on sec-111's own install.
- destruction lib: relative re-exports for the runtime, and declarations that
  `just setup` and `just lint` generate from the sibling with its own compiler
  settings for the types. Its sources run on destruction-poc's own install.
- rendering-poc: a `file:` dependency. Bun copies the library into this
  repository's store, `just setup` detaches the copy from the sibling files, and
  the root `three` override keeps one three.js copy.

The three siblings must sit beside this repository as `../sec-111`,
`../destruction-poc` and `../rendering-poc`. sec-111 and destruction-poc must
each be installed in its own working tree, by its own setup, before this
repository's gates run: their sources resolve Rapier, Recast and their internal
package links from their own `node_modules`. rendering-poc needs no install.
This repository never writes into a sibling.

sec-111's and destruction lib's working trees are live input: an uncommitted
change there reaches this repository's tests and builds at once. rendering-poc's
library reaches it at the next `just setup`.

## Gates

After a fresh clone or a manifest change, root `just setup` first checks that
`../sec-111` and `../destruction-poc` each have a `node_modules` install. A
missing install stops setup with a message that names the sibling and its fix:
run the sibling's own `just setup` in its directory. Setup then installs the
pinned toolchain and the locked dependencies, detaches the rendering library
copy, generates the destruction lib declarations and fetches the shared command
bundle. The gate for a code change is root `just test`, then root `just lint`;
for a document change it is root `just lint`. Both start by refreshing the
synopses.

While several agents share the tree, only one root gate (`just setup`,
`just test`, `just lint` or the synopsis refresh) runs at a time. Each run holds
the gate lock: a directory outside the repository that the team lead names for
the session. Creating it takes the lock and fails while another member holds it;
removing it when the gate ends, pass or fail, releases it.

`just lint` runs, in order and failing fast:

- the Biome format check;
- the destruction lib declarations, generated again, and their guard check;
- the type check of everything, tests included, with Bun types;
- the browser-safe package sources: their type check, a browser bundle of
  the entries that do not reach destruction lib (sec111-gateway, render-gateway,
  level-format, level-glb, prop-kit, finish-paint, level-view, and qa-client's
  facade and two page scripts), then oxlint with the browser-safe rules;
- the type check of the tool sources and the Bun-side gateway entries, with
  isolated declarations;
- the check that `packages/` and `tools/` never name `.tmp/`;
- oxlint with type-aware rules, knip, jscpd and tsane;
- the tokex size, markdown and Unicode checks.

A type check whose project matches no source file passes and says so; any
other compiler error fails the gate.

`just test` takes about 8 s, and a test recipe above 30 s is a blocker. One
level preparation by sec-111 costs about 3 s, so only level-pipeline's tests
prepare, three times in all: its build test prepares the fixture's static scene
and hands the fixture's level GLB to the preparation, and its committed test
builds `levels/dark-factory.json`. The build test's other builds reuse the
fixture's preparation, and its one further call is refused at sec-111's survey
within milliseconds. Every other test reads sec-111's committed prepared level
through the gateway's testing entry, uses a hand-built room or injects a
pipeline. The build test sets the recipe's length.

For fast iteration, run the underlying tools on one package:

```sh
mise exec -- bun test ./packages/<name>
mise exec -- biome format packages/<name>
mise exec -- bun x --no-install oxlint packages/<name>
```

The docs checks in `just lint` are easy to trip: a list holds at most ten
items and about 200 words, text is ASCII only, and no file reaches 500 lines.

## Tool recipes

The recipes `kinds`, `validate`, `build` and `snapshot` run level-cli's program file
with Bun from the repository root, one recipe per command. Each passes `.tmp` as the
work directory, so no package source names it, and passes every extra argument through.
Each recipe ends with the tool's exit status. On Windows the recipe line exits with the
tool's status explicitly, because `powershell -Command` reports every failure as 1.

The `qa` recipe runs qa-server's program file the same way. It passes `.tmp` as the
work directory and one `--sibling` each for `../sec-111` and `../destruction-poc`, so
no source names a sibling, passes every extra argument through, such as `--port <n>`,
and ends with the server's exit status. Only the human runs it: agents never start the
server or a browser, and the tests start their own servers on temporary ports.

## Authoring

The art team dresses the hall by editing the level description and running the four tool
recipes. The [authoring guide](AUTHORING-GUIDE.md) gives the hall in numbers, the rules of
props and static objects in the validator's words, the budgets, the finish table, the
accepted limits of the clearance rules and the authoring loop. The
[look and lighting](LOOK-AND-LIGHTING.md) document gives the mood, the stage's materials,
how the hall is lit, the display's black point, the bloom threshold, the tuning handles,
how to add an emergency wall light and the reference levels.

## File locations

- `docs/art-direction/references/` holds the layout and mood reference images.
  They stay byte-identical; nothing in the pipeline rewrites them.
- `levels/dark-factory.json` is the committed level description, the authoring
  source of truth. Git ignores the author's draft beside it,
  `levels/dark-factory.draft.json`.
- `.tmp/` is the git-ignored scratch directory for generated output and logs. The
  level pair lands in `.tmp/level/`, the sheets in `.tmp/snapshots/` and one page per
  finish path in use and per hall finish in `.tmp/snapshots/finish/`, which
  `snapshot` empties first. The QA
  app writes one run log per run to `.tmp/qa/logs/qa-<local start time>.log` and
  appends every mark to `.tmp/qa/marks.log`.
- `packages/destruction-gateway/generated/` holds the git-ignored destruction
  lib declarations.
- `.claude/commands/cc-cmd-bevy/` is the git-ignored shared command bundle. It
  supplies the adoctool, tokex and tsane binaries that the recipes run.

## Accepted limits

The owner accepts these limits of the first pass in the level and the game:

- SMG rounds do nothing on a slab's thin edges, a shot-through prop never
  collapses, settled debris does not rest on slabs, and a destroyed object keeps
  its shadow in a level that states a key.
- A damaged glowing slab loses its glow in the game, while a point light beside it
  stays.
- A hollow prop wider than about 1 m can become a hiding spot once destroyed,
  because its footprint stays a navigation obstacle. Adoption fixes it.
- An arm's links hinge on one edge and leave an open wedge at each joint, and a
  crane's hook block hangs free, without a cable.
- Only the sheets and the human's QA show a prop that enters or floats off the
  base stage.

The owner accepts these limits of the QA app and the snapshots:

- The QA app paints an intact slab by its finish. Until it adopts the finishes,
  the game shows the GLB's flat fallback, and after a slab's first damage its own
  wall finish.
- The QA app blocks with one box per slab; the game splits the same box per chunk.
- A switch from fly to walk drops the capsule from the camera onto whatever lies
  below, so the human can stand on tops the player cannot reach in the game.
- The switch is refused within about 0.65 m of the closed end of a narrow
  corridor; the page stays in fly and says why.
- The QA page logs only `console.error` and `console.warn` calls, and a console
  error raises one line of the alarm banner, beside the other alarm kinds, that says
  programs may have failed and props may be missing, and names the run log. The browser's own console messages, such as
  WebGPU validation warnings and failed resource loads, reach neither.
- Snapshots show no mood, and the QA frame rate overstates the game's.

The kit cannot express props standing on props, stock lower than 0.5 m, racks,
strips under 0.5 m, round columns and joints, glass, or single lit ceiling
fixtures. These wait for the owner's feedback. Litter, flat stock, wall lamps, signs and
pipe runs enter as static objects, which are only drawn: a litter is 0.15 m high or lower
and lies on the floor or on a prop's top, and the others are overhead objects; a lamp
carries a glow.

## Hosts

Windows 11 x64, Ubuntu 24 or later on x64, and macOS on Apple Silicon are the
supported development hosts. Git keeps LF line endings on every host and treats
`.glb` and image files as binary.
