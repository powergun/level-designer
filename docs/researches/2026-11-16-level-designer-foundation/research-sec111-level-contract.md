# sec-111 level contract: research report

Scope: the contract between level designer output (`.glb` + `.json`) and sec-111. Read-only
research; no repository was written. Lengths are scaled metres unless marked "stage units".
Statements are verified (read in the named file, or measured by the named probe) unless a
line starts with "Inferred:". Section 9 lists the probes and what was not checked.

## 0. Recommendations in one place

1. GLB: copy the base node tree verbatim under one new root, append new object nodes, write
   matrix transforms only. Today's level-prep then accepts the file, and the renderer's
   audit of the base meshes still holds; new materials need audit entries at adoption.
2. Hall numbers: derive them at build time from the prepared level and the GLB.
3. Sealing: add a visible end wall, four window panels, one door panel and a back slot
   fascia. sec-111 keeps its closure slabs as invisible backstops and retires only the
   rendered end wall.
4. Constraints: validate by outcome. Run `prepareLevel` on the dressed level and judge its
   result; keep a short list of geometric authoring rules for what the result cannot show.
5. Ownership: the level `.json` owns destructible objects and lighting; sec-111 keeps
   deriving everything else. Roles travel as node `extras` in the GLB.
6. QA collision: option (a), sec-111's level-prep plus physics, verified from outside the
   repository in about 20 lines of glue.
7. Linking: path-alias sec-111's raw sources through one gateway package. Usable packages:
   level-data, level-prep, physics, nav.

No binding decision is infeasible. Section 8 lists five consequences to plan for.

## 1. What sec-111 needs from the stage GLB

Evidence: `tools/level-prep/src/glb/{container,gltf,scene}.ts`, `survey/{stage,survey,planes}.ts`,
`engine/view/src/level/{audit,plan,build,load,end-wall}.ts`, `games/arena/serve/site.ts`,
`games/arena/docs/BROWSER.md`, probe `glb-tree.ts`.

The glTF subset level-prep admits (anything else throws):

- A glTF 2.0 binary container whose header length equals the file length, with one JSON and
  one BIN chunk; `asset.version` "2.0"; exactly one buffer; no `extensionsRequired`.
- The default scene only. Nodes may carry `matrix` (16 finite numbers); any `translation`,
  `rotation` or `scale` key is rejected. A missing name reads as "".
- Every primitive is mode 4 (triangles), has `POSITION` and has `indices` (non-indexed
  geometry is rejected).
- Every accessor in the file (not only positions) needs a `bufferView` and must be dense.
  `POSITION` is FLOAT VEC3; indices are unsigned byte, short or int, a multiple of three,
  each below the vertex count. Buffer views must name buffer 0; `byteStride` is honoured.
- Ignored: materials, textures, normals, UVs, `extras`, `extensionsUsed`, cameras, skins.
- Traversal is scene roots then children in document order, composing parent matrices. A
  mesh node's object identity is the name of its parent node.

Object names the survey depends on (`STAGE_OBJECTS`, the only semantic table):

- `Plane` (front floor) and `Plane.005` (ceiling): horizontal faces only, flat within 1e-4.
- `Plane.002` (raised back slab and ramp lip): a flat top plus sloped faces that descend
  toward +Z from the top's front edge.
- `Plane.014` (back wall): one plane of constant Z, within 1e-3 of the footprint's minimum
  Z; its top edge defines the open slot under the ceiling.
- Structure, each must exist, voxelised into `world.shell`: `Plane.001` (+X side wall, piers,
  window tunnels), `Plane.004` (-X side wall), `Plane.012` (sloped upper panels),
  `Plane.006` (roof trusses), `Cube` (door frame), `Cube.001` (door alcove), `Cube.002`,
  `Cube.004`, `Cube.005`, `Cube.007` (window frames).
- Every other object is a prop, voxelised into `world.prop`.

