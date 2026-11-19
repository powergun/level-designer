# Finish format

A finish reaches a renderer as data. This document defines the finish table of the level
description, what a slab, a box and a stage material carry in the level pair, the rules by
which a renderer draws a finish, the checks, what it replaces in the foundation's level
format, and what sec-111 changes to draw finishes at adoption. The shapes replace the old
ones in place, and both schema ids stay. The records of a seal, of a static object and of
a hall finish stand in `non-destructible-objects.md`.

## The finish table

The description's `finishes` is an object keyed by finish name, an id. It replaces the
metalness and roughness per material class. The table is the sheet from which a renderer
instantiates its shaders, and it is written to be read and changed by a person or an
agent: every value has a name, a length is in metres, a colour is `#rrggbb`, and what a
recipe leaves out takes a default. A finish has three keys:

- `cut`: the look of the exposed interior and of debris, as data for adoption: `family`,
  one of `wood`, `brick`, `concrete` and `metal`, and `color`.
- `light`: the colour that `"glow"` takes on a surface without a glow.
- `roles`: an object keyed by role name, an id. Each role is one recipe.

A recipe has up to three keys:

- `body`: `shade`, a factor on the tint, by default 1; `metalness`, by default 0, and
  `roughness`, by default 0.6; and `lit`, the emission of the bare body, by default 0.
- `layers`: the layers drawn in order over the body, by default none.
- `extends`: another role of the same finish. The recipe then draws that role's layers
  before its own and takes that role's body unless it states one. A role that extends
  cannot be extended.

A recipe holds at most 24 layers, the extended role's among them, and of those at most
two `noise` layers and at most three `glyphs` layers. The caps keep a painter cheap by
design; nothing counts its arithmetic. A finish path is `finish/role`. A slab, a box and a
base override name one, and the table must hold it.

The table has one canonical text. The admission fills the default of every key that a
stated record leaves out: `on` is `outside`, `wear` false and `amount` 1, a phase one
half; an offset, a `ramp`, a `shift`, a `share`, an `inner` and an `inset` 0; `diamond`
false; a border's single size as the width of `ends`, `top` and `base`; and a stated
body's keys the default body's. What means something by its absence stays absent: a recipe's `body` and
`extends`, a layer's `across`, `up`, `clip` and `detail`, a lattice's `fit` and a noise's
mask.

A recipe as it draws has one reading, `recipeAt` of `level-format`. It returns the layers,
the extended role's first; the body, that role's unless the recipe states one, and the
default body where neither does; and the finish's `light`. A path the table lacks reads
as no recipe.

A role reads like this one, a housing's side with a kick band at its base and a cap
under its top:

```json
"machine": {
  "body": { "roughness": 0.5 },
  "layers": [
    { "kind": "rectangle", "from": ["-0.5w", 0], "to": ["0.5w", 0.12], "shade": 0.6 },
    { "kind": "rectangle", "up": "top", "from": ["-0.5w", 0], "to": ["0.5w", 0.06],
      "shade": 1.1, "roughness": 0.8 }
  ]
}
```

### Lengths, coordinates and faces

- A length is a number in metres, or text that adds one share of the face to metres:
  `"0.25w"` is a quarter of the face's width, `"1h-0.1"` lies 0.1 m under its top, and
  `"-0.5w+0.2"` lies 0.2 m inside its low end. A length holds at most one share, of the
  width or of the height, so every length has one canonical text.
- A layer places itself by two coordinates. The first runs across the face from its
  centre line; with `across: "ends"` it runs in from the nearer end, and with
  `across: "out"` out from the centre line to both sides. The second runs up from the
  base; with `up: "top"` it runs down from the top.
- A point and a pair of sizes are written `[across, up]`. Nothing else in a recipe is
  positional.
- A layer draws on faces: `outside`, `inside`, `sides` for both; `top`, `bottom`, `end+`
  and `end-` for the faces at the high and the low end of the slab's X, `ends` for those
  two, `edges` for the four edge faces; or `all`. The default is `outside`.

`ends` and `out` mirror a mark onto both ends, so one layer serves both corner posts. The
kit turns every slab's +Z face, its outside face, to where a player sees and shoots it.
On the inside face the first coordinate is still the slab's X, so a mark lies behind its
place on the outside, as a pocket through the slab does. A legend therefore draws on
`outside` alone and takes neither `across` nor `up`: elsewhere it would read backwards or
upside down.

A length has limits, because a painter computes in 32-bit numbers and a slipped exponent
would reach a shader as 0 or as infinity. The painter trusts them and guards nothing:

- Every term of every length, the metres and a share's factor, has a magnitude of at most
  1,000.
- A position takes any terms within that bound: `from`, `to`, `at`, a clip's corners and
  an `offset`.
- A size has no negative term and is above zero, and each of its terms is 0 or at least
  0.0001: `period`, `width`, `height`, `radius`, `pitch` and `wavelength`.
- `ramp`, `gap`, `inner` and `inset` take a size's limits and may also be 0.

### A layer

A layer takes `kind`, the keys of its kind, at least one effect, and any of the common
keys. The common keys:

- `on`, `across` and `up`, as above;
- `clip`: `from` and `to`, two corners in the layer's coordinates that bound the layer;
- `detail`: `medium` or `fine`. It fades the layer out as the footprint grows: a medium
  detail is gone at 30 mm, about 15 m away, and a fine one at 8 mm, about 4 m away, each
  from 0.44 of that. Without it a layer never fades. It suits a thin line; a field needs
  none, because `bands` and `cells` reach their mean by themselves and so keep a face's
  value at any distance;
- `wear`: true scales the layer by the wear of its slab or box;
- `amount`: a factor from 0 to 1 on the layer's coverage, by default 1.

The effects, each mixed in by the layer's coverage. A layer that states several mixes
them in the order of this list, so its `shade` darkens before its `paint` paints:

- `shade`: the albedo moves toward itself times this factor;
- `paint`: the albedo moves toward the tint times this factor, which restores the paint
  over earlier layers;
- `color`: the albedo moves toward this colour, `#rrggbb` text, or `"glow"` for the
  colour of the surface's glow;
- `metalness` and `roughness`: each moves toward the stated value;
- `lit`: the emission moves toward this value from 0 to 1;
- `jitter`, on `cells` alone: `low` and `high`, a factor on the albedo of each cell by
  its tone.

A factor of `shade`, `paint` or `jitter`, a body's `shade` among them, lies from 0 to 4.
`metalness`, `roughness`, `lit` and `amount` lie from 0 to 1. A colour is `#rrggbb` sRGB
text, as in the level format, and a painter mixes it in linear light: a layer's `color`,
a finish's `light` and its cut colour. The albedo is clamped to 0 to 1 after the last
layer.

The kinds and their keys:

- `face`: no key. It covers the whole face.
- `bands`: `along` (`across`, `up` or `diagonal`), `period`, `width`; optional `phase`,
  `offset`, `fit` and `ramp`, the width of each flank.
- `cells`: `width`, `height` and `gap`; optional `shift`, a row's shift as a share of a
  cell, `fit`, and `share`, the part of the cells the layer covers whole, chosen by
  tone; `shift` and `share` lie from 0 to 1. Its coverage is its gaps.
- `dots`: `pitch`, a pair, and `radius`; optional `phase` and `offset`, pairs as well,
  and `fit`.
- `rectangle`: `from` and `to`, two corners.
- `disc`: `at`, `radius`; optional `inner`, which makes a ring, and `diamond`, which
  measures the distance along the two coordinates summed.
- `border`: `width`, one size or a record of `ends`, `top` and `base`; optional `inset`
  from the face's outline. A border follows the outline, so it takes neither `across`
  nor `up`.
- `noise`: `wavelength`, a pair; optional `threshold` and `softness`, which come together
  and turn the noise into a mask. Without them the noise itself is the coverage.
- `glyphs`: `at`, `height`, `text`; optional `align` (`start`, `centre` or `end`) and
  `skip`.

A band has two shapes. A straight band runs along `across` or `up` and may take `fit`. A
band along `diagonal` runs along the sum of the two coordinates, with its period and
width measured across the band, and takes no `fit`. Each flank is `ramp` wide and centred
on the band's edge, so `width` is the band's width at half coverage, and the band's mean
stays its width over its period.

A noise's mask rises smoothly from `threshold` less half the `softness` to `threshold`
plus half of it. `threshold` lies from 0 to 1 and `softness` above 0 and at most 1;
neither has a default. A rectangle's corners come in either order. A dot's radius has no
limit against its pitch, because both may be shares of a face; only the nearest lattice
point draws, so a disc wider than its cell is cut there.

A glyph is seven strokes in a box 0.6 of its height wide, at a pitch of 0.85 of its
height. In a legend's `text` a `#` is a digit of the number, read from its low end after
`skip` digits; a letter is one of A, C, E, F, H, J, L, P and U, or `t`.

