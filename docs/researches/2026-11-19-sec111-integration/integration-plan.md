# sec-111 integration plan

This plan states how the dark factory level reaches the sec-111 game: what crosses between
the two repositories, where each piece of the work lives, how lights animated in gameplay
and more VFX stay possible, and the milestones with the owner's test at each. Three research
reports hold its evidence: [level loading](research-sec111-level-loading.md),
[lights and VFX](research-sec111-lights-and-vfx.md) and
[materials and walls](research-sec111-materials-and-walls.md).

The plan replaces the three adoption lists of the design: "What sec-111 changes at adoption"
of the level format and of the finish format, and "At adoption" of the non-destructible
objects. A path that starts `sec-111/` or `destruction-poc/` lies in that sibling repository;
every other path lies in this one.

## Goal and decisions

The game plays the dark factory as its one level, with the look the owner passed on the QA
page. Beyond the directions of the task documents, these decisions of the owner of
2026-11-19 shape the plan:

- "Live link, no copy." The code that reads and draws the level has one home, this
  repository; sec-111 links it and keeps no copy or fork of it. Only the level's files cross
  as immutable data. For the linked code this replaces the brief's sentence that sec-111
  consumes only the level data and never the designer's code.
- The level's `.glb` and `.json` are immutable through the integration: the level design is
  done, and no task below changes their format or their bytes.
- "There won't be more changes in sec-111 until the level integration is settled", and it is
  settled when the whole integration is done. Nothing runs beside it.
- "A healthy milestone should have at max 3000 LOC workload." The milestones are cut by that
  cap first and by the shortest path to done second.
- "We will execute these new tasks in sec-111 repo." The sec-111 half of each milestone is
  tasks of sec-111, executed by sessions of that repository, which run its gates and write
  nothing here. The other half is tasks of this repository.
- Animated lights and more VFX are outside the integration, which "must ensure the code
  leave space for these elements and document them in the knowledge artifacts".
- "Blown-open wide prop still block players and enemies movement but player can shoot
  through it."

The integration is done when the six milestones below have passed the owner's tests: the
game plays the dark factory as its only level, sec-111 holds nothing of its six-wall level
but the base stage file, the knowledge documents of both repositories state the space left
for animated lights, glows and effects, the QA app shows the level as the owner passed it,
and both repositories pass their gates.

## The boundary

### Immutable data: the level's files

`just build` validates the level and writes four files of one build. They are build products
of the committed description and hold no logic, so they are data:

- `dark-factory.glb`: the drawn geometry, the intact look and the roles, by the GLB contract
  of `level-glb`.
- `dark-factory.json`: the props with their slabs, the finish table and the lighting, in
  `level-designer-level/1`.
- `dark-factory.level.json` and `dark-factory.navmesh.bin`: the prepared level in sec-111's
  own schema, `sec111-prepared-level/1`.

sec-111 imports them with a recipe of its own, which writes nothing here. It runs this
repository's command-line tool, `tools/level-cli/main.ts build`, with `--workdir` set to a
directory of sec-111's scratch space, and copies the four files from `<workdir>/level/`,
replacing them whole: the pair into `sec-111/assets/stages/`, the prepared pair into the
directory under it that sec-111's `PREPARED_LEVEL_DIR` names. `build` writes nowhere but
under its work directory, and the tool finds the committed description from its own place
(`level-cli` knowledge; `tools/level-pipeline/src/read.ts`). The owner commits the files in
sec-111, where only files under `assets/` are served and fingerprinted
(`sec-111/games/arena/serve/site.ts`, `runtimeAssetFiles`), and nobody edits them there.

The prepared level is data because this build already computes it: `level-pipeline` runs
sec-111's `prepareLevel` on the static scene at every build and holds sec-111's two files
(`level-pipeline` knowledge, "The build"), and the QA walk runs on them. None of the game's
owners reads the stage GLB (`sec-111/engine/level-data/docs/KNOWLEDGE.md`), so sec-111's
preparation learns neither the roles nor the level `.json`, and the prepared level gains no
field.

