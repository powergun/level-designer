# render-gateway knowledge

## How the rendering library is wired in

The manifest declares rendering-poc's library package as a `file:` dependency. Bun
installs a `file:` directory dependency as a copy in this repository's store, and
resolves the copy's own `three` from this repository's store. The root `package.json`
overrides `three` to the version the library declares, so every consumer of three.js
shares the library's copy and a page holds one three.js core. rendering-poc needs no
install of its own.

Bun can build the copy from hard links to the sibling files, and it does on Windows.
`just setup` runs the detach script right after the install: it rewrites every file of
the copy as a new file with the same bytes, unlinking first, so nothing in this
repository can modify rendering-poc through `node_modules`.

The library imports with `.ts` extensions, so the root compiler settings allow them.

## When the library changes

The copy is a snapshot. A change in rendering-poc's working tree reaches this repository
only when `just setup` runs: its frozen install notices the changed source and copies it
again. Until then the drift test fails:

- a file of the copy differs from its sibling original or has none, or the copy lacks
  the sibling's manifest or one of its sources;
- a file of the copy is still a hard link to its sibling original;
- the root `three` override differs from the `three` the library declares.

`just setup` fixes the first two cases; the third needs the root override changed.

## What the tests prove

- The wiring test: a browser entry that names every re-export bundles with exactly one
  three.js core. A missing value re-export fails the bundle, and a missing type
  re-export fails the type check of the test sources.
- The drift test: the three drift cases above.

## Limits

The synopsis generator cannot follow re-exports out of this repository, so this
component's synopsis lists none of its names.
