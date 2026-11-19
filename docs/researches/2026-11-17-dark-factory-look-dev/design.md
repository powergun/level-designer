# Look development design

The look development gives every surface of the dark factory that a player sees up close a
procedural material: the dressed objects, which stay destructible, and the seals, the
static objects and the hall's own surfaces, which never break. This document states the
premises, the terms, the shader templates and their arithmetic, the layer kinds, the
components and what agents see. The [finish format](finish-format.md) defines the data
and the rules by which a renderer draws it.
[Non-destructible objects](non-destructible-objects.md) states what a static object is
and how a finish reaches a seal, a static object and the hall.
[Painter cost](painter-cost.md) states how cost is judged, what keeps a painter cheap
and what a bake would keep and lose. The research reports of this directory hold the
evidence: `research-destruction-look-dev.md` for the method and
`research-dark-factory-surfaces.md` for the surfaces.

## Premises

The owner's decisions on materials and cost:

- A procedural material is a shader, as on the walls, pillars and spheres of Wall Lab, so
  the level's `.glb` holds no image for it.
- "Small" sets no hard limit on the `.glb`. Every datum the design adds to it is
  justified: no better place holds it, judged by implementation complexity, load time and
  ease of development. The finish format gives each reason.
- A finish is easy to change for an agent and for a person, so it is data. Shader code is
  templated and instantiated from the sheet, the table of recipes.
- The art comes first, on a good-enough technical direction. The team writes no code that
  is obviously slow and makes no obvious performance mistake: what is static is computed
  once, never per frame. Performance tuning is a separate task, after the art is approved.
- Cost is judged by the owner, by eye, from the frame rate that the QA page shows. No
  tool is built to measure it.
- The materials are baked into the `.glb`, as textures of at most 1,024 px, only when the
  owner finds that the shaders cost too much. The owner decides that by eye: the choice
  needs no comparison and no profile.

The owner's decisions on references and on the work:

- From Wall Lab, only the walls, the pillars and the spheres are references. Nothing is
  taken from its statues.
- The look development is additive. The level the owner passed is proved for layout and
  stays: no passed prop moves, turns or leaves.
- The team pauses at the end of each milestone, and the owner tests the build for art
  direction and overall performance.
- The owner judges the look in a browser. No agent launches a server or a browser, and
  none uses a headless browser, in the foreground or in the background.

The owner's decisions on objects:

- The dressed destructible objects are for gameplay. Static, indestructible objects are
  allowed, for mood and to fill gaps, and stay clearly apart from them.
- A static object is litter, thin and small, or an overhead object on a wall, a deck or
  the ceiling. It has no collision and takes part in no simulation, and it blocks no
  player's path and no player's sight.
- The static objects show a factory in total chaos, which the rebel robots have messed
  up. Litter lies everywhere, papers, metal sheets and broken tools, on the floor and on
  the tops of the production lines and the tables.
- The static objects are cheap and add little geometry.
- Non-destructible objects get the same look development. They never break and players
  see them close up, so their materials are more interesting and detailed, in a balance
  of quality and performance.

The rules of the design, for a finish:

- A finish is a recipe in the level description, built from a closed set of layer kinds.
  The level pair stays data: it carries recipes, never code.
- Each layer kind is one small shader template. A recipe instantiates the templates of
  its layers with its own numbers, as constants, into one static shader for each finish
  path, when the level loads. Nothing is interpreted per pixel.
- A template is written once, over a small arithmetic interface. Filled with shader
  nodes it is shader code; filled with plain numbers it computes the same pattern on the
  CPU, for the art team's finish sheet.
- sec-111 draws a finish by the same rules. At adoption it takes a copy of the
  interface, both back ends, the kinds, the painter and the slab's frame rule, which the
  owner allowed.
- Performance is a property of the design: arithmetic kinds, noise for wear, and for a
  hall surface's variation last, no relief, one static material for each finish path,
  detail that fades with the footprint, and plain caps on a recipe. A recipe over a cap
  blocks the build.

The rules of the design, for what a finish is drawn on:

- A mark sits on an existing slab through per-slab parameters. No plate slab is added.
- A static object is one box of 12 triangles with a finish, in its own section of the
  description and with its own role in the `.glb`; its richness is paint. It joins the
  build after sec-111's preparation and is only drawn; the build holds it to its limits
  with numbers.
- The level holds no table, so a table top is the bench-high top of a prop.
- `level-pipeline` places every static object once, on a floor or on its prop, and every
  consumer reads that placement.
