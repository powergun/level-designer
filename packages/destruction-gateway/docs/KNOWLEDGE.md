# destruction-gateway knowledge

## How destruction lib is wired in

The entry has two halves, and the manifest's conditional exports route them:

- the runtime half re-exports from destruction lib's package facades by a relative path
  into the sibling repository. Bun runs the sibling's sources in place;
- the type half re-exports the same names from declarations that the emit script
  generates. TypeScript reads only this half.

The halves exist because destruction lib's sources cannot enter a NodeNext program: they
use extensionless and directory imports, and some exports lack the explicit types that
isolated declarations need. The emit script runs this repository's TypeScript with
destruction lib's own compiler settings and writes declarations into the git-ignored
`generated/` folder. It marks that folder as CommonJS, where NodeNext accepts
extensionless imports, and writes a types-only stub for each destruction lib package
name. `just setup` and `just lint` run it, so the types follow the sibling's working
tree. The runtime half sits outside every type-check program.

destruction lib must be installed in its own working tree: its sources resolve Rapier
and the links between its packages from its `node_modules`, and the emit reads Rapier's
declarations from there.

## One entry with two halves, a deliberate exception

The TypeScript guideline gives each package one curated entry whose source TypeScript
checks. This gateway has one entry, but its manifest routes it to two files: TypeScript
reads the type half and Bun runs the runtime half. The split is the price of keeping
NodeNext while destruction lib's sources do not compile under it.

The gateway serves Bun-side code: meshing slabs and proving destructibility. Its code
uses no Node or Bun module, but no page imports it, so `just lint` does not bundle it
for the browser.

## When destruction lib changes

- A removed or renamed export fails the type checks that read the type half, and the
  tests that use it.
- A declaration that stops resolving fails the type-half guard, a separate type check of
  the type half with library checks on; elsewhere it would silently become `any`.
- A runtime name that drifts from its type is caught by the tests, which use every value
  re-export through the typed entry.
- A missing install stops `just setup` with a message that names destruction-poc, and
  fails the emit and the tests with an unresolved module.

## What the tests prove

- The meshing test: a 2 x 1.2 x 0.05 m model meshes to 20 triangles across its chunks,
  and its retained-cuboid snapshot covers every chunk.
- The proof test: on the same 2 x 1.2 x 0.05 m slab, yawed and lifted, one cast toward
  the face centre hits the slab's handle, and one rail at that point removes material.
  The scene syncs into Rapier.

## Limits

The synopsis generator cannot follow re-exports out of this repository, so this
component's synopsis lists none of its names. The Rapier backend resolves Rapier from
destruction-poc's install, a different copy from the one sec-111's physics uses. No page
imports this gateway, so the two copies never meet in a page bundle.
