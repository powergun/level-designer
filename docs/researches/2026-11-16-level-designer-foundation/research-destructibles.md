# Destructible object authoring: research report

Scope: how dressed props become destruction lib models. Research only; no repository was
written. Every claim is marked Verified (read in a named file, or measured by a named probe)
or Inferred.

## Recommendations in brief

1. Author every first-pass prop as a set of slabs. A slab is one destruction lib `WallModel`:
   a rectangular box of any width, height and thickness, one material, one rigid transform.
   No solids, sheets or statues in this operation.
2. The level `.json` stores, per slab: size, material, face colour, position and rotation
   quaternion, grouped under a prop. Seeds, tuning, chunk layout, blockers and footprints are
   derived by the consumer.
3. The intact mesh comes from destruction lib's own wall mesher under Bun. It costs 6 to 12
   triangles per chunk, so triangles do not limit slab dressing.
4. Budget the first pass at 600 slabs in 150 props, each slab face at most 25 m2, with a
   format hard cap of 1,024 slabs. Destruction lib carries that easily; the binding costs sit
   in sec-111 (views, recording) and are paid at adoption.
5. sec-111 supports only yawed, floor-standing layered walls, at most 32 authored, and its
   recording codec is fixed at exactly 13 layers in 6 walls. Adoption needs seven changes,
   listed with sizes in section 4.
6. Prove each slab with one headless Bun test: build the model, register it at its world
   transform, cast onto a face, commit a rail and a blast, assert the material is gone at
   both hits.
7. "Everything destructible" is feasible. Three limits of the slab model must be accepted:
   SMG rounds do nothing on slab edges, damaged props never collapse, and settled debris does
   not rest on slabs.

## Evidence base

Read in full: destruction-poc `README.md`, `docs/KNOWLEDGE.md`, `docs/technical-design.md`,
`docs/INTEGRATION.md`; knowledge of core (`KNOWLEDGE.md`, `OBJECTS.md`, `SHEETS.md`,
`STATUES.md`), collision, sim (`KNOWLEDGE.md`, `CONTACTS.md`), physics, tools, and demo
`WORLD.md`, `ADAPTERS.md`. sec-111 knowledge of `engine/walls`, `engine/wall-view` (and the
head of its projection and rendering documents) and `engine/level-data`. Source read where
named below.

Probes, run read-only from `D:\w\vico\fps\destruction-poc` with
`mise exec -- bun <file>` (Bun 1.4.0, Windows x64, no browser, no GPU). The scripts lived
in a session scratch directory outside every repository and are not kept:

- `probe-shapes.ts`: intact triangle counts, rotated and elevated slab, solids, sheets.
- `probe-edges.ts`: every material on a slab, edge hits, small slabs, saturation.
- `probe-scale.ts`: 36 to 1,024 layers in one collision scene plus Rapier fixed proxies.
- `probe-proof.ts`: the section 5 proof recipe over 1,000 random slabs.
- `git status --short` stayed empty in destruction-poc and sec-111 after the runs.

## 1. Representations

### Layered wall (`WallModel`)

- Shape. A rectangular slab: `width` (local X, centred), `height` (local Y, from 0 at the
  base), `thickness` (local Z, centred). Any finite positive size (`requirePositive` in
  `model/options.ts`). Damage resolves in the X/Y plane only: each quadtree leaf keeps one
  retained Z interval, and rails add cutter records. Verified: core `KNOWLEDGE.md`, `wall.ts`.
- "Layered" is an application idea. A layered wall is several touching `WallModel`s; core
  only limits one shot's fragment selection to four layers (`selectDamageFragments` throws
  above four). Verified: `damage/selection.ts`, sec-111 `assembly.ts`.
- Placement. `CollisionScene.registerWall(model, transform)` takes any rigid position and
  rotation, no scale. Nothing ties a model to a floor; the ground is its own registration.
  Verified by probe: a slab pitched, yawed and lifted to y = 9.5 m was hit by a world cast,
  holed by a rail and opened by a blast; pitched slabs at y = 9 m synced their retained
  cuboids into Rapier.
- Materials. `MaterialId` is wood, gyprock, brick, concrete, metal. Verified by probe: all
  five construct, take a rail and a blast on a 2 x 1.2 x 0.05 m slab.
