# Destruction lib's scene building and look development: research report

Scope: how destruction lib's demo builds a scene from destructible objects, how it does
look development with procedural materials, which of those mechanisms a consumer can
reach, and how the level designer can carry the method. Research only: no repository was
written. A statement is verified in the named source unless it is marked inferred.

The references are the demo's walls, pillars and spheres, as the owner named them. The
study takes nothing from the demo's statues or its curved sheets. The sibling report
`research-dark-factory-surfaces.md` covers the reference images and the surfaces to reach.

## Findings in brief

1. The demo is the range "Wall Lab", subtitled "Hong Kong Noir / 1991": the private
   package `@destruction/demo`. The repository holds no other demo.
2. Its scene is a specimen range: 40 wall layers in 20 panels, three pillars and 30
   spheres among static boxes. It never composes a prop from several destructibles.
3. Its efficiency is a discipline: preset tables, shared materials, full-capacity batches
   before play, bounded rebuilds, one cached shadow and draw counts pinned by tests.
4. A procedural material there is a shader graph with no texture and no texture
   coordinate. A painter turns a position in metres into albedo, roughness, relief and
   metalness.
5. One painter owns the original surface and the exposed interior. Walls tell them apart
   by geometry; pillars and spheres by a surface class from the mesher.
6. A thick wall is a stack of layers, and a pillar or a sphere is a solid that takes
   damage in depth and can sever. A thick slab does neither.
7. The library publishes geometry and colours only. Painters are demo code; sec-111 ports
   four wall finishes. The one metal look is the sphere's.
8. In the game an intact slab draws from the GLB and a damaged one from sec-111's wall
   view, so a look must agree in both.
9. The form taken: shader painters defined as recipes of data, with baked tiles of at
   most 1,024 px as the fallback that the owner chooses if the shaders cost too much.

## Evidence base

Read in full, in destruction-poc: `README.md`, `docs/KNOWLEDGE.md`,
`docs/technical-design.md`, `docs/INTEGRATION.md`, `docs/DEVELOPMENT.md`; the demo's
README and its eight documents (`KNOWLEDGE`, `WORLD`, `ADAPTERS`, `LIGHTING`, `MATERIALS`,
`EFFECTS`, `QA`, `TAKES`); core's `KNOWLEDGE.md`, `DETAIL.md` and `OBJECTS.md`. Searched
for statements on colour, texture, finish and support, not read in full: the collision,
simulation, physics, profiler and tools knowledge, `TESTING.md` and the improvement
suggestions.

Demo source read, under `packages/demo/src`: `scene.ts`, `main.ts`, the `lab` tables and
mounts, `rendering/materials` except the gypsum painter, the wood boards and the wood
grain terms, the object materials, `rendering/wall.ts`, `resources.ts`, `renderer.ts`,
the lighting layout, hall, fixtures and rig, `image/pipeline.ts` and `modes/probe.ts`; in
its tests, `programs.ts`, the draw-count tests of `scenery.test.ts` and the test names of
the material suites. In core: the weapon responses of `debris/materials.ts`.

Read in sec-111: the two `engine/wall-view` documents on its looks, its `materials` and
`paint` facades, `looks.ts`, `surface.ts`, `chunk-meshes.ts` and `wall-views.ts`, the wall
presets of `engine/walls` and the stage material audit of `engine/view`. Read in
rendering-poc: `docs/rendering-contracts.md`.

Probes ran under Bun from this repository, as scripts in the session scratch directory
that are not kept; `git status --short` stayed empty here and in destruction-poc:

- demo counts: core's intact meshes of the demo's 40 layers and 33 pillars and spheres;
- base stage: the images, materials and vertex attributes of `old_factory_free.glb`;
- bake cost: one 1,024 px map of eight value-noise samples per texel, then zlib;
- the committed level's report: 133,793 triangles, 608 slabs, 127 props.

No browser ran, and destruction-poc commits no image of its demo.

## 1. The scene

### The destructible kinds

The references use two of core's representations. A wall is a `WallModel`: a slab that
keeps one retained depth interval per cell of its face. A pillar or a sphere is an
`ObjectModel`: a capped cylinder or a truncated ball minus removal records. The foundation
report `research-destructibles.md` describes both. The library has no preset, assembly or
prop type. A layered wall is several touching wall models under one root, and a preset is
a row of an application table: `LAB_PRESETS` and `OBJECT_PRESETS` in the demo, the wall
presets in sec-111.

