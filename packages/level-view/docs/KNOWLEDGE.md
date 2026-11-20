# level-view knowledge

`@level-designer/level-view` draws a level pair through the rendering-poc pipeline, so the
QA page shows the game's mood. It owns the start, the GLB loading, the painted twins, the
stage wraps, the mesh rules, the lighting mapping, the post pipeline with the authoring look, the frame call
and the failure hooks. It reaches the renderer through
[render-gateway](../../render-gateway/docs/KNOWLEDGE.md), the game values through
[sec111-gateway](../../sec111-gateway/docs/KNOWLEDGE.md), the lighting section and the
finish table through [level-format](../../level-format/docs/KNOWLEDGE.md), and the
painter through [finish-paint](../../finish-paint/docs/KNOWLEDGE.md).

## Units

- `paint`: the painters. It holds the node back end of the painter's arithmetic, the
  static material class, the painted twins and the stage wraps.

- `scene`: the mapping rules and the mesh rules as plain three.js construction: the
  lights, the environment sphere, the clear colour, the loaded GLB, the camera and the look.
  Only the environment bake needs a renderer.
- `gpu`: the renderer boundary. It starts the library's renderer, refuses a WebGL
  fallback and installs the device-lost and error hooks. It owns the WebGPU requirement
  sentence, `WEBGPU_REQUIREMENT`: a refusal's message is that sentence with its detail in
  brackets, and the page's WebGPU probe reads the same sentence.
- The root unit: the start's decisions over its three steps, the real steps, the warm-up
  and compile, and the view with its frame call.

## The start

The start composes three steps: open (start and admit the renderer), load (parse the GLB)
and present (build the scene and the pipeline, attach the window resize, and hand out the
view with a warm-up still to run). One function owns the decisions between them, over
narrow step interfaces, so its tests run on fakes. The real steps run in a fixed order:

1. It starts the library's renderer at the window's size with the game's pixel-ratio cap
   and no GPU timing. A browser without any graphics backend is refused.
2. It refuses a renderer that fell back to WebGL 2 and releases it. A WebGPU renderer gets
   both failure hooks at once, so a loss during the later steps also reaches the callback.
3. It parses the GLB, gives each painted material its twin or its stage wrap from the
   finish table and the interior box, and applies the mesh rules.
4. It dresses the scene by the mapping rules and bakes the environment.
5. It builds the camera, lets the library choose the scene-pass quality, and builds the
   post uniforms with the game's 12 signature slots and the post pipeline with the look.
6. It compiles every material against the real scene-pass target, with frustum culling
   off, then renders the game's two warm-up frames from the interior centre.

The outcome is `started`, `refused` or `failed`:

- a refusal of the open passes through, and nothing is loaded;
- a throw in the open fails step `renderer`;
- a throw in the load fails step `glb`, also a GLB material whose finish path the table
  lacks: the error names the material and the path;
- a throw in the present or the warm-up fails step `renderer`; a warm-up failure first
  detaches the window resize;
- every failure after the open releases the renderer once; a release that fails too
  joins the step's error in one message;
- a thrown value that is not an `Error` becomes one with its text.

The promise never rejects. A stalled step has no timeout here: the page's status strip
names its running boot step.

## The mapping rules as built

- The directional key aims at the interior centre from half a box diagonal along
  `direction`. Its orthographic camera fits the eight corners exactly in light space.
  It renders one PCF shadow using the stored map size, biases and radius.
- Each point light has decay 2 and casts no shadow.
- Environment: a back-faced sphere of radius 10, 64 by 32 segments, whose vertex colours
  are the formula at each vertex's unit direction, in linear working space. The PMREM
  bake uses blur 0.04; `environment.intensity` sets the scene's environment intensity.
- Clear colour: the game's, `GAME_VALUES.page.clearColor` from sec111-gateway under its drift
  test, or this component's loud magenta (1, 0, 1) for `leak`.
- Look: the QA view takes the game's post configuration and sets its own bloom and
  lens dirt for judging factory finishes. The level supplies haze density, colour, glow
  and exposure.
- Mesh rules: every mesh casts and receives shadows with two-sided shadow faces, every
  texture of its materials filters at anisotropy 8, and every matrix freezes. Sidedness
  and emissive strength stay as the GLB states them.
- The light set is complete before the compile, and the view exposes no light.

The key's fitted volume equals the interior box only for a vertical key. For a tilted key
its near plane passes through the top corner nearest the light, so every caster above the
box top, the roof included, shadows the interior.

## The painted twins

