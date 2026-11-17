# Look development design

The look development gives every dressed object of the dark factory a procedural material
and keeps it destructible. This document states the premises, the terms, how cost is
judged and what keeps a painter cheap, the shader templates and their arithmetic, the
layer kinds, the components and what agents see. The [finish format](finish-format.md)
defines the data and the rules by which a renderer draws it. The research reports of
this directory hold the evidence: `research-destruction-look-dev.md` for the method and
`research-dark-factory-surfaces.md` for the surfaces.

**Human note** for non-destructible objects, we also want to apply the same look-development
techniques. Since non-destructible objects will survive gunshots and remain in 100% integrity,
we need such material to look more interesting and detailed (while balance the quality-vs-performance
issue) because players will likely get a close look at them.

## Premises

The owner's decisions:

- A procedural material is a shader, as on the walls, pillars and spheres of Wall Lab, so
  the level's `.glb` stays as small as possible. **Human note** "small" does not have a hard
  limit. But we must justify every data added to the `.glb` file (i.e., there is no better
  way to store such data other than storing them in the `.glb` file; "better" means implementation
  complexity, load-time performance, and ease of development)
- A finish is easy to change for an agent and for a person, so it is data. Shader code
  is templated and instantiated from the sheet, the table of recipes. Performance comes
  first in how that is done.
- Cost is judged by the owner, by eye, from the frame rate that the QA page shows. No
  tool is built to measure it. Wall Lab is unoptimised and holds 60 frames a second on
  the owner's machine, so painters that are designed for performance run faster.
  **Human note** we will take the battle-tested development approach here: deliver the art
  expectation first while using a good-enough technical direction in terms of technical
  design and implementation choices; once the art is approved, we can do focused performance
  tuning, which is a separate task and not within the scope of this task. We follow the
  principle that "do not write code that is obviously slow"
- The materials are baked into the `.glb`, as textures of at most 1,024 px, only when the
  owner finds that the shaders cost too much. **Human note** this does not require a scientific
  comparison or profiling. As said before "do not make obvious perf mistakes" such as
  computing expensive static shadows per frame rather than per-bake them as textures.
- From Wall Lab project, only the walls, the pillars and the spheres are references. Nothing is
  taken from its statues.
- Clearly separate dressed object that stays destructible from the indestructible static objects (if any).
  The dressed destructible objects are for gameplay; the static objects are for mood-creation and gaps-filling.
- The owner judges the look in a browser. No agent launches a server or a browser. Agent should
  restrict the use of headless browser in the foreground of background as this disrupts human's
  workflow.

The rules of the design:

- A finish is a recipe in the level description, built from a closed set of layer kinds.
  The level pair stays data: it carries recipes, never code.
- Each layer kind is one small shader template. A recipe instantiates the templates of
  its layers with its own numbers, as constants, into one static shader for each finish
  path, when the level loads. Nothing is interpreted per pixel.
- A template is written once, over a small arithmetic interface. Filled with shader
  nodes it is shader code; filled with plain numbers it computes the same pattern on the
  CPU, for the art team's finish sheet.
- sec-111 draws a finish by the same rules. At adoption it takes a copy of the
  interface, both back ends, the kinds and the painter, which the owner allowed, and
  guards keep the two copies in step.
- Performance is a property of the design: arithmetic kinds, noise for wear alone, no
  relief, one static material for each finish path, detail that fades with the
  footprint, and plain caps on a recipe. A recipe over a cap blocks the build.
- A mark sits on an existing slab through per-slab parameters. No plate slab is added.
- Lettering is drawn as glyphs by the painter and is built last. If glyphs read badly,
  the way out is one small glyph image; it would be an image in the `.glb`, so the owner
  rules on it then.
- Floor lines wrap the stage's floor materials.
- A slab's triangles share their equal corners, and its colours are stored compactly.
  The size of the `.glb` before and after is a check.
- A painter program that fails shows a message on the page in every run.

The art direction's rulings:

- Props may rise in value so that a finish shows: housings up to the floor's level, crane
  yellow up to about twice it, arms stay black. The lights stay as the owner passed them.
- Finishes ship with their marks: placed marks, bands anchored to the floor or to a prop's
  top, a second hue inside a finish, and lit parts.
- Floor lines are a surface treatment of the existing floor, with no object and no
  collision. The 13 seals may take a finish.
- The crane girders may deepen to about 1.25 m, as a prop-kit dimension. The two brick
  fences become painted block walls and keep the brick physics.
- No car bodies, no new kind, and the arm count stays.
- Painters draw no relief: the hall's light is equal from every side, so a recess is
  painted as a dark line with a light lip.
- The damaged look is verified at adoption. The design states it per finish as data.

## Terms

