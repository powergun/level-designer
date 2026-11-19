# sec-111 level loading, preparation and simulation: research report

Scope: how sec-111 loads, prepares and simulates its level today, and what each part needs
to take the level pair that `just build` writes. Drawing, lights and VFX appear only where
a loading fact touches them. The report establishes facts; it holds no plan.

Evidence rules. A statement names a file and a line or symbol, or a probe with its output.
Paths starting `sec-111/` are in `../sec-111`; other paths are in this repository. A line
that starts with "Inferred:" was not read or run. Section 5 lists the probes and what was
not checked. sec-111 was read at its working tree of 2026-11-19; it was clean before and
after every probe (`git status --short`).

## 1. The path of a level through sec-111 today

### Inputs and preparation

- Two authored inputs: `assets/stages/old_factory_free.glb` (11,398,692 bytes) and
  `assets/stages/old_factory_free.walls.json`, named in
  `sec-111/tools/level-prep/src/prepare/inputs.ts` `PREPARE_INPUT_FILES`.
- The root `level-prep` recipe runs `sec-111/tools/level-prep/src/cli.ts`: it reads both
  files, calls `prepareLevel` and writes the prepared pair to `assets/stages/prepared/`
  (`old_factory_free.level.json`, 281,951 bytes, and `old_factory_free.navmesh.bin`,
  130,516 bytes). The pair is committed.
- `prepareLevel` (`prepare/prepare.ts:93`) takes `{ stage, placements }` and runs: GLB read
  (`glb/scene.ts` `readStage`), survey (`survey/survey.ts` `surveyStage`), shell and voxel
  boxes, body world with the 512-box budget (`prepare.ts:77`, a throw), spawns, wall
  placement rules (a `rejected` result), navmesh bake, acoustic faces, encode.
- The reader names each part by its mesh node's parent (`scene.ts:118`). The survey splits
  parts by `STAGE_OBJECTS` (`survey/stage.ts`): four measured planes, ten structure
  objects into `world.shell`, every other object into `world.prop`.

### Contract and codec

- `sec-111/engine/level-data` owns `PreparedLevel` (`src/contract/level.ts:99`): metrics
  with `scale`, `world` (`shell`, `prop`, `closure`, `endWall`), `bodies` (`floors`,
  `obstacles`, `enclosure`), `spawns`, `walls`, `acoustic` and `navMesh`.
- `WallPlacement` (`level.ts:67`) holds a preset of five kinds, width, height, base centre
  and yaw. `WALL_BUILDS` (`contract/presets.ts`) fixes layer counts and thicknesses.
- The codec (`src/codec/decode.ts`, `schema.ts` `LIMITS`) admits schema
  `sec111-prepared-level/1`, at most 64 walls, 50,000 boxes per role, 512 body boxes and a
  16 MiB navmesh sealed by length and checksum (`docs/persisted-pair.md`).
- `PREPARED_LEVEL_DIR` and `PREPARED_LEVEL_FILES` (`contract/files.ts`) fix the file names.

### Runtime assembly

- `games/arena/src/boot/load.ts` `loadLevel` fetches the two prepared files and decodes
  them once. The browser never reads the stage GLB for gameplay.
- `games/arena/src/session/world.ts` `buildWorld` builds, in order: `createPhysicsWorld`
  and `createNavigation(level.navMesh)`, then `createWallsWorld` with the physics blocker
  sink, one physics step, then `Characters`, the queries and `createArenaSim` with
  `layoutOf(level)` (the spawns, `session/layout.ts`).
- `games/arena/src/boot/presentation-assets.ts` `loadPresentation` passes the level and
  `servedUrl(STAGE_FILE)` to `createView`, and the level to `bootArenaAudio`.

### What reads the prepared level

- Physics: `engine/physics/src/obstacles/static-level.ts` `addStaticLevel` builds one body
  compound from `bodies`, one detail compound from `shell`, `prop` and `endWall`, and one
  closure compound. It reads no wall; walls arrive through the blocker sink.
- Navigation: `engine/nav` imports the navmesh bytes only (`world.ts` `createNavigation`).
- Walls engine: `engine/walls/src/world/create.ts:29` builds one assembly per
  `level.walls` entry; `debris/boxes.ts` registers every detailed box with the debris scene.
- Characters: `engine/characters/src/world/world.ts` `createCharacterWorld` makes ragdoll
  statics from raised floors, body obstacles and one axis-aligned box per wall.