A GLB material whose `extras` (three's `userData`) carry `finish` names a finish path, and
the level's table must hold that path. Such a material gets a twin only when its recipe
draws what the GLB's fallback cannot: at least one layer, or a body `shade` other than 1.
The twin is built once in the load and shared by every mesh that draws with it, so the
slabs and boxes of one path and glow share a twin.

Every other material keeps the GLB's own, untouched:

- a plain path at shade 1, lamps included. Its fallback already holds the body's metalness
  and roughness and the glow at its strength times the body's `lit`, and its tint is the
  vertex colour times a white base colour, so a twin would draw the same look at the cost
  of a GPU compile;
- a material without `finish`.

The geometry decides which rule a painted material takes, on its first mesh: a mesh with the
slab data (`_slab`) takes the twin, and any other mesh is the stage's and takes the stage
wrap. A seal's material and a slab of a hall role therefore draw as twins.

A twin is a static material: a standard node material whose observer reports no node to
refresh unless the build injects a per-draw node (the model-view matrix, the model-normal-view
matrix, ambient occlusion or the shadow). three refreshes every draw of a plain node material
in full each frame. A twin's graph reads only vertex attributes and constants, so nothing
goes stale.

A twin draws the path's recipe, as `recipeAt` resolves it, with `finish-paint`'s painter:

- It keeps the source's colour, side and shadow side, and the surface's own normal.
- The tint is the vertex colour, read once, times the source's colour; the twin switches off
  three's own vertex colour product.
- The base shade is the recipe's body over the tint; the layers then paint over it.
- The face comes from the vertex data by the loader's names. The pattern coordinates (`uv`)
  interpolate. The face's size (`uv1`) and the slab numbers (`_slab`: number, seed, wear,
  class) reach the painter through flat varyings.
- The footprint is the longer screen derivative of the pattern coordinates, at least 1e-6 m.
- With a glow, `extras` carry `glowStrength`, the unscaled strength, and the emissive factor
  holds the glow's colour. The twin emits that colour times the strength times the painter's
  emission, and `"glow"` takes the glow's colour. Without a glow the twin emits nothing, and
  `"glow"` takes the finish's `light`.

## The stage wrap

A stage material whose `extras` carry `finish` names a hall finish. When its recipe holds
a layer, the material draws through a wrap; one without a layer, and a stage material
without `finish`, keep the GLB's own, so the ceiling and the trusses pay nothing. One wrap
serves every mesh of its material; a base material and its double-sided twin are two
records, so they take two wraps.

The wrap is a static material that is the source as three's scene pass converts it: every
property copied, the way three's material library does. It sets three slots and no other:

- The base shade is the source's own look. The albedo is the colour factor times the colour
  map, and it is also the tint; the metalness and the roughness are the source's, their maps
  included. The layers paint over it. The colour is opaque, as every base stage material is.
- Every other slot stays the source's: the normal map, the emission, the ambient occlusion,
  the alpha test, the side and the shadow side. Where no layer covers, a mix by 0 returns
  its base, so the wrap shades exactly as its source.
- The face is `finish-paint`'s hall frame rule on the position and the normal in the level
  frame, with the interior box as constants: seed 0 and wear 1. `"glow"` takes the
  finish's `light`.
- The footprint is the longer screen derivative of the face's two coordinates, at least
  1e-6 m.

The level frame is the GLB scene's world frame. The present step adds the scene
untransformed, and each mesh's world matrix composes the `stage` node's scale with the base
node matrices. The position is the world matrix times the vertex, and the normal is the
normal matrix times the geometry's normal, never the normal map's, normalised per pixel for
the 0.7 limit. The mesh rules freeze both matrices, so the wrap refreshes no draw, and it
sets no position node, so the key's shadow renders once as before.

The base stage carries no vertex colours. A wrap keeps the source's vertex colour switch, so
a stage mesh with colours would multiply a layer's colour by them too.

One wrap draws on every surface of its material, which spans more than one floor or wall.
On a curved, smooth-shaded part the interpolated normal can cross the 0.7 limit inside a
triangle. The class then switches along a line across the triangle: a `top` layer draws on
one side of it and an `outside` layer on the other, and the pattern coordinates jump from
plan to wall coordinates there. The footprint, a derivative of those coordinates, spikes
along the line, so a layer with a detail fades out on it and a filtered edge blurs there.

The node back end maps each of the fourteen operations to three's shader node of the same
meaning and argument order. Its `hash` is `latticeHash` over those nodes inside one shader
function, `finishLatticeHash`, which a program declares once and calls per hash.

The graphs are built in the load, and the warm-up compiles one program per twin, one for
each path and glow in use whose recipe draws beyond the fallback, and one per stage wrap. A changed recipe shows at the next start.

## The frame call