- Physical behaviour. A rail cuts a hole through one layer whatever its thickness; a blast
  empties the leaves under its disc (sec-111 never uses the shallow mode). The material
  selects the debris: density (650, 850,
  1800, 2300, 7850 kg/m3), fragment counts, shape mix, speed, and for metal a ricochet
  motion group and through-launched seeds. Walls read only the Shift fractions of the weapon
  response. Verified: `debris/materials.ts`, core `KNOWLEDGE.md`. So on slabs, hardness is
  authored as thickness and stacked layers, not chosen by the material name.
- Inputs. `new WallModel({ width, height, thickness, materialId, color, innerColor?, seed?,
  debrisLateralScale?, config? })`.
- Limits. 125 live holes per layer by default, then a breach policy; no connectivity, so
  detached material stays suspended; rails need entry through a depth face. Verified by
  probe: a rail on the top edge of a 20 x 0.5 x 0.3 m slab returned `applied: false`; a blast
  on the same edge removed material.

### Solid object (`ObjectModel`)

- Shape. Two analytic bases only: `createTruncatedBall(radius, truncation)` and
  `createCappedCylinder(radius, height)`, upright, origin at the lowest point. There is no
  box base. Verified: `objects/bases/`, `index.ts` exports.
- Placement. `registerSolid(port, transform)`, any position and unrestricted rotation.
  Verified: collision `KNOWLEDGE.md`.
- Materials and behaviour. All five ids, full weapon response: rail penetration 0.12 m wood,
  0.2 m brick and concrete, 0.06 m metal; craters with lobes; a blast removing half the
  remaining volume shatters the object. Optional lattice connectivity severs islands that
  fall and shatter. Verified: `OBJECTS.md`, `materials.ts`.
- Inputs. `new ObjectModel({ base, materialId, color, seed, config?, connectivity?:
  { cellSize, anchors } })`. Caps: rails at `maxHolesPerWall`, 256 blast records, 512
  crumble records.

### Curved sheet (`SheetModel`)

- Shape. One 4 mm metal blank bent over a chart: cylinder (radius, width, height), dome or
  saddle (torus patch). Thickness and material are constants. Verified: `sheet/model.ts`,
  `sheet/chart.ts` (`SHEET_THICKNESS = 0.004`, `materialId = "metal" as const`).
- Placement. A mount quaternion inside the model plus the registration transform.
- Behaviour. Rails punch perpendicular holes and reject glancing hits; blasts tear chart
  cells; anchor rectangles drive severing. Chart maths uses native trigonometry, so results
  can differ between hosts. Verified: `SHEETS.md`.
- Inputs. `new SheetModel({ chart, mount?, color?, anchors?, seed?, blastRadius?,
  chunkWidth? })`.

### Imported statue

- Shape. Any posed triangle mesh; material is its conservative 1 cm voxelisation, capped at
  32 million grid cells, about 32 m3 of bounding volume. Placement, materials and weapon
  response are the solid object's. Verified: `statue/bake.ts`, `STATUES.md`.
- Inputs. `bakeStatue(mesh)` or `createStatueBase(mesh)` with positions, indices, normals,
  UVs, part ranges and a closing radius, then an `ObjectModel` over that base. It costs a
  bake, a BVH and voxel bricks per source. Not probed.

## 2. Serializable description and offline mesh

Recommendation: store slabs only, in world space, grouped by prop.

Per slab, the smallest complete description:

- `size`: `[width, height, thickness]` in metres.
- `material`: one of destruction lib's `MaterialId` values.
- `color`: face colour, hex sRGB. It becomes vertex colour and, for metal, debris colour.
- `position`: world position of the slab's local origin (base centre: X centred, Y = 0,
  Z centred), scaled metres, the level's frame.
- `rotation`: unit quaternion `[x, y, z, w]`, local to world. A quaternion avoids an Euler
  order convention between repositories.

Per prop: a stable `id`, a `kind` (conveyor, enclosure, arm, container, bridge-crane,
jib-crane) and its ordered slab list. The prop is the unit for navigation footprints,
ragdoll statics and naming; file order gives each slab a stable index.

Deliberately not stored, because a consumer derives each from the fields above or owns it as
tuning: the model seed (derive from the slab index, as sec-111 does today), `CoreConfig`
tuning, chunk counts, blockers, bounding boxes, footprints, cut colour (a per-material table
in the consumer).