`fit` fits a period to a whole number of periods: the range of the layer's coordinate on
the face over the rounded count, at least one. A plain coordinate ranges over the face
from its low edge. Under `across: "ends"` or `"out"` it ranges over half the face, so a
fitted band under `ends` fits half the face from each end; under `up: "top"` it ranges
over the height from the top. On `bands` `fit` is true or absent; on `cells` and `dots`
it names the coordinate, `across`, `up` or `both`.

A legend's `at` is its foot: the low corner at its start, the middle of its base or the
low corner at its end, by `align`. Its glyphs stand upright from there and read toward
the high end of the face. A digit is read without a division: the number times a constant
power of ten, plus half a step, floored, less ten times the next place. A stroke's bit is
read the same way with powers of two. The number's six digits leave four spare bits in a
32-bit float, so a GPU's rounding cannot flip a digit.

A fitted pattern starts at the low end of its coordinate's range; an unfitted one at the
coordinate's origin. `phase` is where a band's or a dot's centre lies in its period, from
0 to 1, by default one half; `offset` then moves it by a length. A band at phase 0 of an
unfitted pattern therefore lies on the centre line, and one at phase one half of a fitted
pattern in the middle of each bay.

## What the kit names

`prop-kit` gives every slab its finish path. The names are the kit's; the table defines
them. A missing path blocks the build.

- `conveyor`: the deck `bed/deck`, the skirts `housing/skirt`.
- `enclosure`, metal: the +X side `housing/machine-plate`, the other sides and ends
  `housing/machine`, the roof `housing/top`. Up to 1.2 m wide, all four walls are
  `housing/cabinet`. Concrete, at any width: `cast-concrete/wall` and `cast-concrete/top`.
- `robot-arm`: the pedestal's sides `housing/pedestal` and its top `housing/top`;
  `casting/shoulder`, `casting/upper-arm`, `casting/forearm` and `casting/head`.
- `container`: `corrugated/side`, `corrugated/roof`, and `corrugated/end` or
  `corrugated/door` by the new parameter `door`: `+z`, `-z` or `none`, by default `none`.
- `crate`: the +X and -X sides `timber/crate-stencil`, unless the new parameter `stencil`,
  by default true, is false; the other sides `timber/crate`; the lid `timber/lid`.
- `partition`: the new parameter `finish`, any path of the table. Its defaults by
  material: `cast-concrete/panel`, `steel-stock/stack`, `timber/stack`, `block/wall`.
- `bridge-crane`: `beam/girder`, `beam/runway`, `beam/flange`, `beam/truck`, `beam/hook`;
  the trolley's sides `housing/hoist` and its top `housing/top`.
- `jib-crane`: `beam/plinth`; the mast's +X panel `beam/mast-front` and its others
  `beam/mast`; `beam/boom`, `beam/flange`, `beam/tie`; the hoist `housing/hoist`.
- `light-strip`: `luminaire/strip`. Every other glow slab: `luminaire/band`.

Every slab of a prop that has a glow names that glow, so a lit mark shines in it.

Every kind takes two more optional parameters: `wear` from 0 to 1, by default 0.3, and
`seed` from 0 to 4,095, by default the hash of the prop's id. `level-format` owns that
hash, `seedOfId`, for props and boxes alike: the top 12 bits of the id's 32-bit FNV-1a
hash, mixed by MurmurHash3's finaliser. A seed sets a look, so the hash never changes.
A slab's seed is the prop's seed plus 2,531 times the slab's index, modulo 4,096: the
stride is odd, so one prop's slabs never share a seed. The range is the lattice hash's:
in 32-bit floats it keeps seeds apart up to about 4,096 and folds larger ones onto shared
patterns.

A legend needs nothing that the description cannot give. Its letters are constants of
its layer's `text`. Its digits are digits of the slab's number, and every slab of a prop
carries the prop's one number:

- `container`: the parameter `number`, up to six digits, for the code on its sides and
  its door.
- `enclosure` and `partition`: the parameter `number`, up to three digits, for a
  machine's plate, a panel's number and a stack's chalk mark.
- `bridge-crane`: the parameters `capacity` from 1 to 99, by default 20, and `number`
  from 0 to 9. A girder's number is the capacity times ten plus the number, so one layer
  reads the capacity and another the crane's digit. The hook and the trolley carry the
  capacity.
- `jib-crane`: the parameter `capacity` from 1 to 9, by default 1, for its boom.
- `crate` and `robot-arm` take no such parameter: a crate's code and a pedestal's number
  come from the seed.
