# Research: renderer, level lighting and the QA app

Scope: the rendering-poc pipeline, sec-111's use of it, a lighting section for the level
`.json`, and the thinnest QA app that renders through the same pipeline. Paths are relative
to `D:\w\vico\fps\`. "Verified" means read in the named file or measured with the named
probe. "Inferred" means reasoned from those facts and not observed on a GPU.

## Recommendations in one place

- Light model: a fixed set of three.js forward lights with static PCF shadows: at most one
  shadowed directional key and eight unshadowed points.
- Format: the level `.json` owns environment, key, points, haze and exposure. Emissive is a
  GLB material fact. Bloom, grade, lens and x-ray stay game-owned.
- Mood: reachable, except light shafts, glass, strip-shaped floor reflections and light
  cast by emissive surfaces.
- QA app: import `@rendering-poc/library` through a `file:` dependency, as skin-designer
  does with Anim Lib. Do not import `@sec111/view`.
- sec-111: replace the view's hardcoded lighting and material audit with level data. About
  500 lines leave the view and about 250 arrive.
- No binding decision is infeasible on rendering grounds. Section 8 lists five conditions.

## 1. Light model

Verified:

- The library owns no lights. "Your app owns asset loading, lights, input, gameplay, UI, and
  visual settings" (`rendering-poc/docs/integration.md`). The library renders the app's
  scene into an HDR target, builds bloom and draws one composite
  (`rendering-poc/packages/library/src/render/pipeline.ts`).
- Lights are plain three.js lights, shaded forward by three 0.186.1's default `Lighting`.
  Every lit material evaluates every visible light; nothing culls lights per object or per
  tile, and nothing fixes a light count (`three/src/nodes/lighting/LightsNode.js`). three
  ships `ClusteredLighting` and `DynamicLighting` addons; neither repository uses them.
- three registers point, directional, spot, rect-area, ambient, hemisphere, light-probe,
  IES-spot and projector lights (`StandardNodeLibrary.js`). Only three types have run here:
  sec-111 uses 1 directional and 4 points; the rendering-poc demo uses 1 directional,
  4 spots and 4 points, all shadowed (`packages/demo/src/world/appearance/lighting.ts`).
- Shadows are PCF with a filter radius; `PCFSoftShadowMap` is removed on this path
  (`rendering-poc/docs/rendering-api.md`). All shadows here are static: `autoUpdate` off,
  one render on the first frame. Sizes in use: directional 4096 (sec-111), spot 2048 and
  point cube 512 (demo).
- Haze is depth fog in the composite: `fog = 1 - exp(-distance * hazeDensity)`, and the
  colour mixes toward `hazeColor + wideBloom * hazeGlow` (`compositeNormal.ts`). It has one
  colour, no height falloff and no shadowing. All three values are live uniforms.
- Exposure multiplies linear HDR before the grade. Tone mapping is ACES filmic, fixed by
  the library's `createRenderer`, applied inside the composite, followed by sRGB output.
- Bloom is three's `BloomNode` on scene colour. Radius, threshold, knee and five mip tints
  are read at construction; strength is a live uniform. One broad mip also lights the haze,
  the lens dirt and the vignette (`bloom.ts`, `compositeNormal.ts`).
- Emissive surfaces write HDR colour into the scene pass. Above the bloom threshold they
  glow, and the broad mip brightens the haze around them. They light no other surface: the
  pipeline has no global illumination. sec-111 pairs each lit strip row with a point light
  and dims the other strips (`sec-111/engine/view/src/lighting/fixtures.ts`). `GLTFLoader`
  reads `KHR_materials_emissive_strength`, so a GLB material can own a strip's brightness.
- sec-111 runs the base graph. Its look has no `realism` entry, so GTAO and screen-space
  reflections are off (`sec-111/engine/view/src/look/demo-look.ts`, `look.ts`).

Cost of a light:

- Verified: no measurement exists. The perf notes state that lighting and shadows remain
  unranked (`rendering-poc/docs/notes/2026-11-09-perf/README.md`), and no real-GPU baseline
  is established (`docs/writeup/s11-performance.md`).
- Inferred: an unshadowed point light adds one analytic evaluation to every lit fragment of
  the scene pass (level, minions, walls, hands), and no pass or texture. A shadowed light
  adds a depth map (about 64 MB at 4096 square), one startup render of all casters and
  filtered lookups in every lit fragment. Shadow maps also count against WebGPU's default
  16 sampled textures per shader stage; three requests no higher limit (`WebGPUBackend.js`).

Recommendation: keep today's proven shape and make it data: 0 or 1 directional key with the
static 4096 shadow, plus up to 8 unshadowed points. The cap equals the demo's nine lights.
Alternative: shadowed spots, as in the demo. It lost because sec-111 has never run them in
the 120 m hall, each adds a 2048 map and a second shadow path, and one overhead key already
grounds the objects. Add spots only if QA shows the key is not enough.

## 2. Today's stage lighting

Everything lives in sec-111, package `@sec111/view` (`engine/view`), units `lighting`,
`look`, `level` and `render`. rendering-poc holds only the demo the values were ported from.

Hardcoded today (verified; values at the prepared scale 3.89956 were printed by the probe
`guard-probe.ts`, which imports the sec-111 modules at run time):

- `lighting/tuning.ts`, table `DEMO` and `arenaLighting(scale)`:
  - environment intensity 0.5; +Z lobe colour [0.8, 0.896, 1.024].
  - sky light: colour [0.72, 0.82, 1.0], intensity 3.0, toward [0, 0.287, 0.958]; shadow map
    4096, bias -0.0003, normal bias 0.039, radius 3, pad 1.17 m, margin 3.9 m.
  - four practicals: 395.4 cd, range 46.8 m, colour [0.8, 0.9, 1.0], at y = 15.79 m and
    (x, z) = (9.83, 16.73), (0.55, -10.45), (-8.77, -37.63), (0.55, -64.77).
  - strip mask: radius 4.68 m, lit gain 1, dim gain 0.06. Daylight spill: density 0.0128
    per metre, reach 54.6 m, colour [0.11, 0.13, 0.16].
- `lighting/environment.ts`: base (0.06, 0.066, 0.08), bounce (0.08, 0.086, 0.098), the lobe
  shape, sphere radius 10, PMREM blur 0.04. `lighting.ts`: clear colour (0.004, 0.005, 0.007).
- `look/demo-look.ts` and `look.ts`: the whole `PostConfig` (haze 0.03 / scale = 0.00769,
  haze colour [0.006, 0.01, 0.017], glow 0.9, exposure 1.0, bloom 0.7 / 0.6 / 0.75 / 0.35,
  grade, lens, x-ray, health bar) and the lens: FOV 92 degrees, near 0.05 m, far 160 m.
- `render/start.ts` and `presenter.ts`: pixel-ratio cap 1.5, 12 signature slots, scene
  scale 1, WebGPU only.
- `level/audit.ts`: PBR overrides for five materials by glTF name, five kept as authored,
  the fixture material, seven meshes kept double-sided. `end-wall.ts`: the wall's look.

How the stage is loaded, scaled and audited (verified in `engine/view/src/level/` and
`view.ts`):

- Load: plain `GLTFLoader`, no Draco, meshopt or KTX2, at source scale (`load.ts`).
- Plan: every mesh joins a group keyed by material name, sidedness and vertex layout. An
  unaudited material name, a duplicate mesh name, a mirrored transform or a multi-material
  mesh throws (`plan.ts`).
- Build: the stage root scales by `metrics.scale` about the origin; world transforms bake
  into one merged geometry per group; audited materials render front faces with two-sided
  shadows and anisotropy 8; every merged mesh casts and receives shadows; matrices freeze
  (`build.ts`, `materials.ts`).
- The end wall is a box mesh from the prepared level that receives the sky shadow and casts
  none, so the sky light enters through it (`end-wall.ts`).
- Lighting then installs the environment, clear colour, spill, five lights and strip mask.
  Hands and the pipeline follow: hands read the environment once, and the pipeline reads
  the background at construction.

Recommendation: level-designer bakes the audit into its output GLB (corrected PBR factors,
glTF `doubleSided`, separate lit and dim strip materials, sealing geometry). The renderer
then applies four generic rules to every level mesh: cast and receive shadows, two-sided
shadows, anisotropy 8, frozen matrices. Alternative: keep a name-keyed audit in the
renderer. It lost because the QA app and the game would each need a copy of the table, and
every new dressing material would need an entry in both.

## 3. Constraints on a level-defined light set

Verified sources: `sec-111/engine/view/CLAUDE.md`, `engine/view/docs/scene.md`,
`engine/wall-view/docs/rendering.md`, `rendering-poc/docs/rendering-contracts.md`,
`three/src/nodes/lighting/LightsNode.js`, `three/src/renderers/common/Renderer.js`.

- Fixed for the view's lifetime. Lit programs are keyed by each light's id and its
  `castShadow` flag, and a hidden light leaves the set. Adding, removing, hiding or
  toggling a shadow rebuilds every lit program.
- Complete before compile. The light set, environment and every material exist before
  `compile()`, which runs against the real scene-pass target. The first draw also renders
  the static shadow. sec-111 shows two warm-up frames first.
- May change without a rebuild: colour, intensity, position, range, haze, exposure, bloom
  strength and grade. They are uniforms. Moving the key needs one shadow refresh.
- Fixed at pipeline construction: clear colour, camera far plane, bloom radius, threshold,
  knee and tints, MSAA sample count, signature capacity.
- Static shadows. The key's shadow renders once. Objects that move must not cast. Damage
  does not refresh the map.
- Opaque materials only. Colour alpha carries view depth, so blended glass, decals and
  smoke corrupt haze and x-ray. Additive particles need the library helper.
- No material creation and no `needsUpdate` in the frame path. Startup order: environment,
  then hands, then pipeline.
- Plain glTF 2.0 for the level GLB: no Draco, meshopt or KTX2. World units are metres, +Y
  up. The far plane is 160 m and is checked against the level's bounds.

Impossible in this pipeline:

- Lights that switch on or off, or a light count that changes during play.
- Shadowed or shaped volumetric light: shafts, cones, height fog.
- Light cast by emissive surfaces. A strip lights geometry only through a paired light.
- Translucent surfaces such as glass enclosures.
- Screen-space reflections and contact occlusion, while sec-111 keeps `realism` off.
- A daylight key in the sealed hall. Every level mesh casts, so the sealing geometry blocks
  an outside light. Today's light enters only because the end wall is a special non-caster.

Recommendation: treat the light set as load-time data, and enforce the caps and types when
the level file is admitted. Alternative: three's `DynamicLighting` addon, which batches
lights so the count can change. It lost because neither repository has run it and it
replaces the lighting path the game ships.

## 4. Lighting format

Principle: the section holds exactly the values the renderer consumes and no derivation
rule. Colours are linear RGB triples. Lengths are scaled metres in the level frame.

Recommended `lighting` section:

- `environment.intensity`: number, maps to `scene.environmentIntensity`.
- `environment.ambient`, `environment.overhead`: colours of the baked interior environment.
  They are today's `base` and `bounce` in `environment.ts`; the +Z daylight lobe is dropped.
- `key` (omit for none): `color`, `intensity`, `direction` (unit vector from the hall toward
  the light), and `shadow` with `mapSize`, `bias`, `normalBias`, `radius`.
- `points` (0 to 8 entries): `position`, `color`, `intensity` in candela, `range` in metres.
- `haze`: `density` per metre, `color`, `glow`.
- `exposure`: number.

Starting baseline: today's game values from section 2 fill every field above. With the key
turned overhead (`direction` [0, 1, 0]), the first file reproduces the current game
lighting apart from its daylight parts: the spill and the +Z environment lobe.

Mapping rules both renderers follow (they belong in the format's knowledge document):

- Point: `PointLight(color, intensity, range, decay 2)`, no shadow.
- Key: `DirectionalLight(color, intensity)` aimed at the interior box's centre. Its
  orthographic shadow frustum fits the interior box exactly, with no pad, so the roof slab
  above the box casts nothing and trusses and cranes inside it do. Static PCF.
- Environment: a back-faced sphere of radius 10 coloured
  `ambient * (0.4 + 0.6 * smoothstep(-0.7, 0.05, y)) + overhead * smoothstep(-0.1, 0.9, y)`
  over the unit direction, baked by `PMREMGenerator.fromScene` with blur 0.04.
- Clear colour stays the renderer constant (0.004, 0.005, 0.007): a sealed hall shows none.

Deliberately outside the section, each with its one owner:

- Emissive colour and strength: GLB materials.
- Bloom, grade, lens, x-ray, health bars, camera lens, pixel-ratio cap: the game.
- Tone mapping: the library. Light decay and shadow type: the mapping rules.
- The interior box: the level fact the validator already needs for "outside the interior".
  The key's shadow volume reuses it, so no second box exists.

Shadow tuning sits in the file because it is fitted to this level's shadow volume and the
human judges acne and leaks in QA. A renderer constant would need two synchronized copies.

Validator checks that follow from the renderer: at most 8 points and 1 key; point positions
inside the interior and above the floor; finite colours in 0..1; intensity, range and
density not negative; unit `direction` with positive Y; `mapSize` one of 1024, 2048, 4096;
no `KHR_lights_punctual` in the GLB, so lights have one owner.

Alternative: the level also owns bloom and the colour grade. It lost because they are the
robot camera's look shared by every level and by the x-ray transition, and emissive
strength already controls how much a strip glows against the fixed threshold.

## 5. Mood feasibility

The dark-factory references are reachable in character, with known limits. The mechanisms
are verified, the result is inferred; only the human can confirm the image.

- Near-black ambient: lower `environment.intensity` and darken its two colours; omit the key
  or keep it dim and cold. The game's grade already leans cold: tint [0.8, 0.93, 1.1], teal
  shadow tint, saturation 0.82.
- Cyan or teal strips: emissive GLB materials with strength well above the 0.75 bloom
  threshold. The strip core clips toward white and the halo keeps the colour, as in the
  references. Dim strips stay below the threshold and do not glow.
- Light from the strips: a few teal points near the brightest runs. Eight points cannot
  follow every strip in a 120 m hall, so most strips glow without lighting surroundings.
- Small coloured accents: small emissive meshes. They cost nothing and get a bloom halo.
  Spend a point light only where an accent must tint nearby surfaces. The demo pairs red
  beacons with small red points the same way.
- Visible haze: raise `haze.color` to a deep blue and `haze.density` above today's 0.0077.
  Distant geometry then fades into coloured haze and near machines read as silhouettes, as
  in the first reference. `haze.glow` brightens the haze around strips.
- Depth and grounding: the overhead key's static shadow.

Limits to expect:

- No beams or cones in the haze, and no layered or patchy fog.
- No strip-shaped floor reflections: a glossy floor shows round highlights from point
  lights and a soft environment reflection only.
- No glass: the second reference's glazed enclosures need opaque panels. That reference is
  also high-key; it guides colour, not exposure.
- No sparks from this format: they are an effects feature, and the format is static light.
- Many bright strips in view can flood the frame: the game's lens dirt (2.3) and bloom
  (0.7) were tuned with most strips dimmed to 0.06. Keep the lit strip area modest, or the
  owner retunes those game-owned values in sec-111.

Recommendation: build the mood from emissive materials, haze and a low environment first;
add points last, within the cap. Alternative: light every strip with `RectAreaLight`. It
lost because it is unshadowed, needs extra lookup textures, and has never run in either
repository.

## 6. QA app reuse

Recommendation: the QA app imports the rendering-poc library directly and nothing from
sec-111 at run time.

Why not `@sec111/view` (verified in `engine/view/src/index.ts`, `view.ts`, `plan.ts`):

- Its only entry, `createView`, needs a `PreparedLevel`, loads its own stage, throws on any
  unaudited material name, installs the hardcoded lighting and builds hands and the
  first-person rig. `arenaLook`, `CAMERA_LENS` and the lighting units are not exported.
- Changing that needs sec-111 edits, which are barred until the level passes QA.

Imports for the QA client:

- `@rendering-poc/library/renderer` (`createRenderer`, `attachWindowResize`),
  `/post-config`, `/uniforms`, `/pipeline`, `/quality`, and `/stats` for an FPS readout.
- `three/webgpu` (`PMREMGenerator`), `three/tsl`, `three/addons/loaders/GLTFLoader.js`.

What the QA app must repeat from the game, because it cannot import it:

- Renderer start: WebGPU only, pixel-ratio cap 1.5; reject a WebGL2 fallback.
- Camera: FOV 92 degrees, near 0.05 m, far 160 m, rotation order YXZ.
- Quality: `resolveRenderQuality` with no override. Twelve signature slots, all empty, so
  the composite costs what the game's does.
- Look: the game's `PostConfig` with the level's haze and exposure written over it.
- Level meshes: the four generic rules of section 2.
- Frame: clamp the delta to 1/15 s, set `uniforms.time`, call `syncCamera(camera, dt)`,
  then `render()`. Compile with frustum culling off and render two frames before showing.

Keep the copied game values in one module of the QA app and guard them with a drift test.
Verified by `guard-probe.ts`: a Bun script in level-designer can import
`sec-111/engine/view/src/look/look.ts` and `lighting/tuning.ts` at run time and read
`arenaLook(scale)`, `CAMERA_LENS` and `arenaLighting(scale)`; their imports of other
packages are type-only. The test fails when sec-111 changes a game-owned value, as
skin-designer's sibling-drift test does for Anim Lib. The pixel-ratio cap is a private
constant and cannot be guarded this way.

Linking: use skin-designer's `file:` dependency, not sec-111's linkage.

- sec-111's linkage is a 1,037-line tool: a `paths` link map, generated declaration twins,
  a test preload and a bundler plugin (`sec-111/tools/linkage`). It runs sibling source in
  place and needs each sibling installed. The TypeScript guideline bans `paths`.
- skin-designer declares `"file:../../../anim-poc/packages/anim-core"`. Bun copies the
  package into the local store with its own `three` and `@types/three`; a 23-line detach
  script breaks Windows hard links and a 74-line drift test guards the copy
  (`skin-designer/packages/anim-gateway`).
- Measured for rendering-poc (probe `probe-render-link`, a hand-made copy in the `file:`
  layout, checked with level-designer's TypeScript 7.0.2 and compiler settings):
  - As configured: 27 errors, all TS5097, because the library imports with `.ts`
    extensions. With `allowImportingTsExtensions: true` added: 0 errors, and a sketch using
    renderer, pipeline, uniforms, quality and vision type-checks.
  - `Bun.build` for the browser succeeds with one three core: 2,129 KB plain and 1,177 KB
    minified. Aliasing bare `three` to `three/webgpu` gives 1,958 KB and 1,019 KB. The
    alias saves size only, so skip it.
- Required: the `file:` dependency in the one package that bridges to the renderer,
  `three` 0.186.1 with a root override, `@types/three` 0.186.0, the tsconfig flag, the
  detach step in `just setup` and the drift test.

Alternative: copy sec-111's linkage. It lost on size and on the `paths` ban; its one
advantage, always running the sibling's live source, is covered by the drift test.

Page and server (precedent `skin-designer/packages/app`):

- A loopback Bun server on `127.0.0.1` bundles `index.html` once with `Bun.build` and
  serves it with the level pair. `http://127.0.0.1` is a secure context, which WebGPU needs.
