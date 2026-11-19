# sec-111 integration: materials and walls

This report establishes how the level's surfaces reach sec-111's screen: the stage with its
seals, the static objects, the hall finishes and the props' slabs, intact and damaged, with
the finishes the level designer gives them. It states facts with their evidence and makes
no recommendation.

Evidence conventions:

- A sec-111 path starts at `../sec-111`, a destruction lib path at `../destruction-poc`,
  and a three.js path at sec-111's install,
  `node_modules/.bun/three@0.186.1/node_modules/three`.
- A design path starts at `docs/researches/2026-11-17-dark-factory-look-dev/`.
- "Verified" means read in the named file or measured by the named probe. "Inferred" means
  neither, and says why.
- The level pair is `.tmp/level/dark-factory.glb` and `.json`, built on 2026-11-19 at
  15:54. Two read-only probes in the scratch directory measured it:
  `res-materials-probe-glb.ts` and `res-materials-probe-fallback.ts`, run with
  `mise exec -- bun <probe> <glb> <json>`.

## 1. How sec-111 draws its stage and its walls today

### The stage view

`engine/view` owns the stage, verified in `engine/view/docs/scene.md` and
`engine/view/src/view.ts:84-93`:

- `level/load.ts` loads the stage with three's `GLTFLoader`.
- `level/plan.ts:83-88` merges every mesh of the stage by material name, sidedness and
  vertex layout. It reads no node `extras` and no role: a search of `engine`, `tools` and
  `games` for `extras`, `userData` and `destructible` finds no GLB role handling.
- `level/plan.ts:37-41` throws for a material name that `MATERIAL_AUDIT` lacks.
- `level/audit.ts:71-92` holds the audit: eleven names of the base stage, five of them
  with metalness and roughness replaced by fixed values.
- `level/build.ts:154` bakes each member's world matrix into the merged geometry, and
  `build.ts:197` scales the stage root by `metrics.scale`.
- `level/end-wall.ts` draws the end wall as one box of a fixed look.
- `lighting/fixtures.ts:12-44` dims the fluorescent strips by a per-vertex gain on a plain
  `MeshStandardNodeMaterial`.

The stage view draws no seal, no static object and no slab of a level pair: it holds no
code that reads them.

### The wall view

`engine/wall-view` draws the destructible walls, verified in
`engine/wall-view/docs/KNOWLEDGE.md` and `docs/rendering.md`:

- A wall is drawn wholly by the wall view, intact and damaged. `views/wall-views.ts:56-62`
  builds one `LayerView` per layer, and `layer/layer-view.ts:44-69` builds the pristine
  chunk meshes at construction. No GLB node draws a wall.
- The finish is chosen by wall preset. `materials/looks.ts:16-33` maps the five presets to
  five painters: boards, plies, gypsum, brick and concrete. `looks.ts:52-67` shares one
  look per finish, layer thickness and grain.
- A look is two `StaticNodeMaterial`s, verified in `materials/surface.ts:29-44`: a
  double-sided surface material for chunk surfaces and tunnels, and a detail material for
  gibs and rail rims.
- A painter reads layer-local position and normal, a face mask, a footprint and a seed
  hashed from the layer's world origin, verified in `paint/frame.ts:155-170` and
  `surface.ts:90-135`. It writes albedo, roughness, metalness and a bump height.
- The materials set no emission. A search of `engine/wall-view/src` for `emissive` finds
  nothing, and `docs/rendering.md` says the graphs add no emissive light.

### From intact to damaged, the cut faces and the debris

- A chunk mesh carries only `position`, `normal` and `color`, verified in
  `layer/chunk-meshes.ts:195-201`, in layer-local metres under a root posed by the layer
  transform, verified in `layer-view.ts:55-56`.
- Damage rebuilds the changed chunks within a frame allowance, nearest the impact first,
  verified in `layer-view.ts:106-144`. The material stays; only the geometry changes.
- The face rule is a shader mask: 1 on a depth face within 0.1 mm of a face plane, else 0,
  verified in `materials/faces.ts:116-124`. Edge faces, crater floors, cut sides and
  tunnels paint as interior.