`frame(pose, time)` takes the eye in scaled metres and the yaw and pitch in radians: yaw 0
looks along +Z and grows toward +X, and a positive pitch looks up. The camera turns in YXZ
order. The frame delta is the difference of the caller's clock readings, 0 on the first
frame and at most 1/15 s. The frame writes the shader time, syncs the camera, renders and
advances the library's frame counter, which `frameRate` reads.

## Renderer failures

The failure's kind is the structured fact; its message carries the backend's text alone,
with no prefix, and the page composes its own wording from the kind.

A lost GPU device reaches the failure callback as `device-lost` with the message
`<message> (<reason>)`, or `<message>` without a reason; a device destroyed on purpose does
not. The hook first runs three's own handler, which marks the renderer lost, so three stops
compiling and drawing on that device. An uncaptured GPU error reaches the callback as
`gpu-error` with the message `<type>: <message>`, or the text alone. The type package
declares the error hook's argument as a string, while the WebGPU backend passes an object
with a type and a message, so the hook reads either form.

The hooks go in at the admission, so a failure can reach the callback while the start is
still running. After it, the start may resolve `started` or `failed`, or never settle. The
page shows the failure whatever the start does, and stops calling the frame.

## What the tests prove

The tests run under Bun without a GPU and assert scene facts, never a pixel:

- the key aims at the interior centre and fits its shadow volume to the interior box:
  after three's own shadow update the corners meet all six planes; no key gives no light;
- each point light has decay 2, no shadow and the stored colour, intensity and range;
- the clear colour per choice, the environment intensity, and the look;
- the environment formula at the poles and the horizon, and on every sphere vertex;
- a texture-free GLB built in the test loads with the mesh rules, keeps its sidedness, and
  a texture on a level material gets anisotropy 8;
- the frame call poses the camera's matrices before the sync and renders after it, with
  the time, the delta clamp and the frame rate; the compile's culling and the warm-up
  frames, over a recording stand-in of the pipeline;
- the start's outcome for every step failure, the release and the resize detach, over
  fake steps;
- a WebGL fallback is refused and released; both fired hooks reach the callback once, and
  three's own device-lost handler runs first.

### The painters

- On a painted GLB built in the test:
  - a box and two slabs of a layered path share one twin, and a glowing slab of a path with
    a shade has its own;
  - a plain lamp at shade 1 and the stage keep the GLB's materials;
  - a path the table lacks fails the load.
- A twin keeps its source's colour, side and shadow side.
- The static material reports no node to refresh, and does once the build injects a
  per-draw node.
- Each operation of the node back end gives three's node of its meaning, its operands in
  order.
- On the CPU, through three's node builder on a renderer that is only constructed: every
  twin of the committed description's table builds both programs; the face's size and the
  slab numbers are flat varyings; the vertex colour enters once; two `noise` layers call one
  hash function eight times; a glow emits its colour times its strength.

### The stage wraps

- On the painted GLB, two stage meshes of a hall finish share one wrap that keeps the
  source's name, colour, roughness and side; its double-sided twin takes its own, and a slab
  of the same path a twin.
- A stage material without a finish or of a hall finish without a layer keeps its own, and
  a stage path the table lacks fails the load.
- A wrap keeps every map, factor, side and shadow side of a textured source and sets no
  normal, emissive or position node.
- On the CPU, the textured wrap of a hall finish builds both programs and reports no node to
  refresh. A textured material asks the renderer's feature query while it builds, so that
  test answers it with false.

## Limits a human judges in QA

No test under Bun can start the renderer, bake, compile or draw. The human judges the
start and the mood:

- that the start reaches WebGPU on the QA machine and the level shows after the warm-up;
- the haze, bloom, exposure and the look of bright strips against the game;
- shadow acne and leaks with the stored biases, and, for a vertical key, that the roof
  above the interior box casts no shadow, which relies on the shadow camera clipping
  casters outside its frustum;
- the environment's look: vertex colours interpolate linearly between the sphere's rings,
  unlike sec-111's per-pixel evaluation, and the difference after the blur is inferred to
  be invisible, not observed;
- that a lost device or a GPU error shows on the page.

The human also judges the painters:

- that the painters' programs compile on the GPU, with the `_slab` and `uv1` inputs and the
  flat varyings, how long the start's compile takes, and the frame rate with painted props;
- that the scene pass takes a twin as it takes a converted standard material;
- that a wrapped textured program compiles, how long the start's compile takes with the
  wraps, the frame rate with the floors and walls wrapped, and that an uncovered surface
  looks exactly as it passed;
- the painted look: the tints, the inside faces in their slab's colour, the glows under
  bloom, and the footprint's fade at a face's edges, where one pixel quad spans two faces.
