# Level designer

The level designer authors the dressed factory level of the sec-111 game: a `.glb`
file with meshes, materials and textures, and a `.json` file with the in-house
gameplay and lighting data. The game consumes only this level data, never the
designer's code.

## Current state

The repository holds the Bun workspace, its development pipeline, the art direction
references and fourteen components in four groups.

The gateways are the only bridges to the sibling repositories:

- [sec111-gateway](packages/sec111-gateway/README.md): the only bridge to sec-111: the
  prepared level contract, the physics world, the level preparation, the base stage
  reader and the game values a QA page must match;
- [destruction-gateway](packages/destruction-gateway/README.md): the only bridge to
  destruction lib: the slab model and mesher, and the proof tools;
- [render-gateway](packages/render-gateway/README.md): the only bridge to the
  rendering-poc library, the game's renderer.

The library components carry the level's data and judgement:

- [level-format](packages/level-format/README.md): the level description and the level
  `.json`: admission, the canonical text, the slab grid and the slab box;
- [level-glb](packages/level-glb/README.md): the GLB contract: scene assembly, inspection
  and world triangles;
- [slab-model](packages/slab-model/README.md): the only place where a slab becomes a
  destruction lib model: the shared builder and the intact mesh;
- [prop-kit](packages/prop-kit/README.md): the prop kinds: their parameter tables, their
  slab generators and the placement of a prop;
- [level-rules](packages/level-rules/README.md): the validator's checks: the judgement of
  a built level by every rule the build does not own, the destructibility proof included.

The QA app lets the human walk and fly through the level in a browser:

- [level-view](packages/level-view/README.md): draws a level pair through the game's
  renderer with the game's look and the level's lighting;
- [qa-client](packages/qa-client/README.md): the QA page: boot, walk in the game's
  collision, fly, marks, heads-up display and the protocol it shares with the server;
- [qa-server](tools/qa-server/README.md): the loopback server under Bun: it builds the
  committed description, serves the page and the level, and writes the run log and the
  marks file.

The tools run under Bun:

- [snapshot-render](tools/snapshot-render/README.md): the browser-free renderer of a
  level GLB into plan, section and perspective PNG sheets;
- [level-pipeline](tools/level-pipeline/README.md): the one build sequence: it reads the
  description and the base stage, builds a level or returns its build errors, and
  validates a built level into a report;
- [level-cli](tools/level-cli/README.md): the command-line tool: it lists the prop kinds,
  validates a description, builds the level pair and draws the snapshot sheets.

The committed level description, `levels/dark-factory.json`, is the authoring source of
truth. The level pair is a build product of it and is never committed.

The reference images live in `docs/art-direction/references/layout` (the factory
layout, the bridge and jib cranes, the floor stock) and
`docs/art-direction/references/mood` (the dark factory mood).

## Requirements

- [mise](https://mise.jdx.dev) and [just](https://just.systems) on Windows 11 x64,
  Ubuntu 24 or later on x64, or macOS on Apple Silicon.
- Git access to the shared command bundle, which `just setup` clones into
  `.claude/commands/cc-cmd-bevy`.
- The sibling repositories `../sec-111`, `../destruction-poc` and `../rendering-poc`.
  sec-111 and destruction-poc must be installed in their own working trees; the
  gateways run their sources on their installs.

## Develop

```sh
just setup        # toolchain, dependencies, sibling copy and declarations, command bundle
just test         # every test in the workspace
just lint         # formatting, types, lint, dead code, duplication, size and text checks
just fmt          # format in place
just ws-info      # workspace and component overview
just components   # line counts per component
```

Run `just setup` first, then `just test` and `just lint` as the gate. While several
agents share the tree, one root gate runs at a time under the gate lock that
[project knowledge](docs/KNOWLEDGE.md) describes. Rerun `just setup` after rendering-poc
changes; a drift test fails until the installed copy of its library is current.

The command-line tool builds and judges the level description:

```sh
just kinds        # prop kinds with their parameters, ranges and defaults
just validate     # build in memory, judge, print the report
just build        # validate, then write the pair to .tmp/level/
just snapshot     # plan, section and view sheets in .tmp/snapshots/
```

Each command reads `levels/dark-factory.json` unless `--description <path>` names
another file, such as the git-ignored draft `levels/dark-factory.draft.json`.
`snapshot` adds a custom view with `--eye=<x,y,z> --look-at=<x,y,z>`. The exit status
is 0 for accepted or done, 2 for a blocked build or a rejected level, 3 for a usage or
file error, and 1 for a defect or a broken sibling install.

## QA the level

The owner alone runs the QA app; agents never start the server or a browser.

```sh
just setup        # once, and again after a manifest change
just qa           # print the run log's path, build, then serve at the printed address
```

- Before the first setup, check out sec-111, destruction-poc and rendering-poc beside
  this repository, and run `just setup` inside sec-111 and inside destruction-poc.
- The QA recipe prints the run log's path as soon as the log opens, builds
  `levels/dark-factory.json` once, then prints the address `http://127.0.0.1:4327/` once
  the server listens. A description edit needs a restart. Add `--port <n>` to the recipe
  to serve on another port; a taken port stops the server.
- Open the printed address in Chrome with hardware acceleration; the page needs WebGPU.
- Move: click to capture the mouse; `W`, `A`, `S`, `D` move and `Shift` sprints; `V`
  switches walk and fly; `E` and `Q` rise and sink in fly; `Esc` releases the mouse.
- Mark: go to a problem, press `F3` (or `M`), type a comment and press `Enter`. The
  status strip shows the mark number and the file; `Esc` cancels.
- Stop the server with Ctrl+C. A stop during the start says that it waits for the
  running step. The exit status is 0 after a stop, 1 for a start failure and 3 for a
  usage error.
- Send back two files: `.tmp/qa/marks.log` and the run log
  `.tmp/qa/logs/qa-<start time>.log`.

Judge what agents cannot see:

- the mood against the references, the shadows, the haze and the glow;
- the seals, with `?leak=1` added to the address: no loud magenta shows at the end wall,
  the window and door panels, the back slot, above either side wall or, from fly height,
  down into a pier;
- the play space: spawn areas, main lanes, gaps, and collision against each prop kind.

When the app fails, the run log explains why. It opens before the sibling check and the
build, and records the start facts, the build, every request, every page step and how
the run ended. Only a run log that cannot be opened prints on the terminal alone.
The browser's own console messages never reach the run log. When the view looks wrong
and the page shows no message, copy the text of the browser's console into a mark, or
send it with the two files.

Read [project knowledge](docs/KNOWLEDGE.md) next.