- At upload, `cutFloorColors` recolours interior depth faces to the model's `innards`
  colour, verified in `faces.ts:131-144` and `layer-view.ts:174-178`.
- The walls package sets `innards` from the preset's cut colour, verified in
  `engine/walls/src/assembly/assembly.ts:59` and `src/presets/presets.ts:30-60`.
- Gibs and rims take the cut colour with a position-keyed jitter, verified in
  `materials/tints.ts:271-274`.
- Debris paints by a family per preset: wood, gyprock, brick, concrete, verified in
  `materials/debris.ts:18-32`. The recorded views pick looks and debris families by
  preset too, verified in `views/recorded.ts:34` and `views/remains.ts:23`.
- sec-111 has no metal wall preset, verified in `engine/level-data/src/contract/level.ts:64`.

### The static material class

`materials/static-node-material.ts:100-107` holds sec-111's `StaticNodeMaterial`. Its
observer reports no node to refresh unless the builder injects the model-view matrix, the
model-normal-view matrix, ambient occlusion or the shadow. Its comment allows geometry
attributes, constants, the model world and normal matrices and render-scope camera nodes,
and warns that an object-scope uniform goes stale. Wall Lab draws a wall the same way: one
look per layer for surface, tunnel and detail, the cut colour applied at upload, verified in
`packages/demo/src/rendering/wall.ts:47,92` and `materials/wall-materials.ts:68-71` of
destruction-poc.

## 2. What the level pair gives a renderer today

### The GLB, measured

- 17,340,936 bytes, a JSON chunk of 1,220,256 bytes, 11 images and 11 textures, all the
  base stage's.
- `KHR_materials_emissive_strength` is used and none is required.
- 1,357 nodes with 386 scene roots. By `extras.role`: 13 `seal`, 245 `static`, 127
  `destructible`, and 972 without a role, the base nodes and the mesh child nodes.
- 54 static nodes carry `extras.support`.
- 867 primitives carry `COLOR_0`, `NORMAL`, `POSITION`, `TEXCOORD_0`, `TEXCOORD_1` and
  `_SLAB`: 616 slabs, 245 static objects and 6 painted seals. The other 55 are the base
  stage's and the flat seals'.
- 76 materials. 60 carry `extras.finish`: 55 `finish/...` materials and 5 stage materials,
  `Material.001` as `hall/front`, `Material.002` as `hall/wall` and `Material.003` as
  `hall/slab`, the last two with their double-sided twins. 19 carry a glow.

A glow material carries `finish`, `glow` and `glowStrength` in its `extras`, a white base
colour, the body's metalness and roughness, the glow's colour as `emissiveFactor`, and the
emissive strength. `finish/sign/board/glow/eye` reads strength 0, because its body is unlit.
A plain finish material carries `finish` alone.

The contract behind these facts stands in `finish-format.md`, "The GLB", and in
`packages/level-glb/docs/KNOWLEDGE.md`, "Materials".

### The level `.json`, measured

- Root keys: `schema`, `finishes`, `props` and `lighting`. It holds no glow and no static
  object.
- 14 finishes with 57 roles and 219 layers. A role states at most 14 layers of its own,
  and 13 layers carry `lit`.
- The cut families: `concrete` for `cast-concrete` and `hall`, `wood` for `timber`, `brick`
  for `block`, and `metal` for the other 11.
- 127 props with 616 slabs. A slab holds `size`, `material`, `color`, `position`,
  `rotation`, `finish`, `number`, `seed` and `wear`; it names no glow.
- The slabs' physics materials: 456 metal, 148 wood, 10 concrete and 2 brick.
- Slabs come in 7 thicknesses, from 0.03 to 0.6 m. They name 37 finish paths and 38 pairs
  of path and thickness.
- `lighting` holds `environment`, 25 `points`, `haze` and `exposure`, and no key. A point
  holds a position, a colour, an intensity and a range, with no id and no glow name.

### What a standard glTF renderer shows without any painter

Verified in three's `examples/jsm/loaders/GLTFLoader.js`: line 872 maps the emissive
strength to `emissiveIntensity`, lines 1974-1982 name `_SLAB` `_slab` and `TEXCOORD_1`
`uv1`, and line 2366 copies `extras` into `userData`. Such a renderer draws the flat
fallback:

- every slab and box in its vertex colour, a white base colour times `COLOR_0`, with its
  body's metalness and roughness;
- the six glow materials with a lit body at their strength: the luminaire bands and strips;
- the stage materials with their textures and their overrides, without the hall layers.

The fallback probe measured what it loses:

- 49 of the 55 `finish/...` materials draw a layer or a body shade other than 1, which the
  fallback cannot. 6 are exact.
- 8 glow materials emit only through `lit` layers, so the fallback shows them dark:
  `sign/board/eye`, `casting/shoulder`, `upper-arm` and `forearm` with `eye`, and
  `housing/machine-plate`, `housing/machine`, `housing/cabinet` and `bed/deck` with `line`.
  85 mesh nodes draw with them, 82 slabs and 3 static objects.
- The floor lines and every other hall mark: they are hall layers.

Inferred: a renderer without the emissive strength extension draws `emissiveFactor` at
strength 1, so these 8 materials would glow at full colour, against the description. No
such renderer was run.

## 3. The adoption list against sec-111's source

The list stands in `finish-format.md`, "What sec-111 changes at adoption". It joins the
foundation's list in `docs/researches/2026-11-16-level-designer-foundation/level-format.md`,
"What sec-111 changes at adoption". Every item rests on that list's first steps: props with
slabs in place of wall placements, the walls engine taking one slab as one single-layer
assembly with metal included, and the wall view drawing an intact slab from its GLB node.
None of those holds today, verified in `level-data/src/contract/level.ts:64-108` and
`walls/src/assembly/assembly.ts:37-69`.

### Level contract: the finish table and a slab's four finish keys

- Lands in `engine/level-data/src/contract` and `src/codec`, which admit wall placements
  and no finish today, verified in `docs/persisted-pair.md`, "Admission".
- What already holds: one admission at the boundary, then trust inward, the same rule as
  `finish-format.md`, "The level `.json`".
- What the list misses: this repository's admission lives in `level-format`, in the units
  `length`, `layer` and `finish`, 1,039 lines without tests. `finish-paint` imports the
  recipe's types from `level-format`, and `recipeAt` resolves `extends` and the default
  body, verified in `packages/level-format/src/finish/recipe.ts:18`. The copy that the
  owner allowed names neither.

### Level preparation: skip a `static` node

- Lands in `tools/level-prep/src/glb/scene.ts`, whose `readStage` visits every mesh node
  without reading a role, verified at lines 106-120.
- What already holds: nothing skips a role today. This repository hands sec-111 only the
  static scene, the stage and the seals, verified in `tools/level-pipeline/docs/KNOWLEDGE.md`,
  steps 2 and 3.

### Wall view: the copy, the look key, the intact node and emission

- The copy lands in a new unit of `engine/wall-view`. What already holds: sec-111 and this
  repository pin three 0.186.1, verified in both `package.json` files and in
  `engine/wall-view/package.json:9`, and sec-111 already holds a static material class.
- The look key lands in `materials/looks.ts:52-67`, keyed by preset today. A slab names no
  glow in the `.json`, so the glow can come only from the GLB material of its mesh node.
- `faces.ts:121-124` reads a constant thickness, so the wall view builds one material per
  thickness today. On this level the key would be about 38 pairs of path and thickness,
  plus their glows.
- Drawing the intact GLB node is new: today the wall view builds every wall from chunk
  meshes at construction, and the stage view merges every GLB mesh into the shell.
- Emission is new: the wall view sets no emissive slot.
- What the list misses: the node back end, the twin and the stage wrap live in
  `packages/level-view/src/paint`, 402 lines without tests, not in `finish-paint`, 1,143
  lines without tests. The list names "both back ends", and the number back end serves
  only the swatch and a bake, inferred from `painter-cost.md`, "If the owner finds painters
  too dear".
- What the list misses: `KNOWLEDGE.md`, "Accepted limits", says a damaged glowing slab
  loses its glow in the game, while the list admits emission in the wall view.

### Wall view: the pattern data of chunk meshes