### How the demo composes its scene

`setupScene` builds one hall, 44 m wide under a 9.6 m roof:

- 20 wall assemblies: five presets in four rows, each a 2.4 by 2.4 m panel of one, three
  or four layers. Every layer is its own `WallModel` with its own renderer: 40 layers.
- 33 pillars and spheres from one table: three pillars and three 1 m spheres on mounts,
  18 small spheres in three floor clusters and nine on the worktables.
- Static dressing: steel trim around each panel, sign plates, mounts, three worktables,
  columns, crates, and the hall shell with its windows. A comment states it outright:
  background architecture stays outside the destruction system.
- The light rig with its visible fixtures.

The demo never builds a prop from several destructibles. Its nearest forms are the
layered assembly and the sphere cluster. The level designer's prop kit, which closes
boxes from slabs, already goes beyond the demo; the demo teaches how to run many
destructibles cheaply, not how to shape them.

### Thick bodies: layers and solids

The demo answers thickness in two ways.

- A thick wall is a stack of layers. The 60 cm concrete panel is three 20 cm lifts and
  the 12 cm wood panel four plies. A shot takes one concrete lift; a wood blast edits all
  four plies under one budget. A hole shows the next layer.
- A solid takes damage in depth. A rail cuts along its ray up to a budget per material,
  0.2 m in brick and concrete, 0.12 m in wood and 0.06 m in metal, and leaves a blind
  floor beyond it. Rails at one spot dig a pit, and each blast deepens its crater.
- A solid takes a hit from any direction. A wall takes a rail only through a depth face.
- A solid can sever. Material cut off from the anchors at its base leaves at once: a
  small island crumbles into debris, a large one falls and shatters on contact. One blast
  that removes half of what remains shatters the whole body. A wall has no connectivity:
  the foundation report found that its detached material stays suspended.
- A solid can carry settled debris; the support cast ignores walls.

The props' thick links and partitions, and every slab of their masts and beams, are
single wall layers. One rail passes through a 0.4 m arm link, and a beam cut in two stays
in the air: the limits the owner accepted for slabs. The pillars and spheres show what a
solid does instead.

### What it does for efficiency

- One table per family. A row names the kind, the physics material, the finish, the
  palette, the seeds and the detail ceilings; scene setup, collision, QA stations and
  scripted takes all read the same rows.
- One material per finish. Walls share one surface and one detail material per finish,
  thickness and grain: six looks serve the 40 layers. A layer's own colours travel as
  vertex and instance colours.
- `StaticNodeMaterial` lets an unchanged draw skip three.js's per-frame refresh of a
  node material, which is safe only for graphs of static inputs.
- Every batch exists before play at its full capacity: gibs and rail rims per wall,
  object detail by finish, palette and shape, three active and three settled debris
  batches, two particle rings. An impact creates no geometry, attribute or batch.
- Small spheres of one cluster share one geometry and one draw; mount parts merge per
  material; fixture parts are instanced.
- One scheduler bounds rebuild and upload work per frame by a task ceiling and a soft
  deadline. Walls drop stale builds; solids finish immutable snapshots.
- One light casts a shadow, a 4,096 px map that renders only when a caster's installed
  geometry changed, at most every 0.25 s. The light set is complete before the warm-up
  compile and never changes.

### Counts and measures

Measured with core alone: the 40 layers mesh to 1,280 intact triangles, 32 a layer on
average. The 33 pillars and spheres mesh to 35,006: a pillar takes 1,014 to 1,846, a 1 m
sphere 3,406 and a small sphere 340 to 1,014. A curved body costs ten to a hundred times
a flat layer. For comparison, the committed level holds 608 slabs in 19,940 triangles
beside a stage of 113,853.

The demo states no triangle budget for its scene. Its caps bound single objects and
pools: 125 live rail holes per layer, 500 gibs per assembly, 1,000 rims per single-layer
wall, 131,072 triangles per object view, and fixed debris and particle pools. Its tests
pin what a scene costs to draw and to simulate: in one test six large solids, three
sphere batches and twelve mount meshes add 21 scene-pass draws within a stated allowance
of 80, the lab registers 74 collision obstacles, and its 64 event sources fit
simulation's source memory. In a browser the profiler samples draw calls, triangles,
renderer memory, debris populations, pending views, rebuild times and frame intervals
into downloaded reports. The repository commits no report.