- Finish: a named procedural material, apart from a slab's physics material and its tint.
- Role: the part of its kind a slab is, such as a container's side or its door.
- Recipe: the definition of one role of a finish as data, an ordered list of layers.
- Finish path: a finish and a role, written `finish/role`. A slab names one.
- Layer kind: one of the closed set of patterns a layer can be, such as bands or cells.
- Template: a layer kind as code, one small function with named parameters that returns
  a coverage. A recipe fills it with its numbers.
- Painter: a recipe evaluated at a point of a face. It returns a shade: albedo,
  roughness, metalness and emission.
- Arithmetic interface: the operations the layer kinds are written over. A back end
  supplies them for one scalar type: numbers on the CPU, shader nodes on the GPU.
- Pattern coordinates: two lengths in metres that place a point on a face of a slab.
- Footprint: the metres of pattern one pixel or one texel covers at a point.
- Hash: one evaluation of the lattice hash, the dearest operation of a painter.

## Cost

### How cost is judged

The QA page shows the frame rate on its heads-up display in every normal run, as
`<n> fps`, capped by the display's refresh rate. The owner reads it while walking the
level, each time finishes land. Painters are designed to hold it, as Wall Lab holds 60
frames a second on the owner's machine with painters that are heavy and unoptimised.

### What the references pay

A painter of Wall Lab is heavy by design. Counted in its source, per pixel and per branch
taken: formed concrete spends 24 hashes, brick 32, the metal sphere 44 and fractured
concrete 56. One value-noise lookup in three axes is eight hashes. Each painter adds a
bump from screen derivatives and specular anti-aliasing. sec-111 pays this on six walls of
about 7 by 3.2 m under one key and four points. The level has one key and eight points,
and every lit pixel evaluates every light.

Measured with a CPU raster at the game's lens on the committed level: from the five spawns
and the centre aisle the props cover 0 to 14 % of the frame, the seals up to 8 % and the
floor 31 to 44 %. One metre from a tall prop the prop covers the whole frame. Painters on
props are therefore cheap at a spawn and dear at cover, and a painter on the floor touches
a third or more of every frame.

### What keeps a painter cheap

- Nothing is interpreted per pixel. A recipe's numbers are constants in the text of its
  shader, not data that the shader reads while it runs.
- Factory finishes are arithmetic: bands, cells, dots and rectangles cost a few
  operations and at most one hash each. Noise serves wear alone. Value noise runs on the
  two pattern coordinates and costs four hashes, half of a lookup of the references.
- A painter draws no relief: no bump from screen derivatives and no specular
  anti-aliasing. Its only derivative is the footprint.
- A recipe is small by its caps: at most 24 layers, of them at most two `noise` layers
  and at most three `glyphs` layers. The recipes of the art direction's briefs spend at
  most 6 hashes, a quarter of the cheapest reference painter.
- The graph has no branch, so a layer costs its arithmetic on every pixel of its slab,
  also outside its mark. A mark that few slabs carry is therefore a role of its own and
  never a layer of a shared recipe.
- One material serves each finish path and glow, and each of its graphs reads static
  inputs only, so no draw is refreshed per frame. Tests pin the material count.
- Every edge is filtered over the footprint, and fine layers fade with it. A painter
  needs no supersampling to stay calm in motion.
- `level-view` paints no interior: the QA app shows no damage.

The caps are plain numbers that an author reads off a recipe: few layers, noise for wear
alone, few legends. `level-format` refuses a recipe over a cap where it admits the
table.

three.js refreshes every draw of a node material in full each frame. The references avoid
that with a static material class, whose observer reports no node to refresh unless the
build injects one of four per-draw nodes: the model-view matrix, the model-normal-view
matrix, ambient occlusion or the shadow. The class is a file of Wall Lab's demo, not of a
library, and sec-111 holds its own copy. `level-view` holds its own too, in its unit
`paint`, because the level draws 608 slab meshes.

### If the owner finds painters too dear

Lighter recipes come first: fewer layers, no noise, fewer floor lines. The bake is the
second remedy, and the owner chooses it. "The fallback" below says what a bake keeps and
what it loses.

## Templates and their arithmetic

A layer kind is a shader template: one small function with named parameters that returns
a coverage. The finish table is the sheet that fills the templates. When a level loads,
`level-view` instantiates the templates of each recipe's layers with that recipe's
numbers and joins them into one static shader for each finish path. The numbers become
constants in the shader's text. The only values a painter reads while it runs are the
slab's own, from the vertex data of the `.glb`: the pattern coordinates, the face's size
and the slab's number, seed, wear and class.

A template is a TypeScript function over a small arithmetic interface, not text in a
shading language. Filled with shader nodes it becomes shader code. Filled with plain
numbers, the same function computes the same pattern on the CPU, which gives the art
team a picture of a finish before the owner spends a look on it.