- The canvas needs a CSS box of the window size; the renderer sizes only the backing store.
- Chrome on desktop with hardware acceleration. Probe `navigator.gpu` and show a message
  when it is missing. Pointer lock needs a click. No special response headers are needed.

Cameras:

- Both own one `PerspectiveCamera` and update its matrices before `syncCamera`. The
  renderer needs nothing else from them: no hands, no vision controller, no signatures.
- Fly: yaw and pitch from pointer-lock deltas, velocity integration, no collision.
- Walk: an eye 1.72 m above the floor (player height 1.87 m times eye ratio 0.92), radius
  0.36 m, walk 3.5 and sprint 5.5 m/s (`engine/level-data`, `games/arena-sim` tuning). It
  needs a floor probe and a blocker probe against the level geometry.
- Measured with plain `three.Raycaster` on the unmerged base stage (48 meshes, 113,697
  triangles, probe `raycast-probe.ts`, under Bun): 0.06 ms per downward ray limited to 4 m
  and 0.20 ms per 1 m forward ray. One floor ray plus four blocker rays cost about 1 ms a
  frame, and about 3 ms at 300,000 triangles if cost grows with triangle count. No BVH
  dependency is needed while the QA app keeps the GLB meshes unmerged.

## 7. The sec-111 gap

Sizes: S is under 100 changed lines, M is 100 to 300. All in `engine/view` unless named.

