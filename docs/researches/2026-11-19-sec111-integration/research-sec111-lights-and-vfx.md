# Research: sec-111 lights and VFX

Scope: how sec-111 lights its level and drives its effects today, what the rendering-poc
library fixes and leaves free, which parts of the level pair's lighting are static by
construction, and what lights animated in gameplay and more VFX would need from the level's
data and from the integration. This report states facts and options; it makes no
recommendation and no plan.

Paths are relative to `D:\w\vico\fps\`. "Verified" means read in the named file or symbol.
"Inferred" means reasoned from verified facts and not observed; no browser or GPU ran. The
three.js sources read are the pinned 0.186.1 copy in
`level-designer/node_modules/.bun/three@0.186.1/node_modules/three/src/`, written below as
`three/src/`.

## 1. How sec-111 lights and draws its level today

Everything lives in `@sec111/view`, `sec-111/engine/view/src/`. Verified:

- Lights: `lighting/lighting.ts`, `addLights`, adds one shadowed directional "sun" and four
  unshadowed point "practicals", decay 2. All values come from the table `DEMO` and
  `arenaLighting(scale)` in `lighting/tuning.ts`, scaled by the prepared scale.
- Environment: `lighting/environment.ts` bakes a procedural interior with a cold +Z lobe
  once into a PMREM texture; `createLighting` sets `scene.environmentIntensity` to 0.5.
- Shadow: `lighting/shadow.ts`, `fitSunShadow`, fits the 4096 map to the padded interior.
  `scene.md`, "Lighting and scale": its first draw is requested, then automatic updates stay
  off.
- Daylight spill: `lighting/spill.ts`, `setSpill`, sets `scene.fogNode` to an additive
  in-scatter near the end wall, from two `uniform` nodes.
- Strips: `lighting/fixtures.ts`, `maskFixtures`, writes a per-vertex `stripGain` attribute
  on the merged fixture mesh and sets `emissiveNode = materialEmissive.mul(stripGain)`. Strips
  near a practical keep gain 1, the others 0.06. The gain is written once.
- Clear colour: `lighting/lighting.ts`, `CLEAR_COLOR` (0.004, 0.005, 0.007).
- Post look and lens: `look/demo-look.ts`, `DEMO_POST`, and `look/look.ts`, `arenaLook`
  and `CAMERA_LENS`. Haze 0.03 / scale, exposure 1.0, bloom 0.7 / 0.6 / 0.75 / 0.35.

All of it is hardcoded source. `engine/view/docs/scene.md` states: "The light set stays
fixed: one shadowed sky light and four unshadowed point lights. Changing light presence
changes lit programs." `engine/view/CLAUDE.md`: "Keep that light set fixed for the view's
lifetime: never add, remove or hide lights. Never create materials or set `needsUpdate` in
the frame path."

What changes while the game runs, verified by a grep over `sec-111/engine` and
`sec-111/games` for writes of `.intensity`, `emissiveIntensity`, `.emissive`, light
constructors, `environmentIntensity` and `uniforms.*.value`, tests excluded:

- No light, emissive or post value is written per frame by gameplay or by an effect.
- `render/presenter.ts:117` writes only `uniforms.time` per frame. The `VisionController`
  animates the x-ray blend uniforms (`rendering-poc/docs/rendering-contracts.md`, "Typed
  inputs and shared state"). `engine/vfx/src/impact-vfx.ts:104` writes the effect clock.
- The emissive writes found run at construction: `character-fx/src/look/skin-look.ts:28`,
  `view/src/hand-models/surface.ts:49` (the rifle sight's glow) and `fixtures.ts`.
- The `View` interface (`view.ts`, lines 49 to 74) exposes the scene, camera, vision, hands
  and stats. It exposes no light, no lighting handle and no post uniform. The returned
  `Lighting` object holds the lights, but `buildWorld` keeps it, and `createView` reads it
  only in `dispose` (`view.ts:158`).

## 2. sec-111's VFX today

Verified in `sec-111/engine/vfx/` (`CLAUDE.md`, `docs/KNOWLEDGE.md`, `docs/effects.md`,
`docs/particles.md`):

- One package, `ImpactVfx`, owns all particles: one instanced quad mesh over a fixed ring of
  2,048 slots. The CPU writes each particle's birth state once; the GPU derives motion,
  shape and brightness from one effect clock.
- Four kinds: flash, spark, zap, arc. An SMG hit writes one flash and hot sparks scaled by
  material. A punch writes an electric burst. The spear writes a bolt, a flight trail, a pin
  strike and a crackle schedule of at most eight entries.
- Inputs are plain events with seeds, unit directions, times and the application's floor
  lookup (`games/arena/src/adapters/visuals.ts`, `floorAt`). Every random choice comes from
  the event's seed.
- Additive only: "Every particle material ends with rendering-poc's `configureAdditiveVfx`
  ... Dust, smoke and soot have no compatible path; do not add them."
- No lights: "No lights. Glow comes from bloom; the renderer's light count must never
  change." Every material exists at construction; emitting writes ring slots only.
- Replay records no particles. A replay scene builds its own `ImpactVfx` and regenerates
  effects from recorded actions and character facts on the recorded effects clock.

Other presentation that reads as effects, verified:

- Character FX (`engine/character-fx/docs/KNOWLEDGE.md`): dents, gouges, interiors, falling
  limbs, static corpses and chips. Every surface is an opaque standard node material; "These
  effects add no shadow passes." Metal parts read `scene.environment` for reflections.
- Wall view (`engine/wall-view/docs/rendering.md`): surfaces, tunnels, gibs, rims, debris and
  chips, all opaque. Its graphs "add no emissive light". Gibs, rims, debris and chips receive
  shadows only; "Later damage does not refresh the map".
- The x-ray vision, signatures and health bars belong to the post pipeline.
- No muzzle flash or tracer exists:
  `sec-111/docs/researches/2026-11-13-14-04-06-cinematic-replay-timing/effect-and-sound-timing.md:51`,
  "Muzzle flash or tracer: none exists." A grep for `muzzle` finds only recoil constants.
- `games/arena/docs/CANONICAL-STATE.md`, "Cosmetic families", lists "Stage meshes,
  textures, materials, environment, lighting/shadows/fog/bloom" as cosmetic: none is
  recorded state.

What the effects need from the renderer and the level, verified: the scene-pass contract
of `engine/view/docs/scene.md` (opaque output, depth in colour alpha, additive VFX through
the helper, compile after every package adds its objects); the floor lookup from the
prepared level's floors; `scene.environment` for metal reflections; the fixed light set
for the lit programs of minions, walls and hands. Nothing reads a level light, a glow or a
named point.

## 3. What the rendering-poc library offers and leaves to its caller

Verified in `rendering-poc/docs/integration.md`, `docs/rendering-contracts.md`,
`docs/rendering-api.md` and `packages/library/src/`:

- It owns no light: "Your app owns asset loading, lights, input, gameplay, UI, and visual
  settings" (`integration.md`, "Choose what to reuse").
- Exports: renderer, post-config, uniforms, pipeline, vision, quality, stats,
  dynamic-resolution, gpu-throttle, types and additive-vfx (`packages/library/package.json`).
- Renderer: `renderer.ts:107` fixes ACES filmic tone mapping at exposure 1, and `:110`
  enables the shadow map. `rendering-api.md`: static shadows use disabled automatic updates
  with an explicit request; WebGPU uses `PCFShadowMap` with a radius.
- Live uniforms (`uniforms/index.ts`, `PostUniforms`): among others `hazeDensity`,
  `hazeColor`, `hazeGlow`, `exposure`, `bloomStrength`, the grade, lens dirt, vignette and
  grain. "Live visual controls are the `.value` fields exposed by `PostUniforms`"
  (`integration.md`).
- Fixed at construction: bloom radius, threshold, knee and tints (`render/bloom.ts:32-35`),
  scene sampling, signature capacity, health-bar dimensions, transition duration.
- Quality: `resolveRenderQuality` fixes MSAA at startup; `DynamicResolution` adapts scene
  size at run time.
- Effects: `configureAdditiveVfx` is the one transparency path. "The library provides no
  path for normal, subtractive, or multiplicative transparency" (`rendering-contracts.md`).
- Optional `realism` (GTAO, screen-space reflections); sec-111's look omits it.

Left to the caller: every light and its count, shadows and their refresh, the environment,
every material, the whole `PostConfig` and any run-time change of its uniforms.

## 4. The level pair's lighting as built

The design, verified in
`docs/researches/2026-11-16-level-designer-foundation/level-format.md`:

- "Lighting": `environment` (`intensity`, `ambient`, `overhead`), an optional `key`,
  `points` with `position`, `color`, `intensity`, `range`, then `haze` and `exposure`.
  "Bloom, grade, lens and x-ray stay game-owned and have no field." The design text says
  "0 to 8 entries".
- "Finishes and glows": `glows` maps a name to a `color` and a `strength`.
- "Lighting mapping rules": "Both renderers, `level-view` now and sec-111's view at
  adoption, follow these rules." The key's shadow "is static PCF ... it renders once";
  points have "no shadow"; every level mesh "freezes its matrix"; "The light set is
  complete before the first compile and never changes afterwards."
- "What sec-111 changes at adoption": "lights, haze and exposure come from the lighting
  section by the mapping rules"; "Looks, sidedness and emissive strength come from the GLB".

The format as built, verified:

- `packages/level-format/docs/KNOWLEDGE.md`, "Lighting": the same keys, at most one key and
  at most 32 points. The `.json` root keys are `schema`, `finishes`, `props` and `lighting`.
  "Every record takes exactly its listed keys. An unknown key ... is a problem."
- `levels/dark-factory.json`: environment 3.3, no key, 25 points, haze 0.012, exposure 1.
  Six glows: `line`, `eye`, `strip`, `gate`, `alert`, `emergency`, strengths 0.33 to 0.9.
- The glows reach the pair only through the GLB. `packages/level-glb/docs/KNOWLEDGE.md`:
  one material per finish path and glow pair, shared by every seal, static object and slab
  of that pair; its emissive factor is the glow's colour at the glow's strength times the
  body's `lit` through `KHR_materials_emissive_strength`; its `extras` carry `glow` and
  `glowStrength`. `finish-format.md` (look-dev), line 317: "the level `.json` holds no glow".
- `docs/LOOK-AND-LIGHTING.md`, "How the hall is lit": "An emissive surface lights nothing";
  an emergency wall light "is a pair: a lamp ... and a point".

level-view as built, verified in `packages/level-view/src/`:

- `scene/dress.ts`, `dressScene`: "The set is final here; nothing adds or removes a light
  later." The lights go straight into the scene, outside the level root.
- `scene/lights.ts`, `createKeyLight`: `shadow.autoUpdate = false`, `needsUpdate = true`.
- `scene/environment.ts`, `bakeEnvironment`: one PMREM bake; the sphere is released.
- `scene/meshes.ts`, `applyMeshRules`: every object under the level root gets
  `matrixAutoUpdate = false` and `matrixWorldAutoUpdate = false`.
- `paint/twin.ts`, `paintedTwin`: `emissiveNode = vec3(r * strength, ...).mul(emission)`,
  the strength as shader constants. `paint/static-material.ts`, `StaticNodeMaterial`: the
  observer reports no node to refresh.
- `scene/look.ts`, `levelLook`: haze and exposure written into the `PostConfig` once.
- `level-view.ts`, `LevelView.frame`: writes only `uniforms.time`. `packages/level-view/CLAUDE.md`:
  "Keep the light set fixed after the start: expose no light and no setter."

## 5. The static points: owner and what each stops or costs

Three facts of three.js frame every point below. Verified:

- A lit program's cache key holds each light's `id` and `castShadow`
  (`three/src/nodes/lighting/LightsNode.js:155-156`, `customCacheKey`). A light added,
  removed or toggled to cast changes the key of every lit program. `Renderer.js:3244`
  skips an object with `visible === false`, so a hidden light leaves the set
  (research-rendering-lighting.md, section 3, says the same).
- A light's colour times intensity is a render-group uniform, copied in `update`
  (`AnalyticLightNode.js:303`); a point's range likewise (`PointLightNode.js:73`). Inferred:
  intensity, colour, range and position change without a rebuild, and intensity 0 keeps
  the light in the set and its cost in every lit pixel, as `LOOK-AND-LIGHTING.md` states
  for a key at 0.
- The material observer refreshes on a change of a listed material property, among them
  `emissive` and `emissiveIntensity` (`NodeMaterialObserver.js`, `refreshUniforms`, and
  `equals`), and on a change of `scene.environmentIntensity` (`equals`, "scene").
  `StaticNodeMaterial` turns off only the node check (`needsRefresh`, `hasNode`).

### The light set fixed after the start

- Owner: the mapping rules (adoption), level-view's own rule (QA app), and sec-111's view
  rule today. The data holds a fixed list; it states nothing about time.
- Stops: a light added at run time, a light hidden, a shadow switched on, without a rebuild
  of every lit program, hands, minions and walls included. Inferred cost: a first-use
  compile hitch; the scene contract forbids it.
- Leaves free, inferred: intensity, colour, range and position over time, and "off" as
  intensity 0. Flashes that light the scene need lights present from the start.

### The key's shadow rendered once

- Owner: the mapping rules ("it renders once") and both renderers. The level states no key,
  so no shadow exists today.
- Stops: a moving or animated shadowed light without a shadow refresh. Inferred cost: one
  render of every caster per refresh. A point casts no shadow by rule; a shadowed point is a
  program change and a new map.

### The environment baked once

- Owner: level-view and sec-111 both bake once. The mapping rules name the bake, not its
  frequency.
- Leaves free, inferred: `environment.intensity`, through `scene.environmentIntensity`,
  with a full refresh of every object in that frame.
- Costs: a change of `ambient` or `overhead` needs a new PMREM bake. sec-111's hands read the
  environment once at construction (`view.ts`, `new HandModels(scenes, scene.environment,
  ...)`), so a new texture would not reach them by itself.

### Frozen matrices

- Owner: the mapping rules ("freezes its matrix") and level-view's mesh rules. A stage wrap
  reads the world matrix and relies on the freeze (level-view knowledge, "The stage wrap").
- Stops: moving a level mesh, such as a swinging lamp or a hook block, without unfreezing it.
- Not affected: the lights, which stand outside the level root in level-view.

### Static materials without a per-frame refresh

- Owner: level-view's painters; sec-111 may copy the painter files at adoption (owner's
  decision of 2026-11-18). The mapping rules do not mention them.
- Stops, inferred: a value changed over time inside a twin's or a wrap's graph. sec-111's
  wall-view states the limit: "Object-scope time or camera uniforms would go stale under
  this observer" (`rendering.md`, "Scene-pass contract").
- Leaves free, inferred: a change of a listed material property still refreshes, since
  `equals` still runs.

### A glow's strength as a constant of its material

- Owner: the level data (the GLB contract of level-glb) and the QA app's twin.
- In a twin the strength is a shader constant: a new strength is a new graph. In a GLB
  fallback material it is `emissiveIntensity`, a listed property, so inferred animatable.
- One material per path and glow pair serves every object of that pair. Inferred: one value
  changes every lamp of that glow at once; per prop or per zone needs a split material or a
  per-vertex term, as sec-111's `stripGain` shows.
- sec-111's wall view adds no emissive light today; "admits emission" is an adoption change
  (`finish-format.md`, "What sec-111 changes at adoption"). Accepted limit,
  `docs/KNOWLEDGE.md`: "A damaged glowing slab loses its glow in the game, while a point
  light beside it stays."

### The points without names

- Owner: the level data. A point holds `position`, `color`, `intensity` and `range` only.
- `LOOK-AND-LIGHTING.md` names points by their lamps ("those of `emergency-10` and
  `emergency-11`"); no datum links a point to its lamp, its glow, its prop or a zone.
- Stops: addressing one point, a pair of lamp and point, or a group, other than by its index
  in the list or by position. Adding a name later is a change of the format: the decoder
  rejects an unknown key.

### Haze, exposure and the post look

- Owner: the mapping rules ("overwrite the same fields of the game's post configuration")
  and both renderers; the values are live uniforms in the library.
- Stops: nothing in the data. Neither `LevelView` nor sec-111's `View` exposes the post
  uniforms, so a changing haze or exposure needs a new handle in the renderer's surface.
- The bloom threshold, radius, knee and tints are fixed at construction, and game-owned.

### The scene-pass contract

- Owner: rendering-poc and sec-111's scene contract, independent of the level.
- Stops: smoke, dust, steam, soot and glass, which need ordinary transparency. Additive
  effects remain open. A VFX that lights surfaces needs a light from the start.

## 6. What the level's data could carry or leave free

Each option states its facts; none is chosen here.

### Identity

- A: points stay anonymous. Facts: today's shape; sec-111 can address a point only by its
  index or position; any later name is a format change.
- B: each point carries an id. Facts: one new key in the lighting record and its admission;
  the decoder rejects unknown keys, so both sides take it at once.
- C: a point names its partner, a glow, a static object or a prop. Facts: the lamp and
  point pairs exist only in the authoring method today; a litter already names its support
  slab (`extras.support`), a precedent for a link.

### Glows

- D: glows stay GLB-only. Facts: today's contract; a renderer reads a glow from a material's
  `extras`; the `.json` holds none.
- E: the `.json` carries the glow table. Facts: a second home for colour and strength unless
  the GLB keeps only the name; level-glb's contract would change with it.
- F: glow materials stay shared per path and glow. Facts: one value per glow.
- G: a material or a per-vertex term per object or per zone. Facts: more materials or a new
  vertex attribute in the GLB; `_SLAB` already carries a per-slab `number`.

### Groups and time

- H: points and glows carry a group or zone tag. Facts: none exists; a grouping by position
  needs no data but has no stable identity.
- I: reserved points at intensity 0 for run-time light. Facts: three keeps them in the set;
  every lit pixel evaluates each one (`LOOK-AND-LIGHTING.md`, "The tuning handles").
- J: the level carries animation data. Facts: none exists; the format holds "exactly the
  values the renderer consumes" (research-rendering-lighting.md, section 4).
- K: the level carries none, and sec-111 code drives values. Facts: the lighting record
  then holds initial values only.

### What the rules could state

- L: keep "never changes afterwards". Facts: today's mapping rule; it forbids any change.
- M: restate it as a fixed light count with free values. Facts: three's cache key holds the
  light ids and shadow flags, not their values.

## 7. sec-111's statements on lighting animation and VFX

No sec-111 document or task document plans lighting animation or new VFX. Searched:
`docs/project-management/README.md` (no active task; TASK-001 to TASK-017 archived),
`docs/mvp-design-doc.md`, `docs/technical-proposal.md`, `docs/gameplay-design-doc/`,
`docs/KNOWLEDGE.md`, `README.md`, the engine knowledge documents and `docs/researches/`.
The statements that bound them, quoted:

- `engine/view/docs/scene.md`: "The light set stays fixed: one shadowed sky light and four
  unshadowed point lights. Changing light presence changes lit programs."
- `engine/view/docs/scene.md`: "The sky shadow renders once. Dynamic objects must not cast
  shadows or they become part of that static image; they may receive it."
- `engine/vfx/CLAUDE.md`: "No lights. Glow comes from bloom; the renderer's light count
  must never change."
- `engine/vfx/CLAUDE.md`: "Dust, smoke and soot have no compatible path; do not add them."
- `docs/mvp-design-doc.md`: "Sparks mark ranged impacts; blue-white electrical effects
  accompany punches and spear moments." And: "The static sky shadow does not update for
  moving minions, debris or wall holes."
- `docs/technical-proposal.md`, "Rendering and startup": "Static sky shadows exclude
  dynamic casters and do not update after destruction."

On this repository's side, the only statement is the owner's, in
`TASK-001-deliver-the-dark-factory-level.md`: "The art direction wants to animate the lights
in gameplay and to add more VFX. The integration must not compromise that further visual
development." `research-rendering-lighting.md` lists "Lights that switch on or off" as
impossible in this pipeline; section 5 above refines it: switching by intensity is inferred
possible, switching by presence is not.

## 8. Evidence boundary

Verified: every file and symbol named above. Inferred, not observed:

- that a light's intensity, colour, range and position change without a program rebuild, and
  that intensity 0 keeps its program and its per-pixel cost;
- that a changed `emissiveIntensity` reaches a `StaticNodeMaterial` and a GLB fallback
  material without a rebuild;
- every cost statement: no frame time, compile time or shadow refresh was measured.

Not checked:

- which glowing paths draw as twins and which as GLB fallbacks in the built level;
- sec-111's level preparation, recording format and replay paths beyond the documents
  quoted; the destruction lib; rendering-poc's demo lighting source;
- the 2026-11-17 look-dev documents beyond their adoption sections and glow lines.

No browser ran, no `docs/archived` was read and no git history was read.