### Code with one home: three linked packages

Whatever computes is code. sec-111 imports three packages from this repository's working
tree through its link map, as it links destruction lib's sources, and holds no copy:

- `level-format`: `decodeLevel`, the level's types, `recipeAt` and `slabBox`. The game decodes
  the level `.json` once at boot.
- `finish-paint`: the layer kinds, the painter and the frame rules. `level-scene` draws with
  them, and the wall view runs `slabFrame` on its damaged chunk meshes.
- `level-scene`, a new component: it builds the drawn level from the GLB bytes, the decoded
  level and the interior box. It starts no renderer and compiles nothing.

`level-scene` keeps the linked code free of gateways. Out of `level-view` it takes the unit
`paint` whole and, from the unit `scene`, the GLB load, the mesh rules, the lights and the
environment bake, with a plain interior box type in place of the gateway's `PreparedLevel`
type that two of those files name today. `level-view` keeps the rest and draws through
`level-scene`, so the QA page and the game run the same files. `level-format` depends on no
package, and `finish-paint` on it alone.

sec-111's link map takes a sibling's sources as they are. TypeScript reads a declaration
twin that sec-111 generates under the sibling's own compiler settings, and Bun runs the
source (`sec-111/tools/linkage/docs/library-links.md`). Such an emission of the linked
sources passed in this plan's review, with the settings row
`level-designer: { config: "tsconfig.json" }`, and read no gateway. Each of the three
packages exports one file, `src/index.ts`, in the string form the link map accepts
(`sec-111/tools/linkage/src/link-map/exports.ts`). Both repositories pin three.js 0.186.1
and import it as `three/webgpu`, `three/tsl` and `three/addons`, which sec-111 resolves to
its one copy (`sec-111/tools/linkage/docs/runtime-dependencies.md`).

The finishes could have crossed as data, as textures baked here. A bake needs a baker and
textures in the GLB, loses the floor lines, the hall's marks and every mark that reads a
slab's size or number (`painter-cost.md`), and fixes at build time what a painter's term can
change at run time. The lighting's mapping rules, written again in sec-111, would be a fork.

### The coupling

The link ties the repositories in both directions, and both ties are live:

- sec-111's tests, type checks, browser bundle and content identity read the three packages
  from this repository's working tree, committed or not (`library-links.md`, "Maintaining
  the map"). A change here can break the game or sec-111's gates, and it ends every
  recording made before it (`sec-111/tools/linkage/docs/content-identity.md`).
- This repository's builds and gates read sec-111's working tree through `sec111-gateway`.
  On 2026-11-19 a sec-111 commit that moved one constant turned this repository's
  `just test` red. Each repository needs the other checked out and installed beside it.

No cycle of packages forms: the three linked packages declare no gateway, and Bun's isolated
install lets a package reach only what its manifest declares. Parts that exist, and one
rule, keep a change here from breaking the game unseen:

- The QA page draws through the same files as the game, so a break of the linked code shows
  where the owner already judges every level change. The three packages keep their tests
  here, at the facades that sec-111 imports.
- sec-111's gates see a change at their next run: `just lint` regenerates the declarations
  and bundles every browser entry, and `just test` imports every linked entry
  (`sec-111/tools/linkage/docs/KNOWLEDGE.md`, "Operations and evidence"). From milestone 1
  one of its tests reads the committed level with the linked code, as far as Bun can
  without decoding a texture: it decodes the level `.json` and the prepared pair and joins
  the GLB's own JSON to them. Any other drift of the GLB shows at the game's start.
- The rule: a hand-over that changes a linked package says so, and the change is committed
  only after a session of sec-111 has run sec-111's two gates on it. A change of the level
  format, of the GLB contract or of sec-111's preparation ships with a fresh import. The
  rules of the three packages state it, and in sec-111 the knowledge and rules of linkage
  and of the level preparation.