## 2. The look

### What a procedural material is

A procedural material is a three.js node graph on a standard PBR material. No wall,
pillar or sphere carries a texture, a texture coordinate or a tangent. The unit of
authoring is a painter, a function of two records in `rendering/materials/surface.ts`:

- the frame: the authored tint, the position in the object's local metres, the local
  normal, a flag for original surface, the metres one pixel covers, and a seed;
- the shade: linear albedo, roughness, relief height in metres, and metalness.

`paintMaterial` wires a painter into the material's colour, roughness, metalness and
normal slots. The normal comes from the height's screen derivatives, a surface-gradient
bump in metres, and unresolved bump slope widens the roughness. The kernels in `noise.ts`
are arithmetic: lattice hashes, value noise, a fade that removes a feature before it
aliases, and box-filtered periodic bands. Together they replace texture mipmaps.

### How one is authored and parameterised

A painter states its features as constants in metres: a brick course of 75 mm with 10 mm
joints, concrete form panels and lift lines at 1.2 m with tie holes of 12.5 mm radius,
boards 150 mm wide, paint chips at 9 and 40 cycles per metre. A family varies through a
painter factory: `woodPainter` takes grain direction, board width and seam and glue
shades, and `paintedSteel` takes the paint colour and a wear amount. An instance varies
through three inputs only: its tint, its seed, and its place in its own frame.

Resolution does not exist as a setting: the graph is evaluated per pixel. No wall, pillar
or sphere samples an image; the scene's few images belong to sign plates, window glass
and particles. Every wall, pillar and sphere stands upright, so the painters read local Y
as up: lift lines, courses, streaks that run down and dirt that gathers toward the floor.

### How it reaches a wall

Core's wall mesher emits positions, normals and colours in the layer's local metres, and
the layer's root carries the pose. The painter reads those attributes directly, so the
pattern is fixed to the object's own frame: a planar pattern in local X and Y on a wall
face, a pattern in all three local axes inside a cut. Nothing is unwrapped or projected
ahead of time.

- Per layer: each layer keeps its own model and its own face and cut colours and shares
  the material. Plies alternate their grain by layer index; rear layers darken by vertex
  colour alone.
- Per face: the face rule in `faces.ts` calls a fragment an original face when its normal
  lies along the thickness and it sits within 0.1 mm of a face plane. Everything else is
  interior. Both depth faces are faces.
- A slab's four edge faces therefore paint as interior. The demo hides them behind steel
  trim.
- Per instance: the seed hashes the layer's world origin to the centimetre.

### How it reaches a pillar or a sphere

Core's solid mesher tessellates the base within 1 mm and emits local positions, smooth
skin normals and one surface attribute per vertex: a class (skin, crater, tunnel, rail
cap or crumble), an aperture lip value and the row's 8-bit pattern seed. `objectFrame`
builds the painter's frame from it.

- Skin is a class from the mesher, not a plane test, so the whole original surface of a
  thick or curved body is skin.
- Near a cut, skin gives way to interior painting inside a ragged band at most the lip
  wide, chosen by a seeded noise threshold: a spalled edge. A wall's border is hard.
- The painters work in all three local axes and order the pattern around the body's
  vertical axis: lift lines and bug holes for concrete, courses in concentric rings for
  brick, growth rings around the pith for wood. One pattern wraps the body seamlessly.
- The palette is two constants of the program, so every finish and palette is its own
  material. Walls keep the palette in vertex colours and share the material.
- The spheres carry the references' only metal: painted steel with chips, streaks and
  dirt toward the floor.

### How a damaged object looks

- Holes and cut sides of a wall: tunnel walls, blast lips and crater floors take the
  interior branch of the same painter: fibres and end grain, clay with mortar, aggregate
  in cement paste, a chalk core. Crater floors are recoloured to the cut colour at upload.
- Inner layers: a hole shows the next layer's original face in its own, darker palette.
- Attached detail: gibs and rail rims draw with the layer's detail material, the same
  painter in its interior branch in wall-local space, so they continue the crater.