Descriptions of the other representations, should a later pass need them: a solid stores
base kind and its two numbers, material, colour, pose and optional connectivity (cell size,
anchor boxes); a sheet stores chart kind and numbers, mount, anchors, colour and pose; a
statue stores a mesh reference in the `.glb` plus a closing radius, and pays a bake.

Offline mesh generation. Verified by probe under Bun, no browser, no GPU:

- Slab: `new WallModel(options)`, then `createChunkGeometry(model, chunkIndex)` for each
  entry of `model.chunks`. It returns `surface: MeshData`, unindexed triangles with
  `positions`, `normals`, `colors` in slab-local metres. Transform by the slab pose and write
  to the `.glb`. `MeshData` has no UVs; the level designer adds planar UVs from slab-local
  coordinates if a texture needs them.
- Solid: `new ObjectGeometryCache(model)`, then
  `finishGeometry(cache.build(model.recordSnapshot()))`; the result carries indexed regions
  and a `triangles` count.
- Sheet: `finishGeometry(buildSheetChunkGeometry(model, chunk))` gives flat chart triangles;
  the consumer bends them through `model.chart.forward` and `canonicalToObject`.
- Determinism. Wall and solid truth and meshes avoid native transcendental maths and are
  pinned by Bun and Node parity fixtures; sheets are a declared exception. Verified: core
  `KNOWLEDGE.md`, `OBJECTS.md`, `SHEETS.md`.

Measured intact triangles (`probe-shapes.ts`, core default `chunkWidth` 1.45 m):

- Slab 1 x 1 x 0.05: 12. Slab 2 x 1.2: 20. Slab 4 x 2.4: 44. Slab 7 x 3.2 (today's brick
  wall): 92. Slab 20 x 0.5 x 0.3: 116. Slab 0.3 x 6 x 0.3: 44. That is 6 to 12 per chunk,
  where chunks = ceil(width / 1.45) x ceil(height / 1.45).
- Cylinder r 0.1 h 1: 230. r 0.15 h 3: 728. r 0.3 h 6: 1,950. Ball r 0.25: 1,646. The 1 mm
  tessellation tolerance is a constant.
- Sheet 1.6 x 1.2: 1,300. Near-flat sheet 4 x 2.4: 5,160.

The intact slab mesh depends on `chunkWidth`. Use core's default in the level designer so
the `.glb` triangle count equals what the game builds for an undamaged slab.

Alternative: the level designer writes its own 12-triangle box per slab. It lost because it
adds a second mesher whose seams and counts differ from the runtime's.

## 3. Budgets

What grows with the number of slabs (layers):

- Model memory. About 4 to 7 KB of heap per pristine two-chunk slab. Measured.
- Queries. `CollisionScene.prepare()` and every static query visit all wall registrations.
  One cast with its own prepare, as sec-111's `WallHits` does: 2.8 us at 36 layers, 14 us at
  256, 28 us at 512, 52 us at 1,024. Measured. Inferred from the call sites (bullets,
  punches, minion reach checks): sec-111 casts a handful per tick.
- Fixed physics proxies. One Rapier collider per retained leaf: 2,049 colliders for 1,024
  two-chunk slabs, first sync 9.5 ms, idle sync 0.017 ms, sync after a blast 0.05 to 0.2 ms.
  Measured. sec-111's debris scene already registers 4,281 static level boxes (counted from
  `old_factory_free.level.json`).
- Debris sources. `maxEventSources` defaults to 128 and sec-111 does not override it
  (`debris/config.ts`, `walls/src/debris/caps.ts`). One layer is one source, so beyond 128
  layers new sources lose their cosmetic debris until the cap is raised. Material edits are
  unaffected.

What grows with damage, bounded per layer:

- Hole records: 125, then breaches recycle them. Leaves: refinement stops at `minCell`
  0.12 m and `maxDepth` 5. A 2 x 1.2 m slab saturated by 400 rails held 124 holes, 62 leaves,
  41 blocker boxes and 7,877 surface triangles (tunnels excluded), at 0.11 ms per shot.
  Measured.