- Characters and effects place bodies with `floorHeightAt` (`characters/src/bodies/root.ts`,
  `cosmetic/landing.ts`, `games/arena/src/adapters/visuals.ts`).
- Audio: `engine/audio/src/room/room.ts` `arenaBlockout` reads the interior and acoustic
  faces.
- View: `engine/view/src/level/plan.ts` `planLevelVisuals` reads `metrics.scale` and
  `world.endWall`; `lighting/lighting.ts:56` and `view.ts:123` pass `metrics.scale` to
  `arenaLighting` and `arenaLook`.
- Recording and replay: `games/arena/src/recording/walls/codec.ts` writes wall revisions
  into fixed slots; `replay-scene/build-world.ts` rebuilds debris and walls from them.

### Tests and fixtures pinned to the present level

- Freshness: `tools/level-prep/tests/freshness.test.ts` prepares the real inputs and
  compares bytes with the committed pair.
- 26 files read the committed pair through `@sec111/level-data/testing` (grep of
  `readCommittedLevel|readCommittedFiles` over `engine`, `games`, `tools`), across audio,
  character-fx, characters, level-data, nav, physics, view, walls, arena-sim, arena and
  level-prep. `engine/walls/tests/fixture.ts` reads the files directly.
- `tools/level-prep/src/survey/survey.test.ts` pins the real stage's plane facts.
- Wall-pinned tests: `tools/level-prep/tests/{placements,navmesh,hiding}.test.ts`,
  `engine/walls/tests/build.test.ts`, `engine/nav/tests/*`, and arena tests such as
  `wall-recording.test.ts`, `wall-outcomes.ts` and `material-fixture.ts`.
- Path pins: `engine/view/src/level/level.test.ts`, `lighting/lighting.test.ts` and
  `games/arena/tests/dev-server.test.ts` name the stage or the prepared files.
- In this repository, `packages/sec111-gateway` reads sec-111's committed pair through its
  testing entry, and its drift test reads `arenaLook(1)` (its `docs/KNOWLEDGE.md`).

## 2. The adoption lists against present source

The lists are "What sec-111 changes at adoption" of `level-format.md` and of
`finish-format.md`, and "At adoption" of `non-destructible-objects.md`.

### Data and preparation

- Contract and codec. Lands in `engine/level-data/src/contract/level.ts` and `src/codec/`.
  `walls` is a required root key of the codec today (`decode.ts:171`); props, slabs, finishes
  and lighting have no field. The rendered end-wall role is `world.endWall`, read by
  physics, walls debris, view and level-prep (grep `endWall`: 16 files with tests).
- Level preparation reads the pair. Lands in `prepare/prepare.ts` `PrepareInputs` and
  `cli.ts`. The admission part already holds: level-pipeline's fixture test hands the whole
  level GLB to today's `prepareLevel` (`tools/level-pipeline/docs/KNOWLEDGE.md`).
- What does not hold: the reader ignores `extras`, so every appended object is a prop. On
  the committed level, probe `prep-whole.ts` measured the static scene at shell 881, prop
  3,402, closure 3 and 227 body boxes, and the whole level GLB threw `bodies: the body world
  exceeds 512 boxes` after 3.4 s. Admission of the file is not admission of the level.
