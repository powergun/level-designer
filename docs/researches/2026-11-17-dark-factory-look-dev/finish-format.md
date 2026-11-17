# Finish format

A finish reaches a renderer as data. This document defines the finish table of the level
description, what a slab carries in the level pair, the rules by which a renderer draws a
finish, the checks, and what sec-111 changes to draw finishes at adoption. It extends the
level format of the foundation; the shapes replace the old ones in place, and both schema
ids stay.

## The finish table

The description's `finishes` is an object keyed by finish name, an id. It replaces the
metalness and roughness per material class. The table is the sheet from which a renderer
instantiates its shaders, and it is written to be read and changed by a person or an
agent: every value has a name, a length is in metres, a colour is `#rrggbb`, and what a
recipe leaves out takes a default. A finish has three keys:

- `cut`: the look of the exposed interior and of debris, as data for adoption: `family`,
  one of `wood`, `brick`, `concrete` and `metal`, and `color`.
- `light`: the colour that `"glow"` takes on a slab without a glow.
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
design; nothing counts its arithmetic. A finish path is `finish/role`. A slab names one,
and the table must hold it.

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

- A length is a number in metres, or text that adds a share of the face to metres:
  `"0.25w"` is a quarter of the face's width, `"1h-0.1"` lies 0.1 m under its top, and
  `"-0.5w+0.2"` lies 0.2 m inside its low end.
- A layer places itself by two coordinates. The first runs across the face from its
  centre line; with `across: "ends"` it runs in from the nearer end, and with
  `across: "out"` out from the centre line to both sides. The second runs up from the
  base; with `up: "top"` it runs down from the top.
- A point and a pair of sizes are written `[across, up]`. Nothing else in a recipe is
  positional.
- A layer draws on faces: `outside`, `inside`, `sides` for both; `top`, `bottom`, `end+`
  and `end-` for the faces at the high and the low end of the slab's X, `ends` for those
  two, `edges` for the four edge faces; or `all`. The default is `outside`.

`ends` and `out` mirror a mark onto both ends, so one layer serves both corner posts. On
the inside face the first coordinate is still the slab's X, so a mark lies behind its
place on the outside, as a pocket through the slab does. A legend therefore draws on
`outside` alone and takes neither `across` nor `up`: elsewhere it would read backwards or
upside down.

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
- `wear`: true scales the layer by the slab's wear;
- `amount`: a factor from 0 to 1 on the layer's coverage, by default 1.

The effects, each mixed in by the layer's coverage:

- `shade`: the albedo moves toward itself times this factor;
- `paint`: the albedo moves toward the tint times this factor, which restores the paint
  over earlier layers;
- `color`: the albedo moves toward this colour, `#rrggbb` text, or `"glow"` for the
  colour of the slab's glow;
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
  tone. Its coverage is its gaps.
- `dots`: `pitch`, a pair, and `radius`; optional `phase` and `offset`, pairs as well,
  and `fit`.
- `rectangle`: `from` and `to`, two corners.
- `disc`: `at`, `radius`; optional `inner`, which makes a ring, and `diamond`, which
  measures the distance along the two coordinates summed.
- `border`: `width`, or a width for each of `ends`, `top` and `base`; optional `inset`
  from the face's outline.
- `noise`: `wavelength`, a pair; optional `threshold` and `softness`, which turn the
  noise into a mask. Without them the noise itself is the coverage.
- `glyphs`: `at`, `height`, `text`; optional `align` (`start`, `centre` or `end`) and
  `skip`. A glyph is seven strokes in a box 0.6 of its height wide, at a pitch of 0.85 of
  its height. In the text a `#` is a digit of the slab's number, read from its low end
  after `skip` digits; a letter is one of A, C, E, F, H, J, L, P and U, or `t`.

`fit` fits a period to a whole number of periods on the face: the face's extent over the
rounded count, at least one. On `bands` it is true or absent; on `cells` and `dots` it
names the coordinate, `across`, `up` or `both`. A band along `diagonal` runs along the
sum of the two coordinates, with its period and width measured across the band; it takes
no `fit`.

A legend's `at` is its foot: the low corner at its start, the middle of its base or the
low corner at its end, by `align`. Its glyphs stand upright from there and read toward
the high end of the face. A digit is read without a division: the number times a constant
power of ten, plus half a step, floored, less ten times the next place. A stroke's bit is
read the same way with powers of two. The number's six digits leave four spare bits in a
32-bit float, so a GPU's rounding cannot flip a digit.

A fitted pattern starts at the face's low edge; an unfitted one at the coordinate's
origin.
`phase` is where a band's or a dot's centre lies in its period, from 0 to 1, by default
one half; `offset` then moves it by a length. A band at phase 0 of an unfitted pattern
therefore lies on the centre line, and one at phase one half of a fitted pattern in the
middle of each bay.