Fixed pools, independent of object count: sec-111 debris tiers 64 Physics, 512 JohnWoo,
256 Dumb, 2,048 Dead; 70 fragments per event; 17 rail or 70 blaster seeds per shot; two
falling islands (objects only). Verified: sec-111 walls `KNOWLEDGE.md`, sim `config.ts`.

sec-111 bounds that count objects today:

- `tools/level-prep/src/walls/input.ts`: `MAX_WALLS = 32`.
- `engine/level-data/src/codec/schema.ts`: `LIMITS.walls = 64`.
- `engine/walls/src/blockers/blockers.ts`: 4 layers per assembly, 256 chunks per layer.
- `engine/walls/src/hits/hits.ts`: 32 pending tokens per tick. This bounds hits, not objects.
- `games/arena/src/recording/walls/codec.ts`: exactly 13 layer slots in 6 walls, one-byte
  wall, layer and slot ids, at most 96 definitions and 48 observations per frame.
- `engine/level-data/src/contract/bodies.ts`: ragdoll statics share 1,024 Jolt bodies with
  162 ragdoll bodies and up to 512 body boxes (226 today); each wall adds one.
- `engine/walls/src/blockers`: one character-world box per retained leaf, one per chunk
  while intact.
- `engine/wall-view`: one unculled, shadow-casting mesh per chunk per layer, plus two gib
  batches and one rim batch per layer allocated at full capacity. Verified: `chunk-meshes.ts`,
  `detail.ts`, `gibs.ts`, `presets.ts`. At today's single-layer capacities (500 gibs twice,
  1,000 rims) and three.js's 76 bytes per instance that is 152 KB per slab (byte size
  inferred). Today's six walls draw 183 chunk meshes, the only browser-proven load.
- `WallsWorld.captureMaterials()` deep-compares every layer, and the arena calls it per
  recorded frame and per wall commit. Verified: `material/capture.ts`, arena `session.ts`,
  `transactions.ts`.

Recommended ceiling for one level:

- Format hard cap: 1,024 slabs. Destruction lib costs were measured to that count.
- First-pass budget: 600 slabs in at most 150 props.
- Per slab: face area at most 25 m2 and at most 256 chunks. 25 m2 keeps the 125-hole cap at
  the density sec-111 already ships (7 x 3.2 m walls); split longer runs into segments.
- Triangles: 600 slabs average under 50 intact triangles, about 30,000, a sixth of the
  186,000 headroom.

What "everything destructible" therefore allows: the triangle cap and destruction lib leave
ample room; a full dressing of two assembly lines, storage and cranes fits 600 slabs (count
in section 6). The cost is sec-111 work at adoption. If that work is cut, merge instead:
one thick slab per prop part divides the count by three to five and adds dead edges.

Inferred, not measured: sec-111 frame cost at 600 slabs. Without batching, the section 6
dressing means roughly 1,800 chunk meshes, ten times the proven load.

## 4. The sec-111 gap

Supported today (Verified: `level-data/contract/level.ts`, `walls/assembly/assembly.ts`,
`level-prep/walls/rules.ts`):

- Representation: layered walls only. `WallHits` and `DebrisStage` call `registerWall`
  alone; nothing constructs an `ObjectModel` or `SheetModel`.
- Presets: thin-wood, thick-wood, gyprock, brick, concrete, each with a fixed layer count and
  thickness (`WALL_BUILDS`). No metal preset and no metal finish in `wall-view`
  (`PRESET_FINISHES`).
- Placement: `{ preset, width, height, position, yaw }`. Yaw about +Y only. The engine
  honours `position[1]`, so elevation is blocked only by level preparation, which places
  every wall on a floor from an `[x, z]` centre. It also rejects walls nearer than 3 m to a
  static box or another wall, and nearer than 6 m to a spawn.

Changes sec-111 needs for slab props. Sizes are rough lines of TypeScript without tests;
for scale, `engine/walls/src` is 2,110 lines, `engine/wall-view/src` 2,551, arena
`recording/walls` 1,100 (counted with `fd -e ts`, tests excluded, `wc -l`).

1. Level contract and codec (150 to 250). Replace `WallPlacement` and `WALL_BUILDS` with the
   slab description: explicit thickness, material, quaternion, colour, prop grouping. Raise
   `LIMITS.walls`. The schema id stays and the shape is replaced in place, per that
   package's rule.