- Lands in `layer-view.ts:171-188`, beside `cutFloorColors`, which already walks every
  triangle on the CPU at upload. The frame rule `slabFrame` runs on plain numbers, verified
  in `packages/finish-paint/docs/KNOWLEDGE.md`, "The slab's frame rule".
- The skin rule changes `faces.ts:116-124`: today edge faces paint as interior.
- Tunnels have no face on the six planes, so they are cut, inferred from the rule.
- What the list misses: the intact GLB mesh comes from destruction lib's mesher at its
  default configuration and seed, verified in `packages/slab-model/docs/KNOWLEDGE.md`,
  while sec-111's walls seed each layer and apply `layerConfig`, verified in
  `assembly.ts:61-62`. Whether the first damaged build meets the intact mesh without a step
  was not checked; the shared frame rule keeps the pattern in place, by `design.md`, "The
  painter".

### Wall view: the cut looks, metal included

- Lands in `materials/looks.ts:25-33` and the `paint` unit, which hold five painters and
  no metal, 806 lines.
- What the list misses: the cut colour reaches the shader as the model's `innards`, set by
  the walls package from the preset, verified in `assembly.ts:59`. The finish's `cut.color`
  must reach that model. Debris families are keyed by preset and hold no metal, verified in
  `materials/debris.ts:18-24`, while 456 of 616 slabs are metal. The detail material of
  gibs and rims follows the look, verified in `layer-view.ts:59-61`. The recorded views
  pick looks and debris by preset, verified in `recorded.ts:34` and `remains.ts:23`.

### Stage view: static nodes, box painters, hall finishes and the hidden litter

- Lands in `engine/view/src/level`. What blocks it today: `plan.ts:37-41` throws for each
  `finish/...` and `seal/...` name, `plan.ts:83-88` merges by material, so a litter cannot
  be hidden alone, and `audit.ts` overrides the factors of three stage materials that
  carry an override and a hall finish. The foundation's list deletes the audit.
- The hall wrap reads the interior box. sec-111 holds it as `metrics.interior`, the value
  the QA app passes, verified in `packages/qa-client/src/boot/view.ts:40`.
- What the list misses: the stage item needs the hall's frame rule, `hallFace`, and the
  wrap. The list names the copy only for the wall view, and names only the slab's frame rule.
- What the list misses: the hide links two packages. The wall view knows a slab's first
  damage and the stage view owns the static nodes. No interface between them exists today.

## 4. The ways a finish can reach the game

The facts of cost come from `painter-cost.md` and `design.md`, "Painters in `level-view`":
a CPU graph of forty layers builds in 2 to 4 ms and its program text in 13 to 21 ms, and the
GPU compile time shows only on the owner's machines. The level draws 616 slab meshes, 245
static objects and 13 seals, one draw each. No game frame cost is measured anywhere, and
`KNOWLEDGE.md` says the QA frame rate overstates the game's.

### A copy of the generic painter files in sec-111

- sec-111 changes every item of section 3.
- The level designer builds nothing more for the intact look. The painter files are
  generic and hold no theme, verified in `packages/finish-paint/CLAUDE.md`.
- Load: about 49 twins and up to 5 stage wraps compile at the start, measured by the
  fallback probe and stated in `packages/level-view/docs/KNOWLEDGE.md`. The damaged chunk
  materials add programs per path, glow and thickness, inferred from `faces.ts`.
- Per frame: each painted pixel runs its recipe's arithmetic. A static material refreshes
  no draw, verified in `static-node-material.ts`.
- Loses nothing of the intact look against the QA app.
- "Contained here" can take the files themselves and their tests. It cannot take the
  chunk pattern data, the skin rule, the cut looks, metal debris, the recorded views or
  the hide, which live in sec-111's runtime. `finish-format.md:491-493` leaves to adoption
  what keeps the two copies in step.

### The painter consumed from this repository as code

- It contradicts the brief, `TASK-001-deliver-the-dark-factory-level.md:74-75`: only the
  level data is consumed. The owner's decision of 2026-11-18 allows a copy, line 199.
- sec-111 would depend on `finish-paint`, `level-format` and the paint unit of
  `level-view`. No sec-111 manifest names a level-designer package today, inferred from
  the manifests read above.