- A number that comes from the seed, for these two kinds and for a parameter left out,
  is a hash of the prop's seed inside the number's range. It is equal on every slab of
  the prop and stable while the prop keeps its id and its seed.

## The level pair

### The level `.json`

The root gains `finishes`, the table in its canonical text, with every default filled in.
A slab gains four keys: `finish`, its path; `number`, an integer from 0 to 999,999;
`seed`, an integer from 0 to 4,095; and `wear`, from 0 to 1. The level holds no glow, and
a box and a stage material add nothing: the `.glb` carries all a renderer reads of them.

The level `.json` is persisted data, so its decoder judges the join once, at the
boundary: a slab whose finish path the level's table lacks is refused there, and every
renderer trusts the path.

### The GLB

A slab keeps its node, its one primitive and the mesher's vertices. The primitive gains
three accessors, and its colour changes:

- `COLOR_0` holds the slab's colour on every vertex, the inside face included: the recipe
  paints the inside, and the mesher's light tint of that face is gone from the level.
- `TEXCOORD_0` holds the pattern coordinates `x` and `y` in metres.
- `TEXCOORD_1` holds the face's width and height in metres.
- `_SLAB` holds four numbers: the number, the seed, the wear and the face's class: 0
  outside, 1 inside, 2 top, 3 bottom, 4 the high end, 5 the low end.

A static object is an object node named by its id, with the role `static` in its
`extras`, after the seals and before the props. A litter on a prop also carries `support`
there: the name of the mesh node of the slab it lies on, `<prop id>/<index>`. The node's
one child is the mesh node `<id>/0`: the placed box, 24 vertices and 12 triangles in level
coordinates. A painted box, a static object or a seal with a finish, carries `NORMAL`,
its colour as a linear `COLOR_0` and the three accessors, with class 0 on its four sides,
2 on its upper face and 3 on its lower one.

One material serves each finish path and glow in use, for slabs and boxes alike. Its
`extras` carry `finish`, the path, and with a glow `glow`, the glow's name, and
`glowStrength`, the glow's strength as the description states it: a renderer joins a mesh
to its recipe by them. Its name, `finish/<finish>/<role>` with `/glow/<glow>` after it, is
a label for people. The material holds the flat fallback:

- a white base colour, so the vertex colours show unchanged;
- the metalness and the roughness of the recipe's drawn body;
- with a glow, the glow's colour as the emissive factor, at the glow's strength times the
  body's `lit`, also at a strength of 0. A body with a `lit` of 1 therefore emits at the
  glow's strength, and an unlit one emits nothing;
- without a glow, no emission, whatever the body's `lit`.

A stage material whose override names a finish carries the path the same way, as `finish`
in its `extras`, and so does its double-sided twin. The file holds no image beyond the
base stage's.

### Why the `.glb` holds this data

"Small" sets no hard limit on the `.glb`. Each datum above is in it because no better
place holds it, judged by implementation complexity, load time and ease of development.
The vertex data:

- The pattern coordinates. The build knows a slab's frame while it meshes the slab. A
  renderer that derived them would pair every mesh node with its slab in the level
  `.json` and turn every vertex back into the slab's frame at each load, in two
  renderers. A value per slab on the material would end the one shared material.
- The face's size, the class and the three slab numbers. They are constants of a face or
  of a slab, and one material serves every slab of a finish path, so the material cannot
  hold them. As vertex data they cost no step at load. A box has no record in the level
  `.json` to read them from.

The materials and the nodes:

- A material's finish path, its glow and its fallback. The `extras` join a mesh to its
  recipe without a lookup and without reading a name, by one key for a slab, a box and a
  stage material, whose record already takes the override's other values. The fallback
  keeps the file a plain glTF that the snapshot sheets and a viewer without painters draw
  in flat colours, with the lit slabs lit.
- A glow's unscaled strength. A painter emits the glow's colour times its strength times
  its own emission, and the fallback's emissive strength is already scaled by the body's
  `lit`, so the unscaled strength needs a home. The material holds the glow's colour as
  its emissive factor, so the strength beside it keeps the whole glow in one record, and
  no renderer joins a second file: the level `.json` holds no glow.
- A static object's node. It is drawn geometry without a gameplay fact, and a renderer
  reads geometry from the `.glb`.
- A litter's support. sec-111 hides a slab's mesh node at the slab's first damage, and
  without the datum the litter would float there. The level `.json` holds no static
  object.

