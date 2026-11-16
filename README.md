# Level designer

The level designer authors the dressed factory level of the sec-111 game: a `.glb`
file with meshes, materials and textures, and a `.json` file with the in-house
gameplay and lighting data. The game consumes only this level data, never the
designer's code.

## Current state

The repository holds the Bun workspace, its development pipeline, the art direction
references and eight components:

- [sec111-gateway](packages/sec111-gateway/README.md): the only bridge to sec-111: the
  prepared level contract, the physics world, the level preparation, the base stage
  reader and the game values a QA page must match;
- [destruction-gateway](packages/destruction-gateway/README.md): the only bridge to
  destruction lib: the slab model and mesher, and the proof tools;
- [render-gateway](packages/render-gateway/README.md): the only bridge to the
  rendering-poc library, the game's renderer;
- [level-format](packages/level-format/README.md): the level description and the level
  `.json`: admission, the canonical text, the slab grid and the slab box;
- [level-glb](packages/level-glb/README.md): the GLB contract: scene assembly, inspection
  and world triangles;
- [slab-model](packages/slab-model/README.md): the only place where a slab becomes a
  destruction lib model: the shared builder and the intact mesh;
- [prop-kit](packages/prop-kit/README.md): the prop kinds: their parameter tables, their
  slab generators and the placement of a prop;
- [snapshot-render](tools/snapshot-render/README.md): the browser-free renderer of a
  level GLB into plan, section and perspective PNG sheets.

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

Read [project knowledge](docs/KNOWLEDGE.md) next.