- The hall's surfaces take finishes too: a recipe's layers, drawn over a stage material's
  own look. Floor lines are layers of the floors' recipes.
- Lettering is drawn as glyphs by the painter and is built last. If glyphs read badly,
  the way out is one small glyph image; it would be an image in the `.glb`, so the owner
  rules on it then.
- A painter program that fails shows a message on the page in every run.

The art direction's rulings:

- Props may rise in value so that a finish shows: housings up to the floor's level, crane
  yellow up to about twice it, arms stay black. The lights stand as the owner passed them
  for the mood of a dark factory, and the look and lighting document states them.
- Finishes ship with their marks: placed marks, bands anchored to the floor or to a prop's
  top, a second hue inside a finish, and lit parts.
- The 13 seals, the static objects, the two floors and the side walls take finishes of
  their own, richer in marks than a prop's; the art team's briefs say what that means on
  each surface. Floor lines are a surface treatment of the existing floor, with no object
  and no collision.
- The crane girders deepen to 1.25 m, as a prop-kit dimension. The two brick fences
  become painted block walls and keep the brick physics.
- No car bodies. The kit keeps its nine kinds, and the sixteen arms stay.
- Painters draw no relief: the hall's light is equal from every side, so a recess is
  painted as a dark line with a light lip.
- The damaged look is verified at adoption. The design states it per finish as data.

The rulings add to the level the owner passed. Every passed prop stays where it stands,
and a new prop goes where the owner asks for it after a milestone's test.

## Terms

A finish and its parts:

- Finish: a named procedural material, apart from a slab's physics material and its tint.
- Role: one named part that a finish paints, such as a container's side, its door or a
  floor.
- Recipe: the definition of one role of a finish as data, an ordered list of layers.
- Finish path: a finish and a role, written `finish/role`. A slab, a box and a stage
  material name one.
- Layer kind: one of the closed set of patterns a layer can be, such as bands or cells.
- Template: a layer kind as code, one small function with named parameters that returns
  a coverage. A recipe fills it with its numbers.
- Painter: a recipe evaluated at a point of a face. It returns a shade: albedo,
  roughness, metalness and emission.
- Arithmetic interface: the operations the layer kinds are written over. A back end
  supplies them for one scalar type: numbers on the CPU, shader nodes on the GPU.
- Pattern coordinates: two lengths in metres that place a point on a face.
- Footprint: the metres of pattern one pixel or one texel covers at a point.

What a finish is drawn on:

- Prop: a dressed destructible object, built from slabs by one of the kit's nine kinds.
- Seal: a static box that closes the hall.
- Static object: a box that is only drawn, to fill a gap: litter on the floor or on a
  prop's top, or an overhead object on a wall, a deck or the ceiling.
- Placed box: a static object's box where the build stands it, in level coordinates.
- Box: a seal or a static object, as a shape that carries a finish.
- Hall surface: a surface of the base stage. A hall finish is a role that a stage
  material names.
- Non-destructible object: a seal, a static object or a hall surface.

## Templates and their arithmetic

A layer kind is a shader template: one small function with named parameters that returns
a coverage. The finish table is the sheet that fills the templates. When a level loads,
`level-view` instantiates the templates of each recipe's layers with that recipe's
numbers and joins them into one static shader for each finish path. The numbers become
constants in the shader's text. The only values a painter reads while it runs are the
surface's own. A slab and a box give them as vertex data of the `.glb`: the pattern
coordinates, the face's size and the number, seed, wear and class. A hall surface gives
its position and its normal.

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
its body at every call. The third scalar of a cell carries the seed.

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
does not draw. The finish sheet and the tests of the templates under Bun are what the
number back end is for.

## The layer kinds

The unit `kinds` of `finish-paint` holds the templates of the layer kinds. `face` needs
none: the painter covers a `face` layer with 1. `glyphs` comes in milestone 7. Each
template is a function over the interface with constant parameters in metres. Each
filters an edge over one footprint centred on it, so coverage is one half on the edge and
a pattern fades to its mean coverage before it aliases. Four kinds draw a field:

- `bands`: the coverage of bands of one width that repeat at one period along one
  coordinate, box-filtered over the footprint. A footprint of many periods returns the
  width over the period.
- `cells`: a grid of cells of one width and one height, each row shifted by a share of a
  cell. It returns the coverage of the gaps between cells and one tone per cell from one
  hash. The tone fades to 0.5.
- `dots`: the coverage of discs of one radius on a lattice with a pitch along each
  coordinate. A disc's edge is a linear ramp of the distance over one footprint, and the
  coverage fades to the discs' share of the lattice.