- Admit the lighting section once, with the caps, at the level-data boundary (contract,
  codec, tests), and carry it to the view. M. Whether level-prep passes it through or the
  view receives the level file directly is the data-flow owner's decision.
- `lighting/tuning.ts` (137 lines), `spill.ts` and `fixtures.ts`: delete. Values come from
  the level, no daylight remains, and strip brightness is a GLB material fact. S.
- `lighting/lighting.ts`, `shadow.ts`, `environment.ts`: build the key and points from
  data, fit the shadow to the interior box without pad, take two environment colours and
  drop the lobe. M, tests included.
- `level/audit.ts`, `materials.ts`, `plan.ts`: remove the name-keyed audit and the
  fixture requirement; sidedness comes from glTF. `end-wall.ts`: delete, the GLB seals the
  hall. `build.ts`: stop scaling the stage, since the GLB is already in scaled metres. M.
- `look/look.ts`: haze and exposure come from the level. The x-ray fade distance, today
  `24 * scale`, becomes a constant or derives from the interior. Recheck the 160 m far
  plane against the new bounds. S.
- `load.ts`: the stage path names the new level. Serving already delivers `.glb` and
  `.json` from the asset tree. S.
- Documents: `engine/view` scene document and rules (fixed light set wording, scale-derived
  tuning), the arena QA guide's lighting items. S.