- `seal` nodes as structure. Today a seal's parent name is its id, so it lands in
  `world.prop` (3,402 against the committed level's 3,396). No runtime reader separates
  `shell` from `prop`: physics and debris merge them (`static-level.ts:47`, `boxes.ts:10`).
- Slab placement rules. Today's rules (`walls/rules.ts`, `MIN_GAP = 3`, `MIN_SPAWN_DISTANCE
  = 6`) measure touching footprints as zero distance, so two touching slabs of one prop
  break `near-wall`. They cannot serve as slab rules unchanged.
- Rotated slab obstacles in the bake. `navmesh/geometry.ts` `wallCorners` extrudes a yawed
  footprint from base to top; it takes no pitch or roll. Probe `slabs.ts`: 193 of 616 slabs
  have a non-yaw rotation and 117 have their base above 3 m.
- The scale becomes 1. The pipeline test measures scale 1 on the static scene
  (level-pipeline knowledge, "The fixture build"); the committed pair has 3.89956.
- Assets and tests. Correct as listed; section 1 names the files.

### Runtime and presentation

- Walls engine. `buildAssembly` (`engine/walls/src/assembly/assembly.ts`) takes a preset,
  yaw only (`quaternionFromEuler(0, yaw, 0)`) and preset layers. `WALL_PRESETS`
  (`presets/presets.ts`) has no metal; destruction lib's `MaterialId` has `metal`
  (`destruction-poc/packages/destruction-core/src/damage/material-id.ts`). Probe `slabs.ts`:
  456 metal, 148 wood, 10 concrete, 2 brick slabs; thicknesses 0.03 to 0.6 m in seven values,
  four of them in no `WALL_BUILDS` entry.
- Debris source cap. destruction lib's default `maxEventSources` is 128
  (`destruction-sim/src/debris/config.ts:10`); sec-111 does not override it
  (`debris/stage.ts:86`). Past the cap a new source's fragments are omitted, not fatal
  (`lifecycle/system.ts:242`).
- Blocker ids: four layers per assembly and 256 chunks per layer, or a `RangeError`
  (`walls/src/blockers/blockers.ts:51`). Probe `slabs.ts`: at most 21 chunks per slab with
  slab-model's builder, so one slab per assembly fits.
- Wall view. `engine/wall-view/src/materials/looks.ts` and `debris.ts` key finishes by
  `WallPresetKind`. Drawing from GLB mesh nodes does not exist today.
- View. `plan.ts:39` throws on a material without a `MATERIAL_AUDIT` entry, and the pair's
  appended materials (`seal/<id>`, `finish/<path>`) have none. `stageMeshes` throws on
  duplicate mesh names. The end wall and the light set are fixed (`build.ts:105`).
- Characters. `createCharacterWorld` derives one box per wall from yaw and preset thickness.
- Recording. The wall codec is pinned to the present six walls: thirteen slots, the last
  assembly index 5, one byte per slot, assembly and definition count
  (`recording/walls/codec.ts:112-152`); `definition.ts` writes the preset name and yaw.

### Finish and static additions

- Contract admits the finish table and four slab keys. Lands in level-data; no field today.
- Preparation skips `static` nodes. Today a static node's box is voxelised as a prop: the
  245 static objects of the committed description enter the body world. This is one cause
  of the throw above; the probe did not separate the causes.
- Wall view and stage view: the painter copy, the cut look, `static` nodes and the hiding
  by `support`. None exists today. GLTFLoader copies `extras` to `userData`
  (`three/examples/jsm/loaders/GLTFLoader.js:2362`) and strips `/` from node names
  (`createUniqueName`, `PropertyBinding.sanitizeNodeName`), so `crate/0` loads as
  `crate0`. A reader that joins by the stored name `<prop id>/<index>`, as `support` holds
  it, must read the glTF name, not the three.js name.

### What the lists miss

- The recording wall codec's fixed six-wall shape and its byte-sized counts.
- The ragdoll budget. `characters/src/spear/budget.ts` requires statics + 6 room slabs +
  10 x bodies per ragdoll within anim-poc's 1,024 bodies
  (`anim-poc/packages/gameplay/src/physics/settings/index.ts:87`). Inferred, at 18 bodies:
  220 statics of the static scene plus one per slab gives a peak of 1,022; one per prop, 533.
- Today's view merges stage meshes by material (`plan.ts` `addToGroup`), so a slab or a
  static node drawn as stage geometry could not be hidden alone.
- The level designer's own coupling: `packages/sec111-gateway/src/stage/index.ts`
  re-exports `prepareLevel` from sec-111's working tree, and level-pipeline calls it with
  `{"walls":[]}`. A change of `PrepareInputs` in sec-111 changes this build at once.
- The base stage path: `readBaseStage` reads the file at sec-111's `PREPARE_INPUT_FILES`
  path (sec111-gateway knowledge), so the base stage must stay readable there.
- The model seed: `buildAssembly` seeds from the assembly and layer index
  (`SEED_BASE + (index + 1) * 4 + layer`); the slab's `seed` key is a finish seed.

## 3. Gaps between the pair and sec-111

### What the pair carries that sec-111 cannot take today

- Props as groups of rotated slabs with nine keys, in `level-designer-level/1`; sec-111
  takes only `WallPlacement` through `walls.json`.
- Metal slabs and free thicknesses; sec-111 takes five presets.
- Roles in node `extras` (`seal`, `static`, `destructible`, `support`); level-prep ignores
  them, and the view reads no `userData`.
- Finish materials, a stage material's hall finish, `COLOR_0`, `TEXCOORD_0/1` and `_SLAB`;
  the view audits materials by name and has no painter.
- The lighting section with 25 points in the committed description (cap 32,
  level-format knowledge); the view's light set is fixed.
- 616 slabs in 127 props; sec-111 admits 64 walls in the codec and 32 in the input file
  (`walls/input.ts:17`), and records six.
- A GLB of 17,340,936 bytes against today's 11,398,692 (probe `prep-whole.ts`).

### What sec-111 needs that the pair does not carry

- A prepared level: the static world, body world, spawns, navmesh and acoustic faces.
  The pair stores none (level-format.md, "Stored and derived facts"); sec-111 must derive
  them, or receive a prepared pair from somewhere.
- Navigation obstacles of the slabs. The pair carries the boxes; the bake rule for pitched
  and hanging slabs exists nowhere.
- Destruction tuning per slab: gib budget, blast, breach and debris scale. sec-111 derives
  them per preset (`layerConfig`); metal has none.
- Ragdoll statics per prop: the design names "one per prop"; no shape for it exists.
- Recording identity per slab: the codec has no slab vocabulary.

## 4. Where each piece of work can live

Facts per piece: what the level designer could produce in a shape sec-111 consumes today,
and what sec-111 must learn in any case.

### Preparation and the prepared pair

- Contained here, possible today: the level designer already prepares the static scene
  through the gateway and holds the result as two files (level-pipeline knowledge, "The
  build"). It could ship that prepared pair, a `sec111-prepared-level/1` document with
  `walls: []`, which sec-111's decoder already admits.
- What it cannot cover: the navmesh of that pair has no slab obstacles, because
  `prepareLevel` takes destructibles only as `WallPlacement`. The whole level GLB as props
  throws on the body budget (probe). A navmesh with slabs needs `prepareLevel` to learn
  slabs, or a bake outside sec-111, which repeats level-prep's private bake numbers
  (`placements-and-navigation.md`, "Minion navmesh").
- Either way sec-111's freshness test and its committed pair change owner: today sec-111
  regenerates its pair from its own inputs.

### Contract, walls engine, characters and recording

- Contained here: none of it. No shape the level designer can emit reaches these owners
  except `WallPlacement`, which cannot express a pitched slab, a metal slab or a free
  thickness. A yawed slab of preset thickness and material would fit; the committed level
  holds 456 metal slabs.
- sec-111 must learn in any case: a slab in the contract and codec, a single-layer
  assembly with a full rotation and a material, ragdoll statics, the recording codec, and
  the debris source cap or its acceptance.

### Drawing

- Contained here, possible today: material names. The view accepts only the eleven
  audited names, so a GLB that reused them would load, at the cost of the `finish` join;
  the join lives in `extras`, so a name change alone breaks no join (level-glb knowledge).
- sec-111 must learn in any case: the end wall's removal, the lighting section, per-slab
  hiding and the painter. The owner allows a copy of the generic painter files
  (TASK-001, decision of 2026-11-18). sec-111's link map can also link raw sources of a
  sibling repository (`tools/linkage/docs/library-links.md`); the brief says sec-111
  consumes the level data, not the designer's code (TASK-001 brief).

## 5. Probes and what was not checked

Probes lived in the scratch directory `int/res-loading/`, ran with `mise exec -- bun` from
this repository's root, and changed no file in either repository:

- `prep-whole.ts`: builds `levels/dark-factory.json` through level-pipeline's facade, prints
  the static scene's counts, then calls `prepareLevel` on the level GLB with `{"walls":[]}`.
- `slabs.ts`: counts the built level's slabs by rotation, base height, material, thickness
  and chunk count through slab-model's `buildSlabModel`.
- `bodies.ts`: counts the committed pair's body boxes, raised floors and walls.
- `just validate`: 616 slabs, 127 props, 25 points, 227 body boxes, 136,829 triangles.

Not checked:

- The view, wall view, lights and VFX beyond the named lines; no browser, no GPU.
- Whether the body budget alone throws once static nodes are skipped.
- The ragdoll body count per pack (18 is the comment in `engine/characters/src/cosmetic/cosmetics.ts:21`).
- The game's cost at 616 slabs: blockers, debris, nav queries and load time.
- destruction lib's behaviour with more than 128 event sources once the cap is raised.