One drift stays outside the gates: a change of sec-111's preparation that keeps its codec's
shape leaves the committed prepared level stale. The rule covers it, and no test compares
bytes: sec-111 is frozen, so its preparation changes only inside the integration's tasks.

## The pieces in sec-111, and what they take from here

sec-111 writes no stage painter, no lighting rule and no look key for a slab's skin. Its own
work is the simulation and its views, which only its packages own.

### Slabs in the walls engine

One slab is one single-layer assembly with the slab's size, material, colour and full
rotation, metal included, built in prop and slab order from the decoded level. Its inner
colour is its finish's `cut.color`. That order is the slab's identity for the blockers, for
its GLB node `<prop id>/<index>` and for a recording. A slab takes destruction lib's material
as it is and sec-111's single-layer tuning, which varies by layer count alone
(`sec-111/engine/walls/src/presets/presets.ts`, `layerConfig`). It cannot live here: the
simulation is the game's run-time state under the game's tuning, and `slab-model` depends on
a gateway, so it cannot be linked.

The engine keeps building the six walls from their placements, for sec-111's tests alone,
until milestone 6, so that no milestone carries the engine, the codec and the move of every
wall test at once. The prepared level keeps its `walls` key, an empty list for this level,
until then. The wall codec reads the engine's revision type
(`sec-111/games/arena/src/recording/walls/codec.ts`, `consecutive`) and moves to slabs at
milestone 5. It then takes a variable slab count and names a slab by its index in the level
`.json`, which the recording's content identity already fixes; the level format's list had
it store the slab's description.

### The damaged slab, with this repository's material

An intact slab is its GLB node, one draw against up to 21 chunk meshes, inside the level's
root. At a slab's first damage the wall view builds that slab's layer view, and `level-scene`
hides the slab's intact mesh together with every litter that names it as `support`. Until
milestone 4 the damaged slab and its debris draw in flat colour.

From milestone 4 its skin, the faces on the slab's six planes, draws with the material of
the slab's own intact mesh, after the wall view writes the pattern data of each chunk vertex
by `slabFrame`. The pattern therefore cannot jump, a glow stays on what remains, and damage
adds no look per finish path, glow or thickness. Its cut faces draw with sec-111's interior
painters, by the finish's `cut.family`; sec-111 adds the metal interior and the metal debris
family, after Wall Lab's metal sphere. The cut looks stay in sec-111: cut faces exist only
in its chunk meshes, and the QA app shows no damage.

### Navigation

sec-111's bake turns every body box and every wall into a closed solid of eight corners
(`sec-111/tools/level-prep/src/navmesh/geometry.ts`, `bakeGeometry`). `prepareLevel` takes
a list of such solids beside its wall list, and `build` prepares a second time with every
slab's box, whose corners `slabBox` gives in the order of sec-111's `Corners`
(`sec-111/tools/level-prep/src/geometry/solids.ts`). The solids enter the bake alone, so the
two preparations differ in the navmesh only, and the bake's own height and clearance, those
of the largest minion, decide what blocks a minion. A slab stays an obstacle after its
destruction, as a wall does in sec-111 today (`sec-111/engine/nav/docs/KNOWLEDGE.md`).

### A wide prop keeps blocking

A destroyed prop leaves a hole in the navmesh. Where that hole is wide, a player inside it
stands beyond a minion's reach: the navmesh stops 0.6 m before an obstacle, and a minion
reaches 1.1 m (`sec-111/games/arena-sim/src/tuning/tuning.ts`, `minionMelee.reach`). The
owner's rule closes it with what sec-111's physics already separates: capsules collide with
the body boxes and the blockers, while rays and segment tests see the detailed boxes alone
(`sec-111/engine/physics/docs/KNOWLEDGE.md`, "The world and its collision layers").