- Pillars and spheres: craters, tunnels, rail caps and crumble faces take the same
  interior shading as a wall's cuts, so concrete, brick and wood have one cut look on
  every shape. A rail cap takes the cut colour mixed toward a cap tint.
- The metal sphere: a band of temper colours on the skin near a cut, bright iron inside.
- Debris: each batch's material reads a per-instance family and variation and paints
  splinters, pores, grog, stones or painted metal in the piece's own frame.

### Lighting and the image

The demo owns its image chain: a scene pass that also writes normal and reflectivity,
ambient occlusion, reflections on the wet floor alone, shafts and cones, bloom above 1.05,
grading and anti-aliasing. Painters emit linear, unexposed surface properties and set no
fragment or output node. Every lamp is a visible fixture whose emitter exceeds the bloom
threshold. None of this chain reaches sec-111, which renders through rendering-poc. The
painter contract does: sec-111's wall view runs it in rendering-poc's scene pass.

### How the authors iterate

- Station views: `?view=<title>-<station>` places the camera at one of seven stations of
  a pillar or a sphere, and `?objects=damaged` installs fixed damage on the mounted ones
  without a shot.
- A reload rebuilds the bundle; `?backend=webgl` and `?dpr` repeat a view on the other
  backend and at another pixel ratio.
- CPU tests build the real shader programs without a GPU, through three's node builder on
  a renderer that is never initialised. They assert material sharing, palettes, the cut
  recolouring, the static refresh contract and draw counts. They assert no appearance.
- A human judges appearance in a native browser, from a written checklist. The repository
  has no screenshot, no pixel test and no preview tool.

## 3. Library, demo and game

### Who owns each mechanism

- Core's facade, reachable through `destruction-gateway` today: the wall model with its
  face and inner colours, the intact chunk mesher with positions, normals and colours,
  retained cuboids, damage, collision and the Rapier backend.
- Core's facade, not yet re-exported: the resumable chunk builder with its gib
  descriptors, the tunnel and rim builders, the detail table, the debris shapes and
  materials, and the solid model with its two bases and its mesher.
- Demo only: every painter and kernel, the surface, detail, object, debris and scenery
  materials, `StaticNodeMaterial`, the face rule, the wall and object renderers, the light
  rig, the image chain, the effects, the stations and the preset tables. The package is
  private and exports a benchmark entry alone. `INTEGRATION.md` says why: visual style is
  application code.

No look mechanism can therefore be imported. A consumer rebuilds it, as sec-111 did.

### What sec-111 uses today

`engine/wall-view` is a port of the demo's wall look: about 800 lines of painters and 470
of materials, against the demo's 1,760. It paints brick, formed and fractured concrete,
gypsum and wood boards or plies, chosen by wall preset, in layer-local metres, with the
same face rule, cut recolouring, detail and debris materials. Its package facade exports
the views alone, so its painters are not importable either. Inferred: bundling its source
into the QA page would also add a second three.js core. sec-111 has no solid path and no
object painter. Neither repository has a metal wall finish: the one metal look is the
sphere's painter, built on the term `paintedSteel`.

### What draws the props after adoption

The level format fixes it: sec-111 draws an intact slab from its GLB mesh node, and from
the slab's first damage its own layer view with a finish per material. The first pass
accepted the step between the two as a limit while both were flat. A look that differs
between the two would pop at the first bullet, beside intact neighbours of the same prop.
These facts must agree between the QA view, the GLB and the wall view:

- the finish of each slab, named in the pair, apart from its physics material;
- the frame of the pattern: the slab's local axes and origin, the scale in metres, and
  the rule for a slab's seed or offset;
- the pattern's up: the references paint along local Y, while a prop's decks lie and its
  links pitch;
- which faces are skin: the wall view's rule paints a slab's edges as interior, while the
  props show panel edges at every corner and thick links on all sides. The pillars and
  spheres show the target, skin on the whole original surface;
- the tint, which is the slab's colour, and the cut colour, which the pair does not hold;
- the surface response: metalness and roughness per finish;
- the pattern itself: code present in both renderers, or pixels stored in the GLB.

Lights, haze, exposure and post already agree through the lighting section and
rendering-poc.

## 4. What the level designer needs

- `level-format`: a finish is two numbers per material class. A slab has no finish name,
  and the description has no place to define one.
- `prop-kit`: a role carries a material, a colour and a glow. It names no finish, and
  one prop has one colour or two.
