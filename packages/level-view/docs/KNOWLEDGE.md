# level-view knowledge

`@level-designer/level-view` draws a level pair through the rendering-poc pipeline, so the
QA page shows the game's mood. It owns the start, the GLB loading, the mesh rules, the
lighting mapping, the post pipeline with the game's look, the frame call and the failure
hooks. It reaches the renderer through
[render-gateway](../../render-gateway/docs/KNOWLEDGE.md), the game values through
[sec111-gateway](../../sec111-gateway/docs/KNOWLEDGE.md) and the lighting section through
[level-format](../../level-format/docs/KNOWLEDGE.md).

## Units

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
3. It parses the GLB and applies the mesh rules.
4. It dresses the scene by the mapping rules and bakes the environment.
5. It builds the camera, lets the library choose the scene-pass quality, and builds the
   post uniforms with the game's 12 signature slots and the post pipeline with the look.
6. It compiles every material against the real scene-pass target, with frustum culling
   off, then renders the game's two warm-up frames from the interior centre.

The outcome is `started`, `refused` or `failed`:

- a refusal of the open passes through, and nothing is loaded;
- a throw in the open fails step `renderer`;
- a throw in the load fails step `glb`;
- a throw in the present or the warm-up fails step `renderer`; a warm-up failure first
  detaches the window resize;
- every failure after the open releases the renderer once; a release that fails too
  joins the step's error in one message;
- a thrown value that is not an `Error` becomes one with its text.

The promise never rejects. A stalled step has no timeout here: the page's status strip
names its running boot step.

## The mapping rules as built

- Key: a directional light placed at the interior centre plus `direction` times half the
  box diagonal, aimed at the centre. Its orthographic shadow camera is fitted in light
  space to the eight interior corners, with no pad and no margin. The shadow is the
  renderer's default PCF with the stored map size, biases and radius; it renders once.
- Points: a point light each, decay 2, no shadow. Without a key there is no directional
  light.
- Environment: a back-faced sphere of radius 10, 64 by 32 segments, whose vertex colours
  are the formula at each vertex's unit direction, in linear working space. The PMREM
  bake uses blur 0.04; `environment.intensity` sets the scene's environment intensity.
- Clear colour: the game's, `GAME_VALUES.page.clearColor` from sec111-gateway under its drift
  test, or this component's loud magenta (1, 0, 1) for `leak`.
- Look: the game's post configuration with the level's haze density, colour, glow and
  exposure written over it.
- Mesh rules: every mesh casts and receives shadows with two-sided shadow faces, every
  texture of its materials filters at anisotropy 8, and every matrix freezes. Sidedness
  and emissive strength stay as the GLB states them.
- The light set is complete before the compile, and the view exposes no light.

The key's fitted volume equals the interior box only for a vertical key. For a tilted key
its near plane passes through the top corner nearest the light, so every caster above the
box top, the roof included, shadows the interior.

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

## Limits a human judges in QA

No test under Bun can start the renderer, bake, compile or draw. The human judges:

- that the start reaches WebGPU on the QA machine and the level shows after the warm-up;
- the haze, bloom, exposure and the look of bright strips against the game;
- shadow acne and leaks with the stored biases, and, for a vertical key, that the roof
  above the interior box casts no shadow, which relies on the shadow camera clipping
  casters outside its frustum;
- the environment's look: vertex colours interpolate linearly between the sphere's rings,
  unlike sec-111's per-pixel evaluation, and the difference after the blur is inferred to
  be invisible, not observed;
- that a lost device or a GPU error shows on the page.