A wide prop is a standing prop whose standing slabs measure 1 m or more on both plan sides:
53 of the built level's 127 props, every container, enclosure, crate and conveyor. At
exactly 1 m the middle of a prop lies at a minion's reach, with no margin for the navmesh's
cells. Its block is the oriented box over its standing slabs, from the floor to their top.
The block is derived, never stored: the level's files are immutable, and the level format
stores no derived fact. The standing-slab rule moves from `level-rules`, which names both
gateways, into `level-format`, and the game derives each block through the link from the
decoded slabs and its own `floorHeightAt`; a standing prop stands on one floor level by the
validator's rule `floor`.

The game installs each block as one blocker set and never removes it. Movement then stays
blocked when the prop is blown open, and shots pass through whatever the damage has opened.
A narrower prop stays as today: a breach opens a way through it. The QA app installs no
block: it shows no damage, and each block lies inside what its prop's slabs already close.

## How further visual development stays open

The integration builds no feature and no reserve for animated lights or effects. It fixes
only what three.js fixes, which lights exist, merges no node, and builds no handle without a
consumer. Under the link a handle is added here when its feature is defined, and the game
has it at once.

Four handles exist, each with its consumer in the integration:

- The level's root: sec-111's view and `level-view` add it to their scene and release it.
- The lights, the key if the level states one and the points in the section's order: the
  two views add and release them, as sec-111's `buildWorld` holds its own lights today.
- The environment bake, a function of the renderer and the environment record: the two views
  set their scene's environment with it, and sec-111's hands read that environment once.
- Each slab's intact mesh by prop and slab index, with the call that hides it and its
  litter: the wall view, at a slab's first damage and for the skin's material.

The static points, one by one:

- The fixed light set: open by a handle. three.js keys every lit program by each light's id
  and shadow flag (`three/src/nodes/lighting/LightsNode.js`, `customCacheKey`), so the count
  stays. `buildWorld` holds the lights and can add lights of the game's own before the
  compile; sec-111's `View` exposes no light today and is where such a handle is added.
- "Never changes afterwards": restated in `level-scene`'s knowledge as fixed members and
  shadow flags, with the values the caller's. `level-view` exposes no light to the QA page.
- The shadow rendered once: left alone. The level states no key, so the game has no shadow;
  a stated key reaches the game as a light, whose holder can request its shadow again.
- The baked environment: open by a handle. The game can call the bake again, and it owns
  its scene's environment and intensity.
- Frozen matrices: left alone. The lights stand outside the level's root, and every seal,
  static object and slab keeps its own node under it, so a later mover reaches one object.
- Static materials: open by code here. A term that changes over time must be a render-scope
  node, because an object-scope uniform goes stale under the static observer
  (`sec-111/engine/wall-view/docs/rendering.md`, "Scene-pass contract").
- A glow's strength as a constant of a shared material: open by code here. Each glow
  material carries its glow's name and unscaled strength in its `extras`, and turning the
  constant into a term changes one file.
- Points without names, and a lamp without a link to its point: left as passed, open by
  code here. A name or a link is one key of `level-format`. A lamp that changes alone also
  needs an emission of its own, which a glow's shared material cannot give: a term per
  vertex or a material per lamp, a change of the GLB contract.
- The post handles: sec-111's own. Its presenter owns the post uniforms, its `View` exposes
  none today, and the integration puts nothing between the game and them.

Animating a light rests on its value changing without a new program. three.js copies a
light's colour and intensity into a uniform at every frame
(`three/src/nodes/lighting/AnalyticLightNode.js`, `update`), and Wall Lab writes its pooled
lights every frame on the same three.js (`destruction-poc/packages/demo`, `FlashPool.update`).
The game's pipeline has not shown it yet, and no milestone needs it. The scene-pass contract
is untouched: the level's materials are opaque and already draw in the game's scene pass on
the QA page, and smoke, dust and glass need a transparency path that rendering-poc lacks.

The knowledge documents state this space: for lights, glows and effects, what is fixed, what
is free, where a handle is added and what the renderer cannot do today:

