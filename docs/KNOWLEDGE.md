# Level designer knowledge

## The mental model

The level designer dresses the factory stage of the sec-111 game and writes the
result as a level pair: a `.glb` file for meshes, materials and textures, and a
`.json` file for the in-house gameplay and lighting data. sec-111 consumes the
level pair; it never imports the designer's code.

## Workspace

This is a Bun workspace run through `just`. Its components are the workspace
packages under `packages/` and `tools/`.

- `packages/*` holds the library components. Their source is browser-safe: it
  uses no Bun or Node modules and no Bun or Node globals. The exceptions are the
  stage and testing entries of `sec111-gateway`, which read sec-111's files
  under Bun. The browser-safe type check and oxlint rules exempt them, and the
  tool-source type check covers them.
- `tools/*` holds the components that run under Bun and may use Bun and Node
  modules.

`mise.toml` pins the toolchain (Node, Bun, Biome, jscpd, tokei, coreutils).
`package.json` and `bun.lock` pin the Node-ecosystem lint tools (TypeScript,
oxlint, oxlint-tsgolint, knip), so oxlint finds tsgolint in `node_modules` and
the three bump in lockstep. Bun installs packages in isolated mode, so a package
reaches only the dependencies its own manifest declares.

Each package exposes its public entries through its manifest, normally one, the
package facade. Two gateways are deliberate exceptions: sec111-gateway has three
entries, and destruction-gateway routes its one entry to a type half and a
runtime half; their knowledge documents give the reasons. Units inside a
package meet through their own facades. A generated, git-ignored `synopsis.xml`
beside each facade summarizes the unit's API.

### Components

- [sec111-gateway](../packages/sec111-gateway/docs/KNOWLEDGE.md): the bridge to
  sec-111, with a browser-safe main entry and Bun-side stage and testing entries.
- [destruction-gateway](../packages/destruction-gateway/docs/KNOWLEDGE.md): the
  bridge to destruction lib, for Bun-side meshing and the destructibility proof.
- [render-gateway](../packages/render-gateway/docs/KNOWLEDGE.md): the bridge to
  the rendering-poc library.
- [level-format](../packages/level-format/docs/KNOWLEDGE.md): the level
  description and the level `.json`. It admits a description, encodes and
  decodes the level `.json`, rounds a slab to the format's grid and reads a
  slab as an oriented box.
- [level-glb](../packages/level-glb/docs/KNOWLEDGE.md): the GLB contract. It
  assembles the static scene and the level scene, inspects a GLB and returns
  world triangles. Its tests read the base stage through sec111-gateway's stage
  entry, a test-only dependency.
- [slab-model](../packages/slab-model/docs/KNOWLEDGE.md): the only place where a
  slab becomes a destruction lib model. It runs under Bun only.
- [prop-kit](../packages/prop-kit/docs/KNOWLEDGE.md): the prop kinds. It expands a
  prop into slabs by its kind's parameter table and places them.
- [snapshot-render](../tools/snapshot-render/docs/KNOWLEDGE.md): the CPU renderer
  of a level GLB into PNG sheets, in `tools/`.

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
  every browser-safe package entry that does not reach destruction lib, then
  oxlint with the browser-safe rules;
- the type check of the tool sources and the Bun-side gateway entries, with
  isolated declarations;
- the check that `packages/` and `tools/` never name `.tmp/`;
- oxlint with type-aware rules, knip, jscpd and tsane;
- the tokex size, markdown and Unicode checks.

A type check whose project matches no source file passes and says so; any
other compiler error fails the gate.

For fast iteration, run the underlying tools on one package:

```sh
mise exec -- bun test ./packages/<name>
mise exec -- biome format packages/<name>
mise exec -- bun x --no-install oxlint packages/<name>
```

The docs checks in `just lint` are easy to trip: a list holds at most ten
items and about 200 words, text is ASCII only, and no file reaches 500 lines.

## File locations

- `docs/art-direction/references/` holds the layout and mood reference images.
  They stay byte-identical; nothing in the pipeline rewrites them.
- `.tmp/` is the git-ignored scratch directory for generated output and logs.
- `packages/destruction-gateway/generated/` holds the git-ignored destruction
  lib declarations.
- `.claude/commands/cc-cmd-bevy/` is the git-ignored shared command bundle. It
  supplies the adoctool, tokex and tsane binaries that the recipes run.

## Hosts

Windows 11 x64, Ubuntu 24 or later on x64, and macOS on Apple Silicon are the
supported development hosts. Git keeps LF line endings on every host and treats
`.glb` and image files as binary.