- `noise`: value noise in 0 to 1 on the two coordinates, with a wavelength along each
  and smooth interpolation between four hashed corners. It fades to 0.5 by its shorter
  wavelength.

Five kinds draw a mark:

- `rectangle`: the coverage of one axis-aligned rectangle given by two corners.
- `face`: the whole face, for a face's own paint or light; the painter covers it with 1,
  without a template.
- `disc`: the coverage of one disc, ring or diamond at a place, for hubs, plates, points
  and warning labels.
- `border`: the coverage of a frame of one width at one inset from a face's outline.
- `glyphs`: the coverage of a legend, a row of stencil glyphs of seven strokes each. A
  digit comes from the number; a letter is fixed by the layer. A pixel finds the glyph
  box under it and tests the seven strokes against that glyph's mask. It spends no hash.

`bands`, `rectangle` and the gaps of `cells` reach their mean by their box filters. The
other fades use the footprint fade, a helper of the unit after Wall Lab's `lodFade`: it
removes a feature as the footprint grows from 0.22 to 0.5 of the feature's wavelength.
The kinds trust their parameters and a positive footprint; the caller owns both. `cells`
and `noise` take the seed as one more scalar and pass it to every hash.

Every kind returns a coverage in 0 to 1, and a kind whose arithmetic can leave that range
clamps it. `bands`, `rectangle` and `dots` do: a filter's difference at a long coordinate
loses bits in 32-bit floats. `dots` also clamps its far share, because the format cannot
refuse a disc wider than its cell: a radius and a pitch may both be shares of a face.

A kind keeps the constant edges of every `smoothstep` rising. WGSL refuses a `smoothstep`
whose constant edges do not rise, when the shader is created, and the drawing stops. A
noise's mask rises because its softness lies above 0.

The art direction asked for two things beyond a straight band of a fixed period, and
`bands` takes both without a new kind and without a new operation. A band at 45 degrees
runs along the sum of the two coordinates. A fitted period is the range of the layer's
coordinate on the face over a whole number of periods; the face's size reaches the
painter with the face. `cells` and `dots` take the fit the same way. A band with flanks
is `bands` with a ramp, each flank centred on the band's edge.

## The painter

The unit `painter` of `finish-paint` evaluates a recipe on a face by the painting rules
of the finish format: the base shade, then each layer in order, each mixing its effect
into the shade by its coverage. The caller gives the base shade: the recipe's body for a
slab or a box, the stage material's own values for the hall. A face is what a frame rule
gives: the two coordinates, a low corner, a size, a class and the number, the seed and
the wear. The painter is generic over the interface, so one function serves both back
ends.

The painter takes a recipe as it draws and resolves nothing. `recipeAt` of
`level-format` is the one reading of a finish path: it resolves `extends` and the default
body, and returns the body, the layers and the finish's `light`. The kit, the pipeline
and the view call it, so none of them holds a default and the view parses no path. The
unit also exports the decode of a finish's `#rrggbb` text to linear RGB, for a layer's
`color` and for a caller's `light`. `level-glb` keeps a decode of its own for a box's
colour, by its rule of no workspace dependency.

Three more parts stand beside the painter:

- The slab's frame rule, on plain numbers, in the unit `frame`. `slab-model` calls it for
  the intact mesh, and sec-111 takes it with its copy for its chunk meshes, so a pattern
  cannot jump at a slab's first damage. The unit also builds the painter's face from a
  vertex's data, for the view and for the swatch.
- The hall's frame rule, in the same unit, over the interface, from a position, a normal
  and the interior box. Both back ends share it, and its tests run on numbers.
- The swatch, in a unit of its own, which renders a recipe on the number back end: a face
  as pixels, and the mean albedo of those pixels.

## Painters in `level-view`

`level-view` holds the unit `paint`: the node back end, the static material class, the
painted twins and the stage wrap. It has no switch: the level's finish table decides what
it paints. The painter cost document says what the static material class saves.

A GLB material of a finish path carries the path and its glow in its `extras`; its name
only repeats them. Such a material gets a painted twin only when its recipe draws what
the GLB's fallback cannot: a layer, or a body `shade` other than 1. A plain path keeps
the material the GLB gives it, lamps included: the fallback already holds the body's
metalness and roughness and the glow, so a twin would draw the same look at the cost of
a GPU program. One twin serves every slab, seal and static object that draws with its
material. It evaluates that path's recipe from the level `.json` on the vertex data the
GLB carries, keeps the source's colour, sidedness and shadow side, multiplies the vertex
colour once, and keeps the surface's own normal. A glow gives the emission its colour,
the material's emissive factor, and its unscaled strength, from the `extras`.