## What the kit names

`prop-kit` gives every slab its finish path. The names are the kit's; the table defines
them. A missing path blocks the build.

- `conveyor`: the deck `bed/deck`, the skirts `housing/skirt`.
- `enclosure`, metal: the +X side `housing/machine-plate`, the other sides and ends
  `housing/machine`, the roof `housing/top`. Up to 1.2 m wide, all four walls are
  `housing/cabinet`. Concrete: `cast-concrete/wall` and `cast-concrete/top`.
- `robot-arm`: the pedestal's sides `housing/pedestal` and its top `housing/top`;
  `casting/shoulder`, `casting/upper-arm`, `casting/forearm` and `casting/head`.
- `container`: `corrugated/side`, `corrugated/roof`, and `corrugated/end` or
  `corrugated/door` by the new parameter `door`: `+z`, `-z` or `none`.
- `crate`: the +X and -X sides `timber/crate-stencil`, unless the new parameter `stencil`
  is false; the other sides `timber/crate`; the lid `timber/lid`.
- `partition`: the new parameter `finish`, any path of the table. Its defaults by
  material: `cast-concrete/panel`, `steel-stock/stack`, `timber/stack`, `block/wall`.
- `bridge-crane`: `beam/girder`, `beam/runway`, `beam/flange`, `beam/truck`, `beam/hook`;
  the trolley's sides `housing/hoist` and its top `housing/top`.
- `jib-crane`: `beam/plinth`; the mast's +X panel `beam/mast-front` and its others
  `beam/mast`; `beam/boom`, `beam/flange`, `beam/tie`; the hoist `housing/hoist`.
- `light-strip`: `luminaire/strip`. Every other glow slab: `luminaire/band`.

A seal takes an optional `finish`, any path of the table, and an optional `number` of
one digit. Without a finish it draws flat. Every slab of a prop that has a glow names
that glow, so a lit mark shines in it.

Every kind takes two more optional parameters: `wear` from 0 to 1, by default 0.3, and
`seed` from 0 to 4,095, by default a hash of the prop's id. The kit gives each slab a
seed of the same range from the prop's seed and the slab's index. The range is the
hash's: in 32-bit floats the lattice hash keeps seeds apart up to about 4,096 and folds
larger ones onto shared patterns.

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

A seal's digit is its own `number`.

The girder's web grows from 0.6 to 1.25 m, as the kit's named dimension.

## The level pair

### The level `.json`

The root gains `finishes`, the table as the description states it, and `floor`. A slab
gains four keys: `finish`, its path; `number`, an integer from 0 to 999,999; `seed`, an
integer from 0 to 4,095; and `wear`, from 0 to 1.

### The GLB

A slab keeps its node and its one primitive. The primitive changes:

- It is indexed with shared vertices and 16-bit indices: corners that agree in position,
  normal and data are one vertex.
- `COLOR_0` is the slab's colour on every vertex, as three normalized 16-bit values at a
  stride of 8 bytes. 8-bit values cannot hold the dark end of the value ladder: an arm's
  albedo of 0.009 is 2 of 255.
- `TEXCOORD_0` holds the pattern coordinates `x` and `y` in metres.
- `TEXCOORD_1` holds the face's width and height in metres.
- `_SLAB` holds four numbers: the slab's number, its seed, its wear and the face's class:
  0 outside, 1 inside, 2 top, 3 bottom, 4 the high end, 5 the low end.

A seal with a finish carries the same data, with wear 0, on its 24 vertices. One material
serves each finish path and glow in use, named `finish/<finish>/<role>` with
`/glow/<glow>` after it. It holds the flat fallback: a white base colour, the recipe's
body metalness and roughness, and the glow's emissive colour at its strength times the
body's `lit`. A reader without painters therefore draws the level in flat colours with
its lit slabs lit, and the file still holds no image beyond the base stage's.

The built level's `.glb` measures 14,329,916 bytes before this change, 2.9 MB of them
props and seals. The same level must come out smaller with the painter's data in it.
Measured on that file: its slabs hold 59,820 vertices of 36 bytes, three to a triangle,
under 32-bit indices, and 26,566 vertices once equal corners are shared. Computed from
that: at 64 bytes a vertex and 16-bit indices the slabs take 0.57 MB less, and the three
new accessors of each slab give about 0.25 MB of it back.

## Mapping rules

Both renderers, `level-view` now and sec-111 at adoption, follow these rules. The painter
of `finish-paint` is their one implementation here.

1. The frame of a face. On the outside (+Z) and inside (-Z) faces, `x` is the slab's X
   from its centre line and `y` its Y from the base; the face measures the slab's width
   by its height. On the top and bottom edges, `x` is the slab's X and `y` runs through
   the thickness from 0; the face measures width by thickness. On the end edges, `x`
   runs through the thickness from its centre and `y` is the slab's Y; the face measures
   thickness by height.