The recipes stay in the level `.json`: they are in-house data, and a changed number
needs no new mesh.

## Mapping rules

Both renderers, `level-view` now and sec-111 at adoption, follow these rules.
`finish-paint` holds their one implementation here: the painter, the slab's frame rule
and the hall's.

### The frame of a face

A face has two pattern coordinates in metres, `x` and `y`, a low corner, a size, its
width by its height, and a class. Three frame rules give them: a slab's, a box's and the
hall's. On a slab and on a box the low corner lies half the width below 0 in `x`, and at
0 in `y`.

A slab's frame rule. On the outside (+Z) and inside (-Z) faces, `x` is the slab's X from
its centre line and `y` its Y from the base; the face measures the slab's width by its
height. On the top and bottom edges, `x` is the slab's X and `y` runs through the
thickness from 0 at the inside face toward the outside; the face measures width by
thickness. On both end edges, `x` is the slab's Z from its centre, unmirrored, as the
inside face keeps the slab's X, and `y` is the slab's Y; the face measures thickness by
height. A vertex's normal picks its face.

A box's frame rule. A box has its own axes: its X and its Z are the level's, turned by
its yaw; a seal has none. On each of its four sides `x` runs along the face from its
centre, toward the right of a viewer who faces it, and `y` runs up from the box's base;
the class is `outside`. On its upper and its lower face `x` is the box's X from the
face's centre and `y` the box's Z from the face's low edge; the classes are `top` and
`bottom`. `level-glb` writes a box's frame as vertex data, so no renderer holds this rule.

The hall's frame rule. A surface's normal in the level frame decides, per pixel and as
the mesh states it, without a normal map. With a Y of 0.7 or more the class is `top`, and with -0.7 or
less `bottom`; `x` is then the level's X and `y` the level's Z. Otherwise the class is
`outside` and `y` is the level's Y; `x` is the level's Z where the normal's X outweighs
its Z, and the level's X elsewhere. The face is the interior box's: its low corner and
its size are the interior's along `x` and `y`.

### Painting

The painting rules for the shade:

- A layer's coordinates: with `across: "ends"` the first is the distance in from the
  nearer end of the face, and with `across: "out"` the distance from the face's centre
  line; with `up: "top"` the second is the distance down from the face's top.
- The tint is the vertex colour times the material's colour. On a hall surface it is the
  stage material's base colour, its texture times its factor.
- The base shade comes from the painter's caller. For a slab and a box it is the body:
  the albedo is the tint times `shade`, and metalness, roughness and emission are the
  body's. For a hall surface it is the stage material: the albedo is the tint, and
  metalness and roughness are the material's own, its maps included. A face that no
  layer covers keeps the base shade unchanged.
- A layer's coverage is its kind's coverage, times its clip, times its detail's fade,
  times the wear if it wears, times its amount. It is 0 on a face the layer does not
  draw on.
- Layers mix into the shade in the order of their list, and one layer's effects in the
  order of the effects.

The painting rules for the edges, the constants and the light:

- Every edge is filtered over one footprint, the metres of pattern one pixel covers along
  the longer of its two screen axes.
- Every hash takes the seed beside its lattice cell, so two slabs of one finish differ.
- A material with a glow emits the glow's colour times its unscaled strength times the
  emission, a factor from 0 to 1. Without a glow the emission is unused, and `"glow"` is
  the finish's `light`.
- The face's size and class and the number, the seed and the wear are constants of a
  face. From a slab and from a box they reach the painter without interpolation, as flat
  varyings: an interpolated number reads wrong digits. A face's class is compared at
  half a step.
- A hall surface has the number 0, the seed 0 and the wear 1.

A renderer draws the cut faces of a damaged slab by the finish's `cut`: its family's
interior look in the cut colour. `level-view` draws no cut face.

## Checks

Build errors, each with the path of the value to change. `level-format` owns `shape`:

- For a recipe: the table's form, a length's form and limits, every range, an unknown
  key, coordinate, face or glyph, a layer without an effect, a fitted diagonal band, a
  mask with only one of its two keys, a `jitter` on a kind other than `cells`, a border
  with `across` or `up`, a legend with either or on a face other than `outside`, an
  extended role that is missing or itself extends, and a recipe over one of its three
  caps. A layer of an unknown or a missing kind reports its kind alone.
- For a hall finish: a body, a `lit` effect, a `glyphs` layer, and a layer on a face
  other than `top`, `bottom` and `outside`, also through `extends`. Each is reported at
  the offending value, with the hall path in its message.