The view reads the `extras` of every material of a finish path once, at the load, twin or
not, and fails loudly there. `extras` of a wrong shape, or a finish path that the level's
table lacks, fail the start at its `glb` step, with the material's name and the path in
the error.

A stage material whose `extras` carry a hall finish with at least one layer draws through
the stage wrap, a static material. The wrap takes the material's own look as the base
shade and mixes the role's layers over it, on the hall's frame. Where no layer covers, a
wrapped material shades exactly as its source: it keeps every map, factor, side and
shadow side. A floor line is such a layer, so the wrap needs no floor height and no test
of its own for a floor. A stage material without a finish, or with a role of no layer,
keeps its material, so the ceiling and the trusses pay nothing.

The mesh decides the rule: a mesh that carries the slab's vertex data takes the twin
rule, and a stage mesh takes the wrap. One wrap draws on every surface of its stage
material, and its double-sided twin takes a wrap of its own. The class comes per pixel
from the surface's own normal, so on a curved part, a pipe or a tank, an `on: "top"`
layer draws on the band that faces up, and the mark ends sharply where the class turns.

Instantiation happens once, in the view's start, before the compile, so the warm-up
compiles what the frames draw: one shader for each twin and one for each wrapped stage
material. The twins number at most the finish paths and glows in use, about 45 for the
props and one for each box path beyond them.
Building a shader on the CPU is quick: under Bun, without a GPU, a graph of forty layers
took 2 to 4 ms and its program text 13 to 21 ms. Each program then compiles once on the
GPU, behind the boot's status strip; how long the programs take there shows on the
owner's machines alone, at the first milestone's test. A changed recipe shows at the next
start of the QA app, with no code and no rebuild of anything but the level.

## A program that fails

A painter program can fail on a GPU in two ways, and the page shows both:

- Its shader fails to compile. three.js creates the shader module outside any error
  scope, so the failure reaches the renderer's error hook as a GPU error. `level-view`
  hands it to the page, which shows the error and stops the drawing: a failure the QA app
  already shows.
- Its pipeline fails to build. three.js reports that as a console error, skips every draw
  of the program and lets the compile resolve: the level shows with props missing. The QA
  page copies every console error into the run log. A console error also raises an alarm
  of its own kind, `console-error`, beside the drawing's, the run log's and the page's:
  one line of the alarm banner, with a fixed text that says that programs may have failed
  and props may be missing, and with the run log's path.

The banner shows one line for each kind of alarm, so a console error never pushes a lost
device out of view. A line is the first line of its alarm's text, cut at 240 characters;
the whole text and a stack stay in the run log. The console alarm holds in every run and
at every boot step. Raised before the session facts, its line gains the run log's path
when they arrive; after a failed session step it says that the page's lines are not in
the run log. The page raises the alarm for every console error: it cannot tell a failed
program from another error without reading the error's text. The alarm is the whole new
mechanism: one rule in `qa-client`, one test, and one row in the QA app's list of visible
failures. The browser's own console messages still reach neither the page nor the run
log.

## Components

`finish-paint` is the one new component, browser-safe, in `packages/`, with the units
`arithmetic`, `kinds`, `frame` and `painter`. It depends on `level-format` for the
recipe's types. Its consumers:

- `level-view`: the interface, the kinds, the painter and the hall's frame rule, for the
  node back end.
- `slab-model`: the slab's frame rule, for the intact mesh.
- `snapshot-render`: the swatch of a recipe, for the finish sheet.

The other components change inside their duties:

- `level-format` admits the finish table with its caps, a slab's finish data, the static
  objects, a box's paint keys and a base override's finish, in its units `length`,
  `layer`, `finish` and `description`. It writes the finish data in the level `.json`,
  and owns `recipeAt`, the hash of an id into a seed, and a static object's class and its
  reading as an oriented box.
- `prop-kit` names a finish path for every slab, with the glows and the finish table as
  its context, takes the new parameters, composes a slab's number and deepens the girder.
- `slab-model` gives every vertex of a slab its pattern data and the slab's colour, which
  it takes from the destruction lib model: destruction lib stays the one decoder of a
  slab's colour.
- `level-glb` writes that data, one fallback material per finish path and glow, the
  static objects' nodes with a litter's support, a painted box's data by the box's frame
  rule and a stage material's finish path. It takes one drawn body per finish path in
  use beside the glows.