The component `finish-paint` owns the interface, in its unit `arithmetic`. The interface
is generic over one scalar type and holds fifteen operations:

- `constant`, which lifts a number;
- `add`, `sub`, `mul` and `div`;
- `min`, `max` and `abs`;
- `floor`, `fract` and `sqrt`;
- `mix`, `step` and `smoothstep`, with the argument order of the shading languages;
- `hash`, the lattice hash of a cell given by three scalars.

It has no vector, no branch, no loop, no derivative and no texture. A layer kind receives
its coordinates and the footprint as scalars and returns scalars. A caller that needs a
colour evaluates three scalars. Glyphs add no operation: a stroke's bit and a number's
digit are read with `mul`, `floor` and `sub` on constant powers of two and of ten, so no
division decides a digit.

The hash has one source. `latticeHash` is a function of the unit, written over the other
fourteen operations after Wall Lab's `hash31`, and every back end builds its `hash` from
it. The hash is an operation so that a back end can build it once: the node back end
emits it as one shader function that a painter calls, where plain arithmetic would repeat
its body at every call. The third scalar of a cell carries the slab's seed.

The number back end lives beside the interface. Every operation rounds its result to a
32-bit float, so a hash follows the arithmetic of a GPU as closely as rounding allows. A
pattern's geometry then lies within one rounding of the same place on both back ends: a
band, a cell edge or a rectangle. A hashed value can still differ in single cells,
because a GPU's division, `sqrt`, `mix` and `smoothstep` are not bound to one rounding,
and a `floor` at a boundary can flip. A sheet and a frame therefore agree in every
feature and in the statistics of their noise, never pixel for pixel.

The node back end lives in `level-view`, the one component that depends on three.js for
drawing. It maps each of the fourteen operations to the shader node of the same meaning,
and its `hash` is `latticeHash` over those nodes inside one shader function.

One source for two back ends is the cheapest way to give agents an honest picture. A
template is written once; written twice, by hand for the CPU and for the GPU, it would be
two copies that nobody can compare without a GPU, and a sheet could show what the browser
does not draw. The finish sheet, the value table and the tests of the templates under
Bun are what the number back end is for.

## The layer kinds

The unit `kinds` of `finish-paint` holds the templates, one for each layer kind. Each is
a function over the interface with constant parameters in metres. Each filters an edge
over one footprint centred on it, so coverage is one half on the edge and a pattern
fades to its mean coverage before it aliases:

- `bands`: the coverage of bands of one width that repeat at one period along one
  coordinate, box-filtered over the footprint. A footprint of many periods returns the
  width over the period.
- `cells`: a grid of cells of one width and one height, each row shifted by a share of a
  cell. It returns the coverage of the gaps between cells and one tone per cell from one
  hash. The tone fades to 0.5.
- `dots`: the coverage of discs of one radius on a lattice with a pitch along each
  coordinate. A disc's edge is a linear ramp of the distance over one footprint, and the
  coverage fades to the discs' share of the lattice.
- `rectangle`: the coverage of one axis-aligned rectangle given by two corners.
- `noise`: value noise in 0 to 1 on the two coordinates, with a wavelength along each
  and smooth interpolation between four hashed corners. It fades to 0.5 by its shorter
  wavelength.
- `face`: the whole face, for a face's own paint or light.
- `disc`: the coverage of one disc, ring or diamond at a place, for hubs, plates, points
  and warning labels.
- `border`: the coverage of a frame of one width at one inset from a face's outline.
- `glyphs`: the coverage of a legend, a row of stencil glyphs of seven strokes each. A
  digit comes from the slab's number; a letter is fixed by the layer. A pixel finds the
  glyph box under it and tests the seven strokes against that glyph's mask. It spends no
  hash.

`bands`, `rectangle` and the gaps of `cells` reach their mean by their box filters. The
other fades use the footprint fade, a helper of the unit after Wall Lab's `lodFade`: it
removes a feature as the footprint grows from 0.22 to 0.5 of the feature's wavelength.
The kinds trust their parameters and a positive footprint; the caller owns both. `cells`
and `noise` take the seed as one more scalar and pass it to every hash.

The art direction asked for two things beyond a straight band of a fixed period, and
`bands` takes both without a new kind and without a new operation. A band at 45 degrees
runs along the sum of the two coordinates. A fitted period is the face's extent over a
whole number of periods; the face's size reaches the painter with each vertex. `cells`
and `dots` take the fit the same way. A band with flanks is `bands` with a ramp.

## The painter

The unit `painter` of `finish-paint` evaluates a recipe by the mapping rules of the
finish format: the body, then each layer in order, each mixing its effect into the shade
by its coverage. It is generic over the interface, so one function serves both back
ends. Beside it the unit renders a recipe on the number back end: a face as pixels, and
a face's mean albedo, roughness and metalness.

## Painters in `level-view`