The base file as measured: 97 nodes (48 with matrices, none with TRS), 48 single-primitive
meshes under 46 objects, 113,697 triangles, unsigned-int indices, 11 materials (all
`doubleSided`), 11 images, `KHR_materials_emissive_strength` used, not required.
A pre-scaled copy passes today's survey: with every vertex multiplied by 3.89956 and
rounded to float32, `surveyStage` returns scale 1 and the same interior to within 3e-6 m
(probe `plane-tolerance.ts`). Inferred: one root node carrying the scale matrix gives the
same result, because the reader composes matrices in float64.

Other consumers of the stage GLB:

- Renderer (`@sec111/view`): loads it with three's GLTFLoader (no Draco, meshopt or KTX2)
  and merges meshes by material name, sidedness and vertex layout. Every material name
  needs an entry in `MATERIAL_AUDIT` (11 names: `Material`, `Material.001` to `.010`); an
  unknown name throws. `Material` is the fluorescent fixture; a stage without it throws.
  `KEEP_DOUBLE_SIDED` lists seven mesh names (three.js spelling, dots stripped). Mirrored
  transforms and duplicate mesh names throw. The view scales the stage root by
  `metrics.scale` and draws the end wall from `world.endWall`.
- Serving and content identity: `STAGE_FILE` (`assets/stages/old_factory_free.glb`) is
  served under the content namespace. Every file under `assets/` with extension glb, fbx,
  bin, json, wav, ttf or txt is a runtime asset, `walls.json` included. All their bytes
  enter content identity, and a recording opens only on an equal identity.
- Tests: `survey.test.ts` pins the real stage's plane facts; view level and lighting tests
  parse the real stage; `dev-server.test.ts` pins the served paths.

Recommendation: copy the base node tree verbatim and append to it. Alternative: re-export
the scene freely (flattened hierarchy, new names). It lost because it breaks parent-name
identity, the audit's material names and the double-sided mesh names, and exporters can
emit TRS.

## 2. The hall in numbers

Evidence: probes `stage-objects.ts`, `prepared-facts.ts`, `wall-profile.ts profile`,
`clusters.ts`, `free-rects.ts`; `tools/level-prep/src/shell/shell.ts`. Voxel-derived figures
carry +/- 0.2 m.

Frame and shell:

- Stage-to-world scale 3.89956. Origin and +Y up are the GLB's. -Z is the back, +Z the open end.
- Interior box: x [-16.67, 16.67], y [0, 18.70], z [-89.87, 30.32]: 33.33 wide, 18.70 high,
  120.19 long, 4,006 m2 of floor. It is the floor footprint, not the wall surfaces.
- Front floor: y = 0 for z > -28.14. Raised slab: y = 0.3241 for z < -29.23.
- Ramp: full width, z -29.23 (top) to -28.14 (foot), 1.09 run, 0.32 rise, about 16.5 deg.
  Collision uses four full-width steps, 0.273 deep, tops 0.284, 0.203, 0.122, 0.041.
- Back wall: z = -89.87, y 0.32 to 18.07. A 0.63 slot stays open up to the ceiling, which
  is at y = 18.70 and reaches z -91.35 to 30.32.
- Open end: z = 30.32, the full 33.3 x 18.7 section (623 m2). Side walls stop at 30.32,
  trusses at 30.63, sloped panels at 31.44.
- Side walls: inner face at x -15.86 to -16.39 (-X) and 16.14 to 16.67 (+X), up to y 13.66.
  Above, sloped panels lean inward from |x| 15.89 at y 12.63 to |x| 13.86 at y 18.2; in
  three 2.2 m recesses per side they stand 1.25 further out, from |x| 17.14 to 15.11.
- Piers: six per side, about 2.9 long in Z, at z [-78.9, -76.0], [-58.8, -56.0],
  [-38.6, -35.8], [-18.6, -15.6], [1.6, 4.4], [21.8, 24.6] (pitch 20.2). Faces at x -14.85
  and +15.12 up to y 10.4; corbels reach x -14.1 and +14.4 from y 10.4 to 13.66. Clear
  width is 29.97 between pier faces and 28.5 between corbels.
- Whole-file bounds are far larger: x [-43.12, 37.58], y [-8.63, 26.37], z [-95.75, 31.44].

Overhead:

- Trusses (`Plane.006`): y 16.28 to 17.94, x -13.24 to 14.54. Cross frames near z -89.8,
  -87.8, -69.9, -64.7, -62.8, -44.8, -39.6, -37.7, -19.7, -14.5, -12.6, 5.4, 10.6, 12.5, 30.3
  (bay 25.2). Clear height under them is 16.28.
- Fixtures (`Cube.020`): emissive strips at y 17.0 in three columns (x -8.75, 0.53, 9.82)
  and nine rows inside the hall (z -88.4, -68.4, -61.2, -41.2, -34.0, -14.0, -6.9, 13.1,
  20.3). Their rods rise through the ceiling to y 26.37.
- Decks: `Plane.008` full width, y 6.08 to 6.34, z [-84.98, -66.58]; `Plane.007` full width,
  same height, z [-47.72, -29.32]; `Plane.013` upper deck, x [6.08, 16.67], y 11.89 to
  12.15, z [-47.72, -29.32]. All sit above the 3 m body band.

Floor-standing blockers (body-world islands; object in brackets):

- -X wall strip: x < -16.1 on the slab, with the piers at -14.8 and tubes reaching -13.9
  and -13.4; x < -14.7 from the ramp to z -2.5 (a row of tubes, `factory_tube_20.001`);
  x < -16.1 beyond, with the piers at -14.7. Tanks reach x -9.8 at z [-58.4, -55.7] and
  z [-12.7, -8.7] (`factory_tube_16.*`). Pipe columns at x [-14.1, -12.9], z -19.6, -11.9
  and 5.3.
- +X wall strip: x > 16.2 along the hall, with the piers at 15.0 to 15.1, and x > 12.1 at
  z [-17.2, -14.4] (`factory_tube_11.001`).
- Slab island A: x [-3.3, 13.5], z [-83.7, -65.0] (tanks, crates `Cube.019`, partitions,
  `factory_tube_03.001`), under the back deck.
- Slab island B: x [-2.7, 11.9], z [-47.2, -34.3] (crates `Cube.011` to `.017`, partition
  `Plane.009`), under the front deck.
- Back tower: x [3.7, 8.0], z [-89.9, -85.0] (`factory_tube_11.002`, up to y 21.1).
- Ramp top: posts at z [-30.7, -29.8] near x -1.6, 4.1 and 10.0; pipe stacks on the ramp at
  x [5.7, 8.6] and x [10.5, 12.4].

Spawns (derived feet positions): player (0, 0, -22); minions +x+z (10.5, 0, 25.75), -x+z
(-10.25, 0, 25.75), +x-z (12, 0.3241, -85.75), -x-z (-10, 0.3241, -85.75).

Free floor for bodies, ignoring the six walls: 3,299 of 4,006 m2. Largest free rectangles:

- Front floor: x [-9.8, 12.0], z [-28.1, 30.3] (21.8 x 58.4, 1,270 m2); then
  x [12.0, 14.9], z [-14.4, 30.3] and x [-12.8, -9.8], z [-8.7, 30.3].
- Slab: x [-9.8, 14.9], z [-65.0, -47.2] (24.6 x 17.8, the cross lane); x [-13.3, -3.3],
  z [-89.8, -65.0] (10.0 x 24.8, west lane); x [-14.7, -2.1], z [-45.8, -29.3] (12.6 x 16.5);
  x [-2.1, 16.1], z [-34.3, -30.7] (18.2 x 3.6); x [8.9, 16.0], z [-89.8, -81.4];
  x [-3.3, 3.7], z [-89.8, -83.7].

The six walls to remove stand at (x, z) (6, 16), (-6, 3), (5, -15), (-8, -38), (7, -53),
(-2, -60); each is 5.5 to 7 wide and 3.2 high.

Recommendation: level designer derives these facts at build time (interior, floors and
spawns from the prepared level; object bounds from the GLB). Alternative: a hand-written
constants module. It lost because every number above already has an owner in sec-111.

## 3. Sealing

Evidence: probes `leak-map.ts`, `wall-profile.ts void`, `slice.ts`; `shell.ts`;
`engine/level-data/docs/KNOWLEDGE.md`; `engine/physics/docs/KNOWLEDGE.md`;
`engine/view/src/level/end-wall.ts`; `engine/view/docs/scene.md`.