The components that judge, build and show the level:

- `level-rules` judges a static object by `interior` and `static`, on its placed box.
  The sixth fact of a built level pairs each static object with that box.
- `level-pipeline` carries the finish data to the pair and reads each path's body with
  `recipeAt` for `level-glb`. It places every static object once, on the prepared floor
  or on its prop, and hands the placed boxes to `level-glb` and to the validation.
- `level-cli` fills the finish sheet's swatches from the built level, a box's as a slab.
- `qa-client` passes the level's recipes to the view and raises the console alarm for a
  console error.

A static object changes neither `level-view`, `qa-client` nor `snapshot-render`: a
painted box draws by the twin rule, the QA walk installs blockers for slabs alone, and a
box's page is a slab's page. No gateway changes: no sibling's surface is needed.

## What agents see

An agent never sees a shader's output. The same templates, filled with plain numbers,
give it a preview in its smallest form, the finish sheet. Its consumer is the art team's
author and its reviewer, who change a finish and judge it before the owner spends a look
on it. The sheet gives each finish path one page, because an image reader shrinks a large
picture until its marks are lost. A page shows albedo only.

### A slab's page

- A prop's finish path shows on its largest outside face of the level, between its two
  end edges, with its inside face and its top and bottom edges.
- The sheet draws these faces at 5 mm per pixel, or at 20 mm when the outside face is
  longer than 8 m, and the outside face again at 40 mm, what survives 20 m. The sheet owns
  these scales; a swatch states only its slab.
- Under each face the sheet prints a ruler in metres and its mean albedo as linear
  luminance. The author holds the mean against the value ladder, and the facing ratios of
  the look and lighting document turn it into the luminance of a top, a side and an
  underside.

### A hall finish's page

- A hall finish that an override names gets one page, with one tile for each class its
  layers draw on, over a plain grey ground: the sheet reads no texture, so it shows the
  marks and not the surface's value. A wall or a ceiling shows as a window of 16 by 8 m
  from the interior's low corner, at 20 mm.
- A floor shows whole at the plan sheet's 50 mm and orientation, split into two halves
  side by side, with rulers in level coordinates. A floor line 0.1 m wide shows as 2 px;
  a joint shows only as a tone. The author reads a floor line against the layout with the
  plan sheet beside it.

### A box's page

A box's page is a slab's page. `level-cli` hands the sheet a box as a slab, and
`snapshot-render` does not change. A static object gives its width, its height and its
length as the thickness, with its colour, its seed and its wear. The page of a path
stands on the static object with the largest shown face, its width times the larger of
its height and its length. A path that a slab or an override also names keeps that page.

The slab's frame and the box's are equal on three faces, so three tiles are true:

- `top` is the box's upper face and `bottom` its lower face, each in the box's own frame.
- `outside` is the box's side along its width; the opposite side draws alike.

A reader of the page knows its three limits:

- The `top` tile draws +X to the right and +Z on top. A player who looks down on a
  litter with its +X to the right sees its +Z at the bottom, so the tile is that view
  flipped top to bottom. Every mark keeps its coordinates.
- The `inside`, `end-` and `end+` tiles stand for no face of a box. A box has no inside,
  and its two sides along the length are outside faces that no tile shows. An author
  therefore types the side that carries a mark as the width.
- At 5 mm per pixel a sheet of paper 0.3 m wide is 60 px wide, and a mark under 5 mm
  shows as a tone.

A seal has no yaw, so its page reads its longer plan extent as the width and the shorter
as the thickness. The `outside` tile is then the seal's large side. The `top` and
`bottom` tiles are its faces only where that extent runs along X.

### Beyond the finish sheet

The level sheets stay as they are, with every slab in its tint and every static object in
its colour. The plan sheet draws no floor line: that would take the recipes into a second
component, and the floor's swatch already places the lines. No agent can judge the
response to the level's lights, bloom, haze, or shimmer in motion. The owner judges those
in the browser, and nobody sees a damaged finish before adoption.

## Changing a finish

A finish changes like any other part of the level description, with no code. The author
works in the draft, as for a prop:

```sh
just validate --description levels/dark-factory.draft.json
just snapshot --description levels/dark-factory.draft.json
```

The author changes a value of a role under `finishes`, or adds, moves or removes a layer.
The validator names the path of a value out of form or over a cap, and the changed role's
page of the finish sheet shows it. The accepted draft replaces the committed description. The view
instantiates the shaders from the table at its start, so the owner sees a changed number
at the QA app's next start.