`level-view` holds the unit `paint`: the node back end, the static material class and
the painted materials. It has no switch: a level's finishes are what it draws.

A GLB material's name is its finish path and glow. One painted twin exists for each GLB
material of a seal or a slab. It evaluates that path's recipe from the level `.json` on
the vertex data the GLB carries, keeps the source's colour, sidedness and shadow side,
multiplies the slab's vertex colour once, and keeps the surface's own normal. A glow
gives the emission its colour and strength.

Instantiation happens once, in the view's start, before the compile, so the warm-up
compiles what the frames draw: one shader for each finish path and glow in use, about 45
for the level. Building a shader on the CPU is quick: under Bun, without a GPU, a graph
of forty layers took 2 to 4 ms and its program text 13 to 21 ms. Each program then
compiles once on the GPU, behind the boot's status strip; how long 45 programs take
there shows on the owner's machine alone. A changed recipe shows at the next start of
the QA app, with no code and no rebuild of anything but the level.

For a level with floor lines the stage's floor materials draw through the floor wrap.
The wrap draws a stage material as the GLB states it and mixes the line colour over it
by a mask. The mask is the largest coverage among the level's rectangles in plan
coordinates, each evaluated by the kind `rectangle`, multiplied by two tests: the
surface faces up, and it lies within 0.05 m of a floor height. The wrap goes on the
stage materials that carry a floor and on no other, found once at load, so walls and
ceiling pay nothing. Where the mask is zero, a wrapped material shades exactly as its
source: it keeps every map, factor, side and shadow side. The floor heights and the
lines are in scaled metres, the unit of the eye and of the GLB's world positions.

## A program that fails

A painter program that fails to compile on the GPU raises no failure of its own.
three.js reports it as a console error, skips every draw of it and lets the compile
resolve: the level shows with props missing. The QA page already copies every console
error into the run log. A console error also raises the page alarm, in the place of the
app's other alarms: one banner that says that programs may have failed and
props may be missing, and names the run log. It holds in every run, because every run
draws painters. The page raises it for every console error: it cannot tell a failed
program from another error without reading the error's text.

That is the whole mechanism: one rule in `qa-client`, one test, and one row in the QA
app's list of visible failures. The browser's own console messages still reach neither
the page nor the run log.

## Components

`finish-paint` is the one new component, browser-safe, in `packages/`. It depends on
`level-format` for the recipe's type. Its consumers:

- `level-view`: the interface, the kinds and the painter, for the node back end.
- `snapshot-render`: the pixels of a recipe, for the finish sheet.
- `level-pipeline`: the means of a recipe, for the report's value table.

The other components change inside their duties:

- `level-format` admits the finish table with its caps, the slab's finish data and the
  floor's colour and lines, and writes them in the level `.json`.
- `prop-kit` names a finish path for every slab, takes the new parameters, composes a
  slab's number and deepens the girder.
- `slab-model` returns an indexed mesh with the pattern data of every vertex.
- `level-glb` writes that data, the compact colours, one fallback material per finish
  path and glow, and the seals' pattern data.
- `qa-client` passes the level's recipes, floor lines and floor heights to the view and
  raises the page alarm for a console error.

No gateway changes: no sibling's surface is needed.

## What agents see

An agent never sees a shader's output. The same templates, filled with plain numbers,
give it a preview in its smallest form. Its consumer is the art team's author and its
reviewer, who change a finish and judge it before the owner spends a look on it:

- The finish sheet: each finish path in use on its largest face of the level, with a
  ruler in metres, beside its inside face and its edges. It draws the face at 5 mm per
  pixel, or at 20 mm when the face is longer than 8 m, and again at 40 mm, what survives
  20 m.
- The report's value table: per finish path and tint in use, its mean albedo as linear
  luminance and the computed luminance of a top, a side and an underside, beside the
  floor's 0.054.

The level sheets stay as they are, with every slab in its tint. No agent can judge the
response to the level's lights, bloom, haze, or shimmer in motion. The owner judges
those in the browser, and nobody sees a damaged finish before adoption.

## The fallback

Nothing is built for a bake now. If the owner chooses one, the number back end becomes a
baker: it evaluates a recipe per texel, and `level-glb` writes the result as textures of
at most 1,024 px with the pattern coordinates as texture coordinates. The switch keeps
everything except the node back end.

A tile carries what repeats and what is anchored at one end of a face: a field, a band at
the floor, a fitted bay. It cannot carry what depends on a slab's size at both ends or on
its number: corner posts, chevrons at both girder ends, a code. Under a bake such a mark
moves onto a cut piece of its slab or is dropped. Floor lines have no bake: a tile of
1,024 px over a floor 120 m long holds 12 cm per texel, wider than a line. A bake
therefore costs marks as well as megabytes, which the owner's choice weighs.