- `slab-model` and `level-glb`: a slab primitive stores level coordinates, normals and
  colours. It stores no slab-local frame and no texture coordinate, and the writer adds
  no image, sampler or texture.
- `level-rules`: the `texture` rule rejects any image beyond the base stage's and waits
  for its 1,024 px check. No rule knows a finish.
- `level-view`: it draws GLB materials as loaded. That path already carries textures: the
  base stage brings 11 images of at most 1,024 px, 3.9 MB in all, with one normal map.
- `snapshot-render`: it reads no texture and draws one flat colour per triangle.
- The QA page has no station view and no damage, so nobody sees a damaged look before
  adoption.

### How agents can judge a material

An agent reads PNG sheets. It cannot see a shader's output: the most a test can prove is
that a graph builds to a program. An agent can judge a material that exists as pixels:

- the tile at one texel per pixel, with a ruler in metres, for pattern and scale;
- a three by three repeat, for seams and visible repetition;
- the tile reduced to its footprint at 5, 20 and 60 m, for what survives distance;
- its numbers: mean linear luminance, the measure the authoring guide's light arithmetic
  uses for the stage, and the ranges of roughness and metalness;
- the level sheets with base colour applied, for how finishes sit together.

No agent can judge the response to the level's lights, bloom, haze, or shimmer in motion.
The owner judges those in the browser.

## 5. Options

Each option keeps the references' method: an explicit finish apart from physics material
and tint, features sized in metres in the slab's frame, the prop's colour in vertex
colours under one shared material per finish, one finish for skin and cut, and counts
pinned by tests. In each the props stay slabs.

### Option 1: shader painters, named in the pair

The references' own form. The pair names a finish per slab; `level-view` replaces the GLB
materials with painter graphs.

- Reuses: the demo's kernels, frame, bump and face rule and the sphere's steel painter,
  as patterns to copy; sec-111 proves the contract in rendering-poc's scene pass.
- Changes here: finish names in the format and the kit, a slab-local frame in the GLB,
  and a paint unit in `level-view`, the largest piece. Snapshots stay flat.
- Asks of sec-111: a copy of every painter in its wall view, looks keyed by the slab's
  finish, the painter on the intact GLB node too, and skin on slab edges.
- Cost: large here, large at adoption. No texture, so no growth of the GLB.
- Risk: agents author blind, every iteration costs an owner's QA round, and a shader fault
  shows only in the owner's browser, whose console the run log does not capture. Two
  copies of each painter can drift. Per-pixel cost over 608 slabs is unmeasured.

### Option 2: painters baked into the GLB

The painter runs once per texel on the CPU. Each finish becomes a tileable set of base
colour, metalness and roughness, and normal maps of at most 1,024 px; the slab's colour
tints it; texture coordinates are the slab's own axes in metres over the tile size.

Baking is a step the references do not take. No wall, pillar or sphere samples an image:
their graphs read geometry attributes and constants alone. The bake keeps the painter
itself, the same function of a position in metres, and gives up its evaluation at any
distance without a texel grid.

- Reuses: the demo's kernels and feature method, ported to numbers; the glTF path that
  already draws the base stage in the QA app and in the game; sec-111's interior painters.
- Changes here: a Bun-side baker, finish definitions and names in the format and the kit,
  texture coordinates, images and textures in `level-glb`, the real `texture` rule, and
  texture sampling with a material sheet in `snapshot-render`. `level-view` stays as it
  is.
- Asks of sec-111: the wall view draws a damaged slab's original faces with the slab's
  GLB material, from texture coordinates it derives by the pair's rule, and its cuts with
  the family's interior painter. It adds a metal interior, a metal debris family and skin
  on edges.
- Cost: medium to large here, medium at adoption. The probe's map bakes in 0.4 s and
  compresses to 0.3 to 0.5 MB, so eight finishes of three maps cost about 10 s per build
  unless the bake is cached or smaller, against a validate of 4 s today. Inferred: 24
  maps take about 134 MB of GPU memory with mipmaps.
- Risk: the wall view's textured faces are new work without a reference. Its one
  foothold is the walls' upload step, which already applies the face rule to every
  triangle on the CPU. Repetition shows on long runs, five repeats of a 2.4 m
  tile on a 12 m container, and softness nearer than about 1.2 m, where a 2.3 mm texel
  exceeds the pixel of the game's lens at 1,080 rows.