- Here: the knowledge of `level-scene`. `docs/LOOK-AND-LIGHTING.md` tells the art team which
  values of the level a game may drive, and the root knowledge links down to both.
- In sec-111: `engine/view/docs/scene.md` states the level's light set and names the `View`
  as the place where a light or post handle is added, and `engine/view/CLAUDE.md` restates
  its light rule as fixed members and free values. `engine/vfx/CLAUDE.md` and
  `engine/vfx/docs/KNOWLEDGE.md` say how an effect gets a light and that no transparency
  path exists, and `engine/wall-view/docs/rendering.md` that a slab's skin may emit.

## Milestones

Each milestone ends in the owner's test, and both repositories pass their gates at each one.
Each task belongs to one repository, runs its own gates green and changes its repository's
knowledge and rules with its code. Where a landing in one repository turns the other's gates
red, the milestone names the window; the owner commits both sides of a window together.

The workload of a milestone is the lines of source and tests that it adds or changes, in
both repositories. Lines deleted and lines moved unchanged stand apart:

- Milestone 1: 1,150 to 2,900 lines; about 1,700 moved and 1,000 deleted.
- Milestone 2: 1,350 to 2,600 lines.
- Milestone 3: 650 to 1,400 lines.
- Milestone 4: 800 to 1,650 lines.
- Milestone 5: 950 to 1,900 lines.
- Milestone 6: 900 to 1,950 lines; 800 to 1,500 deleted.

sec-111 carries about 85 percent of these lines. The ranges rest on the present sizes of the
packages each task changes; they cannot see how many of sec-111's tests pin values of the
six-wall level, which sits in task 1.2, nor what a review sends back. Milestones 1 and 2 run
task by task. After milestone 2, milestone 3 can run beside 4 or 5, which both change the
wall view and follow each other. Milestone 6 closes.

### 1. The dark factory shows in the game

Task 1A, here, lands first and needs nothing from sec-111 (250 to 550 lines): `level-scene`
is built with its knowledge, and `level-view` draws through it; its scene and painter tests
move with their code. `build` writes the four files. The root documents state the boundary,
and the three packages' rules the hand-over rule.

Task 1.1, in sec-111, needs 1A (500 to 1,050 lines; linkage, view, arena and one new tool):

- The link map gains the three entries and the settings row named above, and
  `just link-types` and both gates pass. This step proves that Bun and sec-111's bundler
  resolve the linked sources to one three.js, before any other work rests on the link.
- The import recipe copies the four files; its first run proves that it leaves this
  repository's tree unchanged. The game loads them under names of their own, and sec-111's
  tests still read the six-wall pair.
- Boot decodes the level `.json`. The view's `buildWorld`
  (`sec-111/engine/view/src/view.ts`) builds its level and lights from `level-scene` and
  deletes the units `level` and `lighting`, with the material audit, the end wall, the sun's
  shadow, the spill and the strip mask. The game writes the level's haze and exposure over
  the result of its own `arenaLook`, and `STAGE_FILE` and the clear colour move to `look`.
- `dev-server.test.ts` follows the file names, and the test of the committed level, stated
  under the coupling, is added. A recording is refused in this level, with a message, until
  milestone 5.

Task 1.2, in sec-111, follows 1.1 (350 to 1,100 lines; level-data, level-prep and the tests
of the packages that read the committed level):

- `PREPARED_LEVEL_FILES` names the dark factory's prepared pair for the game and for
  `@sec111/level-data/testing` at once (`sec-111/engine/level-data/src/contract/files.ts`),
  and the tests that pin facts of the six-wall level are pinned again.
- The tests that need a wall read the six-wall pair through a second reader of that testing
  entry, `readSixWallLevel`, which task 6.2 removes.
- The freshness test, the `level-prep` recipe and its `cli.ts` go, so that nothing
  overwrites the imported pair. `prepareLevel` stays, as the library this repository calls.