2. Level preparation (300 to 400). Read the level-designer `.json` in place of
   `walls.json`; drop `MAX_WALLS = 32`; replace the floor-only placement rules (touching
   slabs of one prop break the 3 m gap rule, elevated slabs break `off-floor`); build
   navigation obstacles from rotated boxes at their real heights (`wallCorners` assumes
   yaw and a floor base).
3. Walls engine (200 to 300). `buildAssembly` takes a full rotation and per-slab material
   and thickness; one slab is one single-layer assembly, which keeps blocker ids and the
   four-layer shot rule valid; raise `maxEventSources` to the layer count; scale gib and rim
   capacity with slab area. Hit tokens, edits, blockers and seed conversion already work in
   the layer's rigid frame (`BlockerSet` carries a quaternion; `localHit` inverts the layer
   rotation).
4. Incremental capture (about 50). `captureMaterials` skips layers whose mutation epoch did
   not move.
5. Wall view (500 to 800). A metal finish and debris family; looks keyed by material, not
   preset. Draw undamaged slabs without per-chunk meshes, for example from the level `.glb`
   until a slab's first damage, then hide that part and build its layer view. The game must
   never draw both the `.glb` copy and the layer view. This is the largest unknown and needs
   browser QA.
6. Characters (about 60). `wallBox` assumes yaw; compute the box of a rotated slab, and add
   one static per prop, not per slab, to stay inside the Jolt budget.
7. Arena recording and replay (400 to 700, plus fixtures). The codec's 13 slots, 6 walls,
   byte ids and per-frame bounds become a variable layer count; the stored placement loses
   `preset` and `yaw`. Removing the six old walls alone already breaks the fixed 13.

Solids and sheets (not recommended, 4,000 to 6,000 lines). They need a second engine path:
object hit records and edits, severing follow-ups each tick, falling islands, support
retirement, character blockers from coarse proxies, object views (the demo's object and
sheet renderers are 1,090 and 1,176 lines), and an exact recording codec for records and the
dead mask. Sheets also break the recording's cross-host exactness.

## 5. Proof without a browser

Recommendation: one data-driven Bun test in level-designer over the authored level `.json`,
using destruction lib directly. It must not use sec-111's walls engine, which cannot place
rotated or elevated slabs yet.

For every slab:

1. Admit: `new WallModel(...)` from the description through the one shared builder function
   the level designer also uses for meshing. Construction validates sizes, material and
   configuration.
2. Register: `scene.registerWall(model, { position, rotation })` in a `CollisionScene`
   holding this slab alone (register, test, `scene.remove`). Touching siblings and an
   enclosed core would otherwise win the cast.
3. Aim: cast a world segment onto the centre of a depth face from 0.2 m outside it, inside
   `scene.prepare()` and `scene.endBatch()`. Assert a hit whose `obstacle` is this slab's
   handle. This proves the stored pose places the material where the cast expects it.
4. Rail: convert the contact to slab-local with `toLocalPoint` and `rotateVector`, call
   `model.collectDamage(hit, "rail", false, createDamageBudget())`. Assert `applied` and
   `changed`, and `model.materialAt` false at the hit point.
5. Blast: `collectDamage(hit2, "blaster", ...)` at a second face point. Assert `changed`,
   `materialAt` false there, and that `snapshotRetainedCuboids(model)` differs from the
   intact snapshot, which is what opens character blockers.

Once for the whole level: register every slab in one scene, then
`RapierBackend.create(...)` and `backend.syncScene(scene)`, to prove every coarse proxy
cooks.

Cost. Verified by `probe-proof.ts`, which runs exactly this recipe: 1,000 slabs of random
size (0.2 to 12 m wide, 0.02 to 0.3 m thick), random full rotation, random elevation and
four materials passed with no failure in 225 ms; the whole-level build and Rapier sync took
61 ms for 7,187 colliders. The probes import destruction lib by path from outside its
repository, so level-designer can link it the way sec-111 does (tsconfig paths to the
sibling source).

Alternative: assert only that models construct. It lost because construction does not prove
a face can be reached or that damage changes material.

## 6. Object model for the first pass

All props use slabs. Thin panels (0.02 to 0.05 m) form hollow boxes; every outward face is
then a depth face and takes SMG rails. Join panels with butt joints so slabs do not overlap.
The layouts are proposals; triangle figures are intact counts from the measured per-chunk
rule at core's default chunking.