What is open in the source factory:

- +Z end: the whole section. From eye height, rays escape through 535 m2 of that face and
  through nothing else of note.
- Four window tunnels, two per side: z [-82.1, -72.0] and z [-42.8, -32.4], y 6.22 to 11.66
  (about 10.2 x 5.4). Each runs out to a backplate at x -43.12 or +37.58, so no void shows.
- One door alcove on +X: z [-15.2, -8.0], y 0 to 7.4, capped at x 33.0. It is at floor level.
- Back slot: y 18.07 to 18.70 across the full width at z -89.87 (13 m2). It leads outside.
- Three 2 m recesses per side in the sloped panels (z [-63.8, -61.6], [-32.4, -30.4],
  [-1.0, 1.0]) are capped; no ray escaped through them. Floor and ceiling are closed.
- Side walls are single-sided skins. No ray escaped through -X. On +X, 72 of 2.1 million
  rays escaped along y 13.5 to 14.5. Inferred: a slit of about 0.1 m between the wall top
  (y 13.66) and the sloped panel above it; the 0.2 m raster cannot size it.

How sec-111 closes each today:

- +Z: `world.endWall`, x [-17.67, 17.67], y [-1, 19.7], z [30.32, 31.32]. Visible: the view
  draws a cladding box with a dim glow. It casts no shadow so the sky light enters through it.
- Windows and door: invisible. Two side closure slabs, 1 m thick, cover the whole -X and
  +X faces of the interior box. A ray that hits one reports `visible: false`.
- Back slot: an invisible strip, y [18.07, 19.7], z [-90.87, -89.87]. The ceiling, back
  wall and floor are exact 1 m slabs in `world.shell`.
- Bodies: `bodies.enclosure` holds the ceiling, back wall, strip, both side slabs and the
  end wall. Audio treats the interior as one closed room.

What "fully seal with visible, indestructible geometry" requires in the output GLB:

- An end wall over x [-16.67, 16.67], y [0, 18.70] near z 30.32, with its inner face a few
  centimetres inside the interior so the voxeliser sees it (geometry outside the interior
  box is clipped away), and its outer extent covering the wall and panel ends.
- Four window panels and one door panel, flush with the wall's inner face (inside the box).
- A fascia over the back slot, and a strip over the +X wall-top slit if QA sees light there.
- The four named planes stay untouched, so the survey still measures the same interior.
- Seal geometry is static. Inferred: placed on the boundary it costs few or no body boxes,
  because it merges with the existing enclosure and wall islands.

Recommendation: sec-111 keeps the three closure slabs and the +Z slab as invisible
backstops, proven by the existing "no ray escapes" test, and retires only the rendered end
wall. Visible seals stand in front of them, so every reachable hit is a visible shell hit.
Alternative: delete the closures and trust the GLB to be watertight. It lost because it
swaps a cheap proven invariant for a new watertightness proof.

Inferred: "no daylight enters" also needs a view change. The view's fixed light set has a
sky light from +Z, a daylight spill near the end wall and a cold environment lobe.

## 4. Constraints dressing must respect

Evidence: level-prep sources `bodies/hull.ts`, `spawns/spawns.ts`, `walls/{rules,input}.ts`,
`navmesh/bake.ts`, `prepare/prepare.ts`; level-data `contract/bodies.ts`, `codec/schema.ts`;
`engine/walls/src/blockers/blockers.ts`; probes `body-budget.ts`, `prep-timing.ts`.

Static geometry (the base and the seals; everything level-prep voxelises):

- Body box budget: floors + obstacles + enclosure <= 512. Today 226 (6 floors, 161
  standing prisms, 53 overhead boxes, 6 enclosure). Measured cost of one added static
  footprint: axis-aligned rectangle +1; 1.5 x 12 box yawed 15 deg +33, yawed 45 deg +87;
  disc of radius 0.5 +3, radius 1.5 +9. Rule: keep static footprints axis-aligned.
- Detailed boxes: <= 50,000 per role (today shell 881, prop 3,396). Document <= 8,388,608
  characters (today 281,951). Navmesh <= 16 MiB (today 130,516 bytes).