Task 1B, here, runs against task 1.2's tree (30 to 200 lines): `sec111-gateway`'s drift test
reads the clear colour at its new place, and the tests that read sec-111's committed
prepared level are pinned to the dark factory's. `GAME_VALUES` keeps its values. From task
1.1's landing until task 1B, this repository's `just test` is red.

sec-111 still holds the six-wall pair, the walls file, the wall placement contract and the
walls engine on placements; the game plays none of them. The props are drawn and not yet
solid, and minions walk through them. The owner's test shows whether the game plays with an
empty wall list and holds its frame rate. The owner judges that the QA page looks as passed,
and in the game the mood against it, the hands and the minions under the level's lights, and
the start time.

### 2. Props block and break

Task 2A, here (150 to 250 lines): `level-scene` hands out each slab's intact mesh and hides
it with its litter. Its test shows that hiding a slab hides its mesh, its litter and nothing
else.

Task 2.1, in sec-111, can run beside 2A (700 to 1,400 lines; walls and arena): the walls
engine builds one assembly per slab, beside its placement path, and the session hands it
the decoded slabs. The wall codec keeps reading placement revisions and still refuses this
level. Its tests show that a rotated metal slab takes a hit and publishes its blockers.

Task 2.2, in sec-111, needs 2A and 2.1 (500 to 950 lines; wall-view and arena): the wall
view builds a layer view at a slab's first damage, hides the intact mesh through
`level-scene` and draws the damaged slab and its debris in flat colour.

No gate turns red in this milestone. The six-wall level's remains now serve sec-111's tests
and its codec alone. Minions stall at props until milestone 3, and ragdolls fall through
them until milestone 6. The owner judges the collision against the QA walk, each of the four
materials under fire, the debris and the litter that goes with its slab. The test also shows
the load time, the frame rate in a firefight, whether a first hit hitches and whether a
damaged slab meets its intact mesh without a step.

### 3. Minions navigate, and wide props keep blocking

Task 3A, here (200 to 450 lines): the standing-slab rule moves into `level-format`, which
gains the derivation of a prop's block. Its tests show that a prop of 1 m has a block over
its standing slabs and a narrower one none.

Task 3.1, in sec-111, can run beside 3A (150 to 350 lines; level-prep): `prepareLevel` takes
the solids. Its tests show that a solid across a corridor cuts the baked route and changes
nothing but the navmesh.

Task 3B, here, runs against task 3.1's tree (100 to 200 lines): `build` prepares a second
time with the slabs' boxes, which adds one preparation of about 3 s to the test recipe, and
the project knowledge drops the accepted limit of the hiding spot. From task 3.1's landing
until task 3B, this repository's type check and tests are red, because its call of
`prepareLevel` passes no solids; sec-111's gates stay green.

Task 3.2, in sec-111, needs 3A and 3B (200 to 400 lines; walls, arena and the assets): each
block becomes a blocker set that stays, and the import runs again. The import proves that
the bake stays inside the navmesh's 16 MiB seal. Its tests show that a capsule stops at a
block whose slabs are gone while a ray passes.

The owner judges that minions route around the props on both floors, pass under the
hanging ones and reach the player in the lanes and the gaps, and that a blown-open container
still stops the player and the minions and lets shots through. The six-wall level's remains
are unchanged in this milestone and in the next.

### 4. Finishes survive damage

Task 4, in sec-111, needs nothing new from here (800 to 1,650 lines; wall-view): the wall
view draws the skin and the cut faces of a damaged slab as stated above, in its live and its
recorded views, and gains the metal interior and debris. Its tests show that a chunk vertex
on a slab's plane carries the pattern data that `slabFrame` gives, and that the intact
mesh's material builds its program on chunk geometry. Task 4A, here, changes documents
alone: the project knowledge drops the accepted limit of the lost glow.

The owner judges that no pattern jumps at a first hit, the cut faces of each family, the
metal debris, a strip that keeps its glow, and that no first hit on a finish hitches.

