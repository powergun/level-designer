# sec111-gateway knowledge

## How sec-111 is wired in

Every entry re-exports from sec-111's package facades by a relative path into the sibling
repository. There is no dependency entry, no copy and no generated file: Bun runs
sec-111's sources in place, and the type checks read them under this repository's
compiler settings. These settings are stricter than sec-111's, because they turn isolated
declarations on; sec-111's sources pass them.

sec-111 must be installed in its own working tree. Its sources resolve their imports from
sec-111's `node_modules`:

- Rapier SIMD for the physics world;
- Recast, with sec-111's declaration patches, for the level preparation;
- the links between sec-111's own packages, such as level-prep to level-data.

## Three entries, a deliberate exception

The TypeScript guideline gives each package one curated entry. This gateway has three
on purpose: the browser-safe main entry serves a page, the Bun-side stage entry serves a
level build, and the testing entry serves tests only. One entry would pull sec-111's file
readers and level preparation into the page, and the committed prepared level into the
build.

## The lint exemption of the Bun-side entries

The main entry is browser-safe: the browser-safe type check covers it, and `just lint`
bundles it for the browser. The stage entry and the testing entry read files with Node's
file access, so the browser-safe type check and the browser-safe oxlint rules exempt
both. The tool-source type check covers them instead, with Bun types and isolated
declarations. They are the only package entries that use Node file access.

## The stage and testing entries

`readBaseStage` reads the stage file at the path sec-111's level preparation names, so
sec-111 stays the one owner of where the file lives.

The testing entry re-exports sec-111's own `readCommittedLevel` and `readCommittedFiles`,
unchanged. The first returns the committed prepared level decoded; the second returns its
two files, the document text and the navmesh bytes, for tests that serve or decode the
files themselves. The committed prepared level is sec-111's base stage with sec-111's own
six destructible walls, not a level of this repository.

## Game values

`GAME_VALUES` copies what a QA page must match:

- the lens: 92 degrees, 0.05 m, 160 m;
- the post look `arenaLook(1)`;
- the player: walk 3.5 m/s, sprint 5.5 m/s, eye ratio 0.92, pitch limit 1.55 rad, and the
  start direction `[0, 0, -1]`, the unit view direction at the start in world axes: toward
  -Z, the back wall;
- the 60 Hz tick;
- the page constants: pixel-ratio cap 1.5, 12 signature slots, the frame clamp of
  1/15 s (stored as the rate 15), 2 warm-up frames and the clear colour
  (0.004, 0.005, 0.007) in linear RGB.

The drift test guards every value. It imports sec-111's look and tuning sources by a
computed path, so their types never enter this repository's programs. The page
constants are private to sec-111's sources, so the test reads each one with a text
match in its source file, and fails when the text is gone.

The start direction is pinned by a relation, because the game stores a yaw and a pitch: the
test reads the input mapper's start look by text and asserts that the copied unit vector has
that heading under sec-111's own `headingOf`, and that pitch as its elevation. It cannot see an
X-mirrored convention, the camera's own convention, or a second place in sec-111 that sets the
look.

## When sec-111 changes

sec-111's working tree is live input, committed or not:

- a removed or renamed export fails the type check;
- a new export without explicit types fails the browser-safe check, which applies
  isolated declarations to sec-111's sources too;
- a changed game value, or a page constant whose source text changed, fails the drift
  test;
- a moved stage file fails the wiring test;
- a missing sec-111 install stops `just setup` with a message that names sec-111, and
  fails the tests with an unresolved module.

## What the tests prove

- The wiring test: the stage entry reads a GLB, and the testing entry a decoded level
  with minion spawns and the two files that decode to one through the main entry. On
  that level, the player capsule walking toward an installed
  4 x 2 x 0.05 m panel stops on its near side, and walks through after the panel's
  removal.
- The drift test: every game value equals sec-111's live value, and a deliberately
  changed value of each group (lens, post look, player, start direction, page constant)
  is reported with its path.
- The bundle test: the main entry's page bundle holds one Rapier copy and none of the
  level preparation.

## Limits

The synopsis generator cannot follow re-exports out of this repository, so this
component's synopses show only its own code, such as `GAME_VALUES` and `readBaseStage`,
and none of sec-111's names.