- Standing band: a part between 0.01 and 2.17 above its local floor turns its plan cells
  into a solid prism from the floor up 3 m. A part only between 2.17 and 3.0 becomes an
  overhead box: bodies pass under, ragdolls hit it. Above 3.0 only rays and debris see it.
  Rule: hang static parts at 3.0 or higher, or accept a full-height blocker beneath them.
- Gap closing: static gaps up to 1.4 wide are filled; free cells always lie in a free
  1.5 square. Rule: a static lane must be at least 1.5 wide after rasterisation. Inferred:
  author 2.1, because voxels (0.2) and plan cells (0.1) can each grow an edge.
- Flood seed: the cell at the interior centre (0, 9.35, -29.78) must be free of static
  geometry, or preparation throws. No new walkable level: level-prep builds only the base
  floor, slab and ramp.

Destructible objects (today's wall rules, which the dressing inherits or replaces):

- Inside the interior, on one floor level; never across the slab edge or ramp
  (z -29.23 to -28.14, full width).
- At least 6 m (footprint distance in XZ) from every spawn.
- Today at least 3 m from static boxes in its height band and from every other wall.
  Inferred replacement for dense dressing: every gap is either under 0.7 (the 0.72 player
  capsule plus skin cannot enter) or at least 1.5 (navmesh keeps 0.6 clearance per side).
  A gap between those lets the player stand where no minion can path. Main lanes: 3 m, the
  wall gap already proven in QA.
- Headroom: the navmesh needs 2.05 clear; the player capsule is 1.87. Rule: an underside is
  either at 2.17 or higher, or the object is treated as standing on the floor. Crane parts
  at 3.0 or higher touch no body.
- Low tops: physics autostep and navmesh climb are both 0.2. Avoid tops at or below 0.2.
- Counts: level-prep admits 32 walls and the codec 64. Blocker ids reserve four layers per
  assembly and 256 chunks per layer. The debris source tracker holds 128 sources (one per
  layer) and each assembly has a 500-gib budget. These are wall-family limits.
- Inferred, hiding: a baked footprint stays a navigation obstacle after destruction, about
  0.6 beyond its edge. Minion reach is 1.1 centre to centre. A player standing more than
  about 0.5 inside a cleared footprint is out of reach. Today's thickest wall is 0.6.
  Rule: keep a destructible's narrow footprint dimension near 1.0 or less, or accept the spot.

Navigation and spawns:

- Spawn clearance: body radius + 0.5 (player 0.86, envelope 0.92) within the body's height,
  searched on a 0.25 grid within 8 m of the floor centre and each corner. Failure throws.
- Connectivity: the bake keeps only polygons connected to the player spawn. Measured: 574
  of 890 reachable with the six walls, 453 of 769 with none.
- Coverage contract: every floor point where the player can stand lies within 0.55
  horizontally and 0.3 vertically of reachable navmesh. sec-111 proves it in
  `tools/level-prep/tests/hiding.test.ts`; no library function exposes the check.

Checkable in level designer without running sec-111 code: interior and floor-zone
containment, gap bands, underside and top heights, footprint widths, object counts, the
seed cell, and distances to the spawns once they are known. Public constants come from
`@sec111/level-data` (`PLAYER_BODY`, `MINION_SIZES`, `BODY_BOX_LIMIT`, `NAVMESH_COVERAGE`,
`floorHeightAt`). The band, closing, clearance and gap numbers are private to level-prep.
Needing sec-111 code: box counts, spawn positions, navmesh connectivity and coverage.

Recommendation: one validator calls `prepareLevel` and judges its result (no throw, box
counts, spawns, reachable polygons, routes from the four minion spawns). A second holds
the geometric authoring rules. Alternative: re-implement the band, closing and clearance
logic in level designer. It lost because it duplicates private sec-111 numbers that would
then drift.

## 5. The adoption contract

Ownership:

- The level `.json` owns: its schema id; the destructible objects (identity, destruction
  lib model description, transform, the GLB node that draws it if any); lighting.
- sec-111 keeps deriving: scale (1 for a scaled-metres GLB), interior, floor heights, both
  collision worlds, spawns, the navmesh and the acoustic faces. They are functions of the
  geometry and of body constants that `@sec111/level-data` owns.
- Spawns stay derived. Seals sit on boundaries the enclosure already blocks. Inferred: a
  seal that thickens a boundary can move a spawn by one 0.25 grid step. Level designer
  reads spawns from the prepared result. Alternative: author spawns in the `.json`. It lost
  because level-prep would still re-validate them, giving the fact two owners.

Identification in the GLB:

- Put the role in `extras` on the object node (the parent of the mesh nodes, the level
  level-prep already reads names from): `seal`, or `destructible` with the object's id.
  Base nodes keep their names and carry no role.
- Today's reader ignores `extras` and accepts the file. At adoption, level-prep voxelises
  `seal` nodes into `shell` and skips `destructible` nodes. Three's GLTFLoader copies
  `extras` to `userData`, so the view can read the same roles.
- Alternative: name prefixes. It lost because names already carry a second meaning (the
  stage-object table and the renderer's name-keyed audit) and the loader rewrites them.

sec-111 changes adoption needs (S: hours; M: one to two days; L: several days). sec-111
keeps no compatibility readers: each shape is replaced in place and the pair regenerated.

- Level-prep inputs (S): `PrepareInputs` becomes the GLB plus the level `.json`;
  `walls.json` is deleted; the pair is copied into `assets/stages/`.
- GLB reader and survey (S to M): read the role from `extras`; skip destructibles; treat
  seals as structure.
- Destructible placement and bake (M): parse objects from the `.json`, apply the placement
  rules, bake intact solids into the navmesh as walls are today.
- Shell and codec (M): drop the rendered end-wall role, replace `walls` with the new object
  list, revisit the 64 and 32 limits. Touches level-data, physics static level, view,
  walls debris boxes, characters and arena queries (about 18 non-test source files name
  `endWall` or `closure`; 42 name wall types).
- Runtime destructibles (L or more): the walls package, wall views, ragdoll statics and the
  recording codecs handle only layered wall slabs. Size depends on the destruction lib
  model families chosen; that research is separate.
- Removing the six walls (M to L): tests in walls, wall-view, nav, level-prep and arena
  read walls from the committed level and need new fixtures.
- Freshness and property tests (M): regenerate the pair; 26 files read the committed
  level. Tests pinned to base geometry keep holding; tests pinned to wall positions change.
- View (M to L): audit entries for new materials, end wall removal, lighting from the
  `.json`, `STAGE_FILE`. With scale 1, `arenaLook(scale)` and `arenaLighting(scale)` lose
  the 3.9 factor they multiply haze, x-ray fade and light placement by.
- Served assets (S): new files under `assets/` are inventoried by extension; update the
  path constants and `dev-server.test.ts`.
- Recordings (S; L if new model families must be recorded): content identity changes, so
  every existing recording stops opening. The repository holds no committed recording.

## 6. Collision for the QA app

Recommendation: option (a). A level designer command calls `prepareLevel` on the dressed
GLB with an empty wall list; the QA app decodes the pair with `decodePreparedLevel` and
walks `createPhysicsWorld(level, 1 / 60).createPlayer(spawn)`. Fly mode needs no collision.
The GLB given to `prepareLevel` must hold the intact dressing meshes, or QA walks through them.

Verified by probe `walk-probe.ts`, run from outside the repository with path imports:

- `prepareLevel` takes about 3.0 s and does no file I/O; sec-111's worktree stayed clean.
- The physics world is ready in 37 ms. The capsule climbed the ramp onto the slab and
  stopped at the crate faces the body world holds.
- The same run yields spawns, box counts and the navmesh that the section 4 validator needs.

Cost: the gateway of section 7, one prepare step per level build, Rapier in the QA bundle.

Risks to "thin and lean":

- Before adoption level-prep knows no destructibles, so dressing in the GLB is voxelised
  as static props. QA then walks a conservative version: gaps under 1.5 close and low
  objects become 3 m prisms. A plausible axis-aligned first pass measured +31 to +47 body
  boxes; long yawed objects cost +33 to +87 each and can break the 512 budget.
- The dependency is live: a sec-111 working change can break level designer's build.
  Rapier and three must resolve to one copy each (section 7).
- The GLB must satisfy today's reader subset before adoption. That is the contract of
  section 1, so it is a constraint worth having early.

Alternative (b), level designer's own collision from the GLB (a triangle mesh or box set
with its own controller). It lost because it walks a different world: the human could pass
gaps and climb treads that the game closes, so QA marks and approvals would not transfer,
and the spawn, budget and navmesh checks would still need sec-111 code.

## 7. Dependency mechanics

Usable from another repository (each is a private workspace package that exports raw
TypeScript through `"exports": "./src/index.ts"`; none is built or published):

- `@sec111/level-data`: browser-safe, no dependencies. Contract types, body constants,
  codec, `floorHeightAt`. Its `/testing` entry reads only sec-111's own committed pair.
- `@sec111/level-prep`: `prepareLevel`. Depends on level-data and `recast-navigation`
  0.44.0. Hard-wired to the stage object names and the wall file format.
- `@sec111/physics`: browser-safe. Depends on level-data and
  `@dimforge/rapier3d-simd-compat` 0.21.0, the version destruction-poc pins.
- `@sec111/nav`: browser-safe route and slide queries over the prepared navmesh.
- Not usable for a dressed level: `@sec111/view` (fixed stage path, name-keyed material
  audit, end wall, fixed light set).

What linking requires:

- sec-111 must be installed. Its packages import each other through `workspace:*` links
  and resolve Rapier and Recast from sec-111's own `node_modules`. Verified: scratch
  scripts importing the three packages by path ran under Bun.
- Recommendation: one gateway package maps each used entry to the sibling source with a
  path alias and re-exports only what level designer uses, as sec-111's root link map does
  for its own siblings. Bun-side and browser-side entries stay separate.
- One runtime copy of three and of Rapier, through a resolver rule like sec-111's linkage
  plugin and test preload. Pins already agree: three 0.186.1, Rapier SIMD 0.21.0.
- Inferred: sec-111 sources type-check under level designer's compiler settings, which
  match sec-111's; Recast's declarations then come from sec-111's patched install.
- Alternative: a `file:` dependency copied at install, as skin-designer links anim-core.
  It lost because these packages depend on `workspace:*` siblings, Recast's declarations
  need sec-111's install patches, Windows hard links need a detach step, and a copy goes
  stale silently. The price of the alias is that a sec-111 working change is live input.

## 8. Consequences for binding decisions

- "sec-111 stays untouched until QA passes" with "every dressed object is destructible":
  the game has no non-wall destructible today, so QA collision treats dressing as static
  (first risk in section 6).
- "No daylight enters": the view's sky light enters through the end wall by design; it
  needs the view change in section 5.
- "Output in scaled metres": `metrics.scale` becomes 1, and the view uses that number as a
  tuning multiplier; same view change.
- "New dressed objects supply all cover": wide destructibles leave unreachable footprints
  once destroyed (section 4, hiding). Inferred, not tested.
- Object counts above 32 need sec-111's limits raised; the 128-source cap is inherited
  from destruction-poc.

## 9. Evidence and gaps

Probes were read-only scripts, run as `mise exec -- bun <script>` from sec-111's root.
They lived in a session scratch directory outside every repository and are not kept:

- GLB and hall: `glb-tree.ts`, `stage-objects.ts`, `prepared-facts.ts`, `free-rects.ts`,
  `clusters.ts`, `plane-tolerance.ts`.
- Openings: `leak-map.ts`, `wall-profile.ts` (modes `profile` and `void`), `slice.ts`.
- sec-111 code from outside: `prep-timing.ts`, `walk-probe.ts`, `body-budget.ts`.

Not checked:

- No browser, renderer or visual inspection. Openings were measured on a 0.2 m raster.
- Type-checking and browser bundling of sec-111 sources from level designer; a `file:` install.
- The destruction lib's model families and budgets, and the renderer's lighting limits.
- `prepareLevel` on a real dressed GLB; costs come from synthetic boxes on the front floor.
- The hiding inference and the gap bands come from documented numbers; no test ran them.