### 5. Recording and replay

Task 5.1, in sec-111 (700 to 1,400 lines; arena's recording): the wall codec moves to slabs,
and its tests with it. A test shows that a recording round-trips a slab's revisions. Task
5.2, in sec-111, follows it (250 to 500 lines; wall-view and arena's replay scene): the
recorded views bind the level scene and its materials, and the refusal of a recording goes.

The six-wall level no longer serves the codec; it serves the other wall tests alone. The
owner records a run and judges that its replay shows the same level, damage and litter.

### 6. The six-wall level goes

Task 6.1, in sec-111 (700 to 1,500 lines; characters, walls and the tests of five packages):

- The tests that still read a wall, of the walls engine, the wall view, navigation, the
  characters and the arena, move to the slabs.
- The characters take one axis-aligned static per prop, over its slabs inside sec-111's 3 m
  body band; a prop above the band has none, as static detail above it has none today
  (`sec-111/engine/level-data/docs/KNOWLEDGE.md`, "Two collision representations").
  sec-111's `requireBodyBudget` checks the ragdoll world at the start: one static per prop
  gives a peak near 533 of 1,024 bodies if a ragdoll holds 18, as a source comment says.
- The debris source cap rises from 128 to the slab count, as the level format states.

Task 6.2, in sec-111, follows it (200 to 400 lines; 800 to 1,500 deleted; level-data,
level-prep and walls): the six-wall pair with `readSixWallLevel`, the walls file, the wall
placement contract, the engine's placement path and the preparation's wall list and
placement rules go. The `walls` key leaves the prepared level and its codec, and the task
runs the import again, so that the committed prepared level carries no such key.

Task 6B, here, runs against task 6.2's tree (10 to 50 lines): the call of `prepareLevel`
drops its wall list. From task 6.2's landing until task 6B, this repository's type check is
red; its build still runs, which is what lets task 6.2 import.

Nothing of the six-wall level remains but the base stage file. The owner judges ragdolls
against props, the debris of a long firefight, and that the game and the QA app play as
before.

## Costs and remedies

The owner reads cost from the frame rate, which the game shows without a flag
(`sec-111/games/arena/docs/QA.md`). The counts are the research reports':

- The draw cost, at milestone 1: about 920 meshes and up to 54 painter programs under 25
  points, where the QA frame rate overstates the game's.
- 616 assemblies, at milestone 2: load time, blockers per chunk and debris. sec-111's wall
  view builds every layer at construction and at capacity, with 500 gibs and 1,000 rims per
  wall of about 7 by 3.2 m. Milestone 2 builds a layer view at first damage and starts from
  those budgets scaled by a slab's face; its test sets them.
- Navigation, at milestone 3: the validator keeps gaps of 1.5 m without a raster margin, so
  the test can show a pocket that minions cannot reach.
- Looks, at milestone 4: the skin draws with the intact mesh's material, so damage adds one
  look per cut family, four in all, and none per finish path, glow or thickness.
- What stays: the body world holds 227 of sec-111's 512 boxes, because no slab and no static
  object enters the preparation. The game's prepared level has no freshness test in sec-111,
  and sec-111 keeps serving the base stage's 11.4 MB, because this build reads it there.

When a milestone's test shows a cost the owner rejects, the team stops and brings the
remedies with what each closes, and the owner chooses. The first two change the level's
`.json`, which is otherwise immutable through the integration:

- A point light goes, in the order of the look and lighting document. It closes that light
  for animation.
- A recipe gets lighter. It changes a look the owner passed and closes nothing.
- The finishes are baked, as the painter cost document states. It fixes every painter term at
  build time and loses the marks named above.
- The budgets per slab shrink, or the debris cap stays low, against the level format's list.
  Fragments are omitted past a cap; nothing closes.
- The dressing shrinks. The layout is passed, so this applies on the owner's word alone.