- For a box: a paint key out of its range, a `glow` that `glows` does not name, and a
  seal that states `metalness` or `roughness` beside a finish, or lacks one without it.
- For a static object: more than 256, a side under 0.02 m, a negative `lift` or one
  beside an `on`, and an `on` that names no prop, at `statics[<i>].on`.

The other build errors:

- `id`, owned by `level-format`: an id used twice among seals, static objects and props.
- `finish`, owned by `prop-kit` for a prop, at the prop's kind: `props[<i>].kind: <kind>
  needs the finish "<finish>/<role>"`, once per missing path.
- `finish`, owned by `level-format` for a named path, of a box, of a base override and
  of a slab in a decoded level: `<path>: no finish "<finish>/<role>"`. A slab's path
  reads `props[<i>].slabs[<k>].finish`.
- `param`, owned by `prop-kit`: the new parameters, each with its range.
- `place`, owned by `level-pipeline`, where it places the static objects, after the slab
  admission: `statics[<i>].at: (<x>, <z>) lies outside the interior`, and for litter on a
  prop `statics[<i>].at: (<x>, <z>) lies over no top of prop <id>`.

The validator gains one rule, `static`, after `seal`, and one more message of `interior`,
where the static objects follow the props. Both judge the placed box and take the static
object's id as the subject:

- `interior`: `static <id> leaves the interior by <d> m at (<x>, <y>, <z>)`.
- `static`, a litter's height: `static <id> is <h> m high; litter is 0.15 m high or
  lower`.
- `static`, a litter's length: `static <id> measures <l> m in plan; litter measures 1.5 m
  or less`.
- `static`, floor litter's floor: `static <id> spans the floor levels <a> and <b>; keep
  floor litter on one level`.
- `static`, floor litter on the ramp: `static <id> stands on the ramp, z <z0> to <z1>`,
  the ramp zone that its plan outline enters, as `ramp` words it for a prop.
- `static`, the hang height: `static <id> starts <h> m above the hall's highest floor; an
  overhead object starts 2.17 m or higher`.

Floor litter's floors are those under its plan corners; litter on a prop is judged for
neither floor nor ramp. An overhead object counts from the highest floor of the prepared
level, the raised slab, wherever it hangs. `level-rules` owns the two litter limits
beside the hang height of `support`. The `texture` rule and the report stay as they are.

## What this replaces in the level format

The foundation's level format stays as written. Where they differ, this document holds:

- "Finishes and glows": `finishes` is the finish table, in place of a metalness and a
  roughness for each of the four materials.
- "The level description": the root keys gain the optional `statics`, a base override
  gains `finish`, a seal gains the paint keys, and ids are unique among seals, static
  objects and props.
- "The GLB", the scene: an object node per static object, between the seals and the props.
- "The GLB", meshes and materials: a slab primitive carries two texture coordinates and
  `_SLAB`, and the slab's colour on every face. The appended materials are one per
  unpainted seal and one per finish path and glow.
- "The level `.json`": the root keys gain `finishes`, a slab has nine keys, and the
  decoder gains the rule `finish`.
- "Validator checks": the checks judge six facts: the sixth lists each static object of
  the description with its placed box, from `level-pipeline`. `interior` also judges a
  static object, and `static` joins the placement rules.
- "Build errors": the step that places the static objects follows the slab admission.

## What sec-111 changes at adoption

These changes join the adoption list of the level format:

- Level contract: it admits the finish table and a slab's four finish keys, caps included.
- Level preparation: it skips a `static` node, as it skips a `destructible` one.
- Wall view: it takes a copy of the files of the interface, both back ends, the layer
  kinds, the painter and the slab's frame rule, which the owner allowed. Nothing themed
  crosses. It keys a look by finish path and glow, draws the intact GLB node and its own
  layer view with that look, and admits emission.
- Wall view, the data: it derives the pattern data of its chunk meshes from the layer's
  local positions and normals by the copied frame rule. A face on one of the slab's six
  planes is skin, edges included; every other face is cut.
- Wall view, the cut: an interior look per family in the finish's cut colour, with metal
  added after Wall Lab's metal sphere: bright iron at full metalness.
- Stage view: it draws every `static` node, the painter on every box whose material
  carries a finish path, and the hall finish on every stage material that carries one.
  It hides a `static` node when the wall view hides the mesh node its `support` names.

The mapping rules above are the one normative text for both renderers. sec-111 owns its
copy from the day it takes it. What keeps the two copies in step is decided at adoption,
when a second copy exists.