### Option 3: one painter source for two evaluators

Each painter is written once against a small arithmetic interface with two back ends:
numbers for bakes, sheets and statistics, and node graphs for `level-view` and sec-111.

- Reuses: as option 1, plus the sheets of option 2 without textures in the GLB.
- Changes here: the interface, both back ends, every painter in its terms, and the work
  of options 1 and 2 on the format, the kit, the GLB frame and the snapshots.
- Asks of sec-111: as option 1.
- Cost: the largest. Risk: a private shading language, and a CPU picture that differs
  from the GPU's in every hashed detail.

### What the thick bodies change

- The pillars' and spheres' painters add two rules to every option: skin covers the
  whole original surface, and a pattern follows the body's up. In option 2 both enter the
  texture coordinate rule: a slab's edge faces carry the tile, and a tile's up runs along
  the prop's up. A pattern ordered around an axis cannot be baked into a flat tile; no
  slab needs one.
- Their cut look confirms the interior side of options 1 and 2. Interior painters are
  functions of position in three axes, so sec-111's four serve a slab of any thickness.
  The metal sphere supplies the missing metal interior: bright iron at full metalness.
  Its temper band and the ragged lip need the solid mesher's lip value, which a wall
  lacks, so a slab's hole keeps a hard border between skin and cut.
- Their simulation changes no option. The pair, the pipeline and sec-111 carry walls
  alone. A pillar or a sphere in the level would be a second destructible kind: a new
  record in the format, a new proof, a solid path and object views in sec-111, which the
  foundation report sizes at 4,000 to 6,000 lines, and 1,000 to 3,400 triangles a body on
  round bases only.
- The walls' own answer to thickness fits the pair as it is: a thick part built from two
  or three touching slabs takes one layer per shot and can show a darker layer behind,
  at the price of slabs under the cap of 1,024.

### The form taken

The materials are shader painters, the references' own form: the owner prefers them
because they keep the `.glb` as small as possible. Baked tiles are the fallback, which
the owner chooses if the shaders cost too much. The owner judges that from the frame
rate the QA page shows; the design of this directory states what keeps a painter cheap.

The form joins the three options and meets the risks each one carried:

- From option 1, the painter graph on the GPU. Its blind authoring is met by a number
  back end, through which agents see a finish; only the response to light stays with
  the owner.
- From option 3, one source for two evaluators, kept narrow. A finish is a recipe of data
  from a closed set of layer kinds, and each kind is written once over a small arithmetic
  interface. Nothing like a general shading language is built.
- From option 2, the baker, kept in reserve: the number back end already evaluates a
  finish per texel. Its unproven step, an image on a damaged slab's original faces, is
  needed only if the fallback is taken.

The brief's contract holds. The pair carries recipes, finish names and pattern frames,
which are data, and both renderers follow mapping rules of the level format, as they do
for the lighting. sec-111 consumes that data and ports one generic interpreter with the
layer kinds; no themed painter crosses to it.

## 6. Evidence boundary

Inferred, not observed:

- every statement about how the demo looks: it rests on source and documents;
- that three.js multiplies a slab's vertex colour into a textured GLB material, and that a
  prop's normal map shades correctly without a tangent attribute: only six of the base
  stage's 48 primitives carry tangents;
- the GPU memory and the texel arithmetic of option 2;
- that the wall view can draw a damaged slab's original faces with a textured material:
  no reference textures a destructible;
- that stacked slabs behave in the game as the demo's layers do: sec-111 groups no slabs
  into one shot.

Not established by reading, and shown only by a browser on real hardware:

- the frame cost of painter graphs or of 24 more textures over 608 slab meshes, in the QA
  app and in the game with its minions and effects;
- whether a 1,024 px tile holds at contact distance under the game's lens, haze and bloom,
  and how visible its repetition is along a container or a crane beam;
- shimmer in motion, relief strength under the level's point lights, and compile hitches
  at start and at first damage;
- the damaged look of any prop: the QA app cannot fire, so it first shows in sec-111.

Not checked: the demo's gypsum painter, wood boards and wood grain terms line by line,
any committed profiler report, since none exists, and sec-111's cost at 608 slabs. No
`docs/archived` directory and no git history were read.