- Conveyor segment, 4 x 0.8 x 0.9 m. Metal. One horizontal deck and two full-height side
  skirts: 3 slabs, about 90 triangles. Rollers and legs are omitted; the skirts read as
  the frame. Segments up to 12 m keep the same slab count.
- Machine enclosure, 3 x 2 x 2.4 m. Metal, or concrete for a plinth. Four sides and a roof:
  5 slabs, about 200 triangles. The inside is empty; add one concrete block slab as a core
  if a holed enclosure looks hollow.
- Robot arm, static pose. Metal. Pedestal box of four sides and a top, then one thick slab
  (0.15 to 0.3 m) each for shoulder, upper arm, forearm and head: 9 slabs, about 110
  triangles. Diagonal links need the full rotation the format stores.
- Storage container, 6 x 2.4 x 2.6 m. Metal. Four sides and a roof: 5 slabs, about 250
  triangles. Wooden crate, 1.2 m cube: 5 slabs, 60 triangles. Brick or concrete partitions
  and plinths are single slabs and give the four materials a place in the dressing.
- Bridge crane with runway beams. Metal. Each runway beam and each bridge girder is an
  inverted T: one vertical web and one horizontal bottom flange, so shots from the floor
  meet the flange face and shots from the side meet the web. Two runway beams (4 slabs),
  two girders (4), two end trucks (2 thick slabs), trolley box (5), hook block (1): 16
  slabs, about 1,500 triangles for 30 m beams. Beams longer than 40 m split into pieces.
- Jib crane. Metal. Mast box of four panels, boom web and flange, tie rod, hoist, base
  plate: 9 slabs, about 200 triangles.

A full dressing at these counts: two lines of 12 conveyors, 8 enclosures and 10 arms
(356 slabs), 12 containers and 20 crates (160), two bridge cranes (32), four jib cranes
(36): 584 slabs, about 16,000 triangles.

Awkward props and their simplifications:

- Robot arm. Thin, round, articulated links suit capped cylinders, which sec-111 cannot
  carry. A thick slab takes SMG rails only through its two large faces (probe: edge rail
  rejected, edge blast accepted). Orient those faces across the line, toward the aisles
  players shoot from. A punch destroys a link from any side.
- Cranes. Slabs never collapse: a girder cut in two keeps both halves in the air, and a
  trolley stays up when its girder is gone. Runway beams must visibly rest on the existing
  structure or on destructible columns, which also float once shot away.
- Containers and belts. Settled debris ignores slabs as support and lands on the floor
  below a roof or deck (`castSupport` ignores walls; collision `KNOWLEDGE.md`). Flying
  debris still bounces off slabs.
- Cables, rollers, railings, small pipes. Too thin for a 7.5 cm rail hole and a 0.28 m
  punch to read well. Omit them or fold them into a panel's colour or texture.

Alternative: capped cylinders for masts and arm links plus a new box base in destruction
lib. It lost on three counts: destruction-poc is read-only in this operation, sec-111 has
no object path (section 4), and a cylinder costs 230 to 1,950 intact triangles against a
slab's 12 to 44.

## Risks to binding decisions

- "Every dressed object is destructible": feasible with slabs and the three accepted limits.
- "Old walls removed": the arena recording codec asserts exactly 13 layers in 6 walls.
  Removing the six walls requires the recording change even before any prop is added.
- "The approved mood is the mood the game shows": at risk for destructible surfaces.
  sec-111 draws walls with procedural finishes computed in layer-local metres, without UVs
  or textures, and has no metal finish. The QA app would show the `.glb` materials instead.
  The architect should decide which side owns the look of an undamaged slab before art
  approval; change 5 in section 4 is where sec-111 would honour it.
- "Until then sec-111 stays untouched": compatible. The headless test and the mesh
  generation need only destruction lib.

## Not checked

- Any browser, GPU or frame-time behaviour; all sec-111 rendering costs are inferred from
  source.
- rendering-poc, anim-poc (the Jolt body budget is taken from a level-data comment) and
  arena-sim's use of walls beyond its query port.
- Statue baking, and sheet or solid behaviour beyond one rail and one blast each.
- Recording record sizes at hundreds of layers; only the codec's stated bounds were read.
- No test suite of destruction-poc or sec-111 was run.