2. A layer's coordinates: with `across: "ends"` the first is half the face's width less
   the magnitude of `x`, and with `across: "out"` it is the magnitude of `x`; with
   `up: "top"` the second is the face's height less `y`.
3. The tint is the vertex colour times the material's colour.
4. The body: the albedo is the tint times `shade`; metalness, roughness and emission are
   the body's.
5. A layer's coverage is its kind's coverage, times its clip, times its detail's fade,
   times the slab's wear if it wears, times its amount. It is 0 on a face the layer does
   not draw on.
6. Each layer mixes its effects into the shade by its coverage, in the order of the list.
7. Every hash takes the slab's seed beside its lattice cell, so two slabs of one finish
   differ.
8. A material with a glow emits the glow's colour times its strength times the
   emission. Without a glow the emission is unused, and `"glow"` is the finish's `light`.
9. Every edge is filtered over one footprint, the metres of pattern one pixel covers.
10. The face's size and the slab's number, seed, wear and class are constants of a face.
    They reach the painter without interpolation, as flat varyings: an interpolated
    number reads wrong digits. A face's class is compared at half a step.

A renderer draws the cut faces of a damaged slab by the finish's `cut`: its family's
interior look in the cut colour. `level-view` draws no cut face.

## Floor lines and seals

The description's `floor` holds two keys: `color`, the paint of the lines, and `lines`,
0 to 32 rectangles in plan, each with `from` and `to`, two corners `[x, z]` in metres of
the level frame. The form is cheap by design: one colour, mixed over the stage's own
material by a mask. The mask is the largest coverage of any rectangle, each filtered
over one footprint. A line draws on every surface of the stage that faces up within
0.05 m of a floor height of the prepared static level. Floor lines add no geometry and
no collision.

A seal's faces are all outside faces. On a side face `x` runs along the face from its
centre, toward the right of a viewer who faces it, and `y` runs up from the box's base.
On a level face `x` is the level's X from the face's centre, and `y` the level's Z from
the face's edge at its lowest Z.

## Checks

Build errors, each with the path of the value to change:

- `shape`, owned by `level-format`: the table's form, a length's form, every range, an
  unknown key, kind, coordinate, face or glyph, a layer without an effect, a fitted
  diagonal band, a legend with `across` or `up` or on a face other than `outside`, an
  extended role that is missing or itself extends, a recipe over one of its three caps
  and more than 32 floor lines.
- `finish`, owned by `prop-kit` for a prop and by `level-format` for a seal:
  `<path>: <kind> needs the finish "<finish>/<role>"`, or for a named path
  `<path>: no finish "<finish>/<role>"`.
- `param`, owned by `prop-kit`: the new parameters, each with its range.

The validator gains no rule. Its `texture` rule stays as it is: painters add no image.
The report gains the value table of the design.

## What sec-111 changes at adoption

These changes join the adoption list of the level format:

- Level contract: the finish table, the floor lines and a slab's four finish keys are
  admitted with their caps.
- Wall view: it takes a copy of the files of the interface, both back ends, the layer
  kinds and the painter as they stand here, which the owner allowed. Nothing themed
  crosses. It keys a look by finish path and glow, draws the intact GLB node and its own
  layer view with that look, and admits emission.
- Wall view, the data: it derives the pattern data of its chunk meshes from the layer's
  local positions and normals by mapping rule 1. A face on one of the slab's six planes
  is skin, edges included; every other face is cut.
- Wall view, the cut: an interior look per family in the finish's cut colour, with metal
  added after Wall Lab's metal sphere: bright iron at full metalness.
- Stage view: the floor lines on the stage's floor materials, and the painter on a seal
  that names a finish.

Three guards keep the two copies in step:

- The mapping rules above are the one normative text for both renderers.
- Fixtures travel with the pair as data: recipes, sample points and the numbers the
  number back end returns. sec-111's tests replay them on its copy of that back end.
- A text guard in `sec111-gateway` compares the copied files with this repository's and
  ignores only the specifier of an import line. It has nothing to compare until
  adoption lands.

## Changing a finish

A finish changes like any other part of the level description, with no code. The author
works in the draft, as for a prop:

```sh
just validate --description levels/dark-factory.draft.json
just snapshot --description levels/dark-factory.draft.json
just qa
```

- Open the draft, find the finish and its role under `finishes`, and change a value: a
  width in metres, a colour, a factor; or add, move or remove a layer.
- Validate. A build error names the path of a value that is out of form or over a cap.
- Snapshot. The finish sheet shows the changed role on a face, with a ruler.
- Copy the accepted draft over the committed description, start the QA app and look.
  The view instantiates the shaders from the table at its start, so a changed number
  shows at the next start.