- No code change, but human QA: minions, walls, hands and effects compile against the new
  light set, and frame cost rises with more than five lights.
- Optional, owner's call: refresh the key shadow when a dressed object is destroyed. S.

Net: roughly 500 lines leave the view (tuning, spill, fixtures, audit, end wall, parts of
the tests) and roughly 250 arrive. Alternative: keep the game's lighting in source and copy
values from the approved file by hand. It lost because two owners of the same numbers
drift, and the binding decision says the approved mood is the game's mood.

## 8. Conditions and risks for the lead

None makes a binding decision infeasible. Each needs a decision or an accepted limit.

- Game-owned look. The QA mood also depends on the game's bloom, grade and lens values,
  which sec-111 does not export and may not change yet. The QA app must copy them under the
  drift test of section 6. Without the test, "same mood" silently stops holding.
- Destructible dressing in the game. sec-111 draws destructible objects with wall-view
  finishes chosen by preset, and those "add no emissive light"
  (`engine/wall-view/docs/rendering.md`). The QA app draws the GLB's materials. Lights,
  haze and post match by construction; the surface look of dressed objects matches only if
  the game later draws them as the GLB does. This bounds what "the approved mood is the
  mood the game shows" can promise.
- Emissive strips. For the same reason, strips at conveyor height cannot sit on
  destructible objects today. They must be static luminaire geometry in the GLB, which
  touches "never add static dressing". The base stage already has static ceiling strips.