- "Contained here" takes the painter, the frame rules and the twins with one owner. It
  cannot take the damaged look, which stays in sec-111's chunk meshes.
- Cost at load and per frame: as for the copy.

### A bake into textures of at most 1K in the `.glb`

- The design's stated fallback, `design.md`, "Premises", and `painter-cost.md`, "If the
  owner finds painters too dear". Nothing is built for it.
- The level designer builds the baker on the number back end, the textures in `level-glb`,
  and a changed `texture` rule. Today the rule refuses any image beyond the base stage's,
  by `finish-format.md:450`.
- sec-111 draws the intact GLB materials as loaded. For damage it derives texture
  coordinates of chunk faces by the frame rule and keeps the cut painters, by
  `research-destruction-look-dev.md`, "Option 2".
- Cost: about 10 s of build per eight finishes of three maps, and about 134 MB of GPU
  memory for 24 maps, the second inferred, by the same report. Per frame a texture sample
  replaces the arithmetic.
- Loses the marks that depend on both ends of a face or on its number, legends among them,
  the floor lines and the hall marks, by `painter-cost.md:85-91`. Inferred: one tile per
  material also loses each slab's seed and wear, which vary inside a shared material today.
- "Contained here" takes the intact look whole. It cannot take the damaged look.

### The flat fallback alone

- The level designer builds nothing. sec-111 draws the GLB materials and stops merging the
  role nodes.
- Loses what section 2 measured: 49 of 55 materials' layers, 8 dark LED materials on 85
  nodes, the floor lines and the hall marks.
- The damaged look falls back to sec-111's preset painters, as `KNOWLEDGE.md`, "Accepted
  limits", states. sec-111 holds no metal preset, so 456 metal slabs have no damaged look
  today.
- "Contained here" takes the intact look as the GLB states it; the damaged look stays in
  sec-111.

## 5. What each way leaves open for later visual development

### What every way shares

- Lights may change per frame. three updates a light's colour times intensity on every
  frame, verified in `src/nodes/lighting/AnalyticLightNode.js:97,303`, in the shared render
  group, line 54. A static material keeps them, because only object-scope data goes stale.
- The light count is fixed: a changed light set changes every lit program, verified in
  `engine/view/src/lighting/lighting.ts:69-72` and `engine/view/docs/scene.md`.
- The sky shadow renders once, verified in `scene.md`. A shadowed light that moves needs a
  shadow refresh that sec-111 does not run.
- Wall Lab animates light within a fixed count: a pool of three point lights at zero
  intensity until a flash, verified in `packages/demo/src/rendering/lighting/flash-pool.ts`
  of destruction-poc.
- Additive VFX follow rendering-poc's `configureAdditiveVfx` and change no surface, verified
  in `scene.md` and `engine/vfx/docs/particles.md:83-88`.
- The pair links no point light to a glow or a fixture.

### A painter, copied or consumed

- Fixed at build: the recipe's numbers are constants of the shader text, by
  `painter-cost.md`, "What keeps a painter cheap". A changed recipe needs a new program,
  as the QA app shows it only at the next start.
- The glow's colour and strength are constants too, verified in
  `packages/level-view/src/paint/twin.ts:128-132`.
- Free per frame: a render-scope uniform. three's `time` sits in the render group, verified
  in `src/nodes/utils/Timer.js:10`, and the static observer allows render-scope nodes. A
  plain `uniform` defaults to the object group, verified in
  `src/nodes/core/UniformNode.js:55`, and would go stale.
- One material serves every slab of a path and glow, so a change per slab must come
  through vertex data or render-scope arrays, inferred from the observer's rule.
  sec-111's strip mask already varies emission by a vertex attribute.

### A bake or the flat fallback

- The materials are plain standard materials, so their emission and factors are material
  properties that may change at run time, inferred from three's ordinary refresh.
- A bake fixes its marks in pixels at build time; the fallback has no marks to vary.

## What was not checked

- No program was compiled for sec-111, and no frame was drawn.
- The step between the intact GLB mesh and sec-111's first damaged chunk build.
- How three refreshes a plain material whose emission changes per frame.
- sec-111's present stage draw count, and whether `GLTFLoader` keeps node names unique
  for `stageMeshes`.