- Stale shadows. The static shadow keeps a destroyed object's silhouette; sec-111 accepts
  this for today's six walls. With all cover destructible it will show far more. Options:
  accept, refresh on destruction, or omit the key.
- Readability and cost in the game. The QA app has no minions, hands, walls or effects.
  The human cannot judge there whether enemies stay readable in near-black ambient, and
  the QA frame rate overstates the game's. Keep the light count near today's five until
  the game is measured.

## 9. Evidence boundary

Probes live in the scratch directory under `probe-render-link/` and ran with
`mise exec -- bun` from level-designer; none wrote outside the scratch directory:
`tsconfig.json`, `tsconfig.b.json` and `src/main.ts` (type checks), `bundle-probe.ts`
(bundle sizes), `raycast-probe.ts` (ray costs), `guard-probe.ts` (sec-111 values). The
probe resolved `three` through two junctions to sec-111's install; they are removed, so a
rerun must recreate them. A deliberate type defect was reported, so the zero is real.

Inferred, not observed on a GPU:

- Every cost statement about lights and shadows, and the 16-texture limit's effect.
- That fitting the key's shadow to the interior box keeps the roof from casting: it relies
  on the shadow camera clipping casters outside its frustum.
- That ACES leaves a white core and a coloured halo on bright cyan strips, and that many
  lit strips flood the lens dirt.
- That ray cost scales with triangle count for the dressed level.

Not checked:

- Any image, frame time, shader compile or startup hitch: no browser was run.
- A real `bun install` of the `file:` dependency in level-designer. The copy was made by
  hand; hard-link and detach behaviour comes from skin-designer's documents.
- How `allowImportingTsExtensions` interacts with level-designer's oxlint, tsane and knip.
- The x-ray look of the new level, and spot or rect-area lights on this pipeline.
- sec-111's level-prep, destruction lib and the demo's collision code: other assignments.

No `docs/archived` directory and no git history were read.
