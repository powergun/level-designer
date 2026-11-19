# level-format knowledge

## Ownership

The component owns the description shape, the level `.json` shape, the finish table, the
one slab admission and the reading of a slab or a static object as an oriented box. Its problems carry one of
four rules: `shape`, `id`, `slab` and `finish`. It judges no kind name, no kind parameter,
no base material or mesh name and no placement: a prop's `kind` passes on as a string, its
`params` as a map, and base names as map keys and strings.

## Units

- `shape`: the admission of untrusted JSON text. It parses the text and walks it with
  checked reads. It also owns the id rule, the finish path's form, the shared value reads
  and the length slack.
- `lighting`: the lighting section's one type, its one admission and its canonical key
  order, shared by the description and the level `.json`.
- `slab`: the slab type with its four finish keys and their ranges, its record, its key
  order, the grid rounding, the length formatter and the oriented box.
- `length`: a length on a face, its reading with the bounds and the floor of its terms,
  and its canonical text.
- `layer`: one layer of a recipe: its types, the patterns of the eight kinds, its reading
  with the common keys and the effects, and its canonical record.
- `finish`: the finish table's types, its one admission with `extends` and the caps of a
  recipe, its canonical text, a path's drawn recipe, a hall finish's limits and the seed
  of an id. The description and the level `.json` share it.
- `description`: the description type, its admission and a static object's class and box.
- `level`: the level type, the slab admission, the decoder and the encoder.

Dependencies point down: `shape` sits at the bottom, and `lighting`, `slab` and `length`
use it. `layer` uses `length`, `finish` uses `layer` and `slab` for the cut's family, and
`description` and `level` sit on top.

## Admission

An admission returns either the typed value or every problem found. A problem carries its
rule, the path of the offending value and the message an author reads. Every message
starts with that path, except the slab count cap's.

Problems come in reading order. A record reports its unknown and missing keys first, then
reads its fields in its fixed key order, whatever order the text lists them in.

- A path names a list item by its index in brackets, as in `props[3].at[0]`. A name in a
  map of free-text names, a base material or a glow, always shows quoted in brackets:
  `glows["cyan"].strength`. A finish and a role are ids, so their names show as record
  keys: `finishes.housing.roles.machine.layers[2]`. A record key shows after a dot when it
  starts with a letter or `_` and holds only letters, digits, `_` and `-`; any other record
  key shows in full, quoted in brackets. The root is `$`, and its path is empty for
  `keyPath`.
- The component records no problem inside `params`. A kind parameter is a record key of
  its kind, so its path reads `props[3].params.length`.
- A `shape` message reads `<path>: expected <requirement>, got <value>`. The value shows a
  string quoted and cut at 40 characters, a missing value as `nothing`, a list of up to
  four numbers inline, and any other list or object by its kind.
- An `id` message reads `<path>: id "<id>" is already used at <first path>`.
- Text that is not JSON yields one `shape` problem at `$`.

Two of these rules are public: `keyPath` gives the path of a record key under a parent
path, and `describeValue` renders the found value. A component that writes messages in the
same form calls them and holds no copy.

One fault yields one problem. When a value fails, the reads below it record nothing: an
object that is a number reports no missing keys, and a list over its cap reports no item.
Every number read admits finite numbers only, so a text such as `1e999` is refused at its
path. The typed value is returned only when no problem was recorded, so it never carries
the placeholders that failed reads return.

Every record takes exactly its listed keys. An unknown key and a missing required key are
each a problem at the key's path. Maps, such as base materials, glows and kind parameters,
become `ReadonlyMap` values, so no JSON key can reach an object prototype.

## The description

The description's root keys are `schema`, `name`, `base`, `seals`, `finishes`, `glows`,
`props`, the optional `statics` and `lighting`, and its schema id is
`level-designer-description/1`. The typed description leaves out the schema id, and its
`statics` is empty when the text states none.

- `base` holds `scale`, a positive number; `materials`, a map from base material name to
  an override; and `doubleSided`, a list of base mesh names.
- An override takes any of `tint`, `metalness`, `roughness`, `emissive` and `finish`; an
  omitted key keeps the source value. A `finish` is a finish path, and its role is the
  material's hall finish, below.
- A seal holds `id`, `min`, `max`, `color`, `metalness` and `roughness`. Its box passes
  when `max - min` is at least 0.05 m on every axis.
- `finishes` is the finish table, below.
- `glows` maps a free-text name to a `color` and a `strength` from 0 to 100, the type of
  an emissive override.
- A prop holds `id`, `kind`, `at` (the plan position `[x, z]`), `yaw` in degrees and
  `params`.
- `name` names the output files, so it obeys the id rule: lowercase letters, digits and
  hyphens, a letter first, at most 48 characters. It is not part of id uniqueness.

Ids are unique among seals, props and static objects together. Seals claim their ids
first, then props, then static objects, each list in order, and the first claimant keeps
the id, so a clash stands at the later record. The caps are 16 seals, 8 glows, 512 props
and 256 static objects.

Every `metalness` and `roughness` lies from 0 to 1. Surface colours, of seals and slabs,
are `#rrggbb` text in either letter case; a tint, an emissive colour and a glow colour are
linear RGB triples. `isSurfaceColor` is the one check of the surface colour form: the seal
and slab reads use it, and so can any component that admits a surface colour.

## Static objects

A static object is one box that is only drawn: litter on the floor or on a prop's top, or
an overhead object. Its record takes seven keys of its own and a box's five paint keys:

- `id`, under the id rule; `at`, the plan point `[x, z]` of its centre; `yaw`, degrees
  about +Y, by default 0; `size`, `[width, height, length]` in metres, each side at least
  0.02 m within the length slack; `lift`, the height of its underside above the floor
  under `at`, at least 0 and by default 0; `on`, the id of a prop it lies on; and `color`,
  `#rrggbb` text.
- The paint keys: `finish`, a finish path, required; `number`, an integer from 0 to
  999,999, by default 0; `wear`, from 0 to 1, by default 0.3; `seed`, an integer from 0 to
  4,095, by default `seedOfId` of the id; and `glow`, the name of one of `glows`.

`id`, `at`, `size`, `color` and `finish` are required. The admission fills every default,
so each reader of the typed record finds the same values; `on` and `glow` stay absent when
unstated. An `on` that names no prop is a `shape` problem at `statics[<i>].on`; a seal's
id names no prop. A stated `lift` beside an `on` is a `shape` problem at the `lift`, a
lift of 0 included, and the typed lift of such litter is 0. A glow name that `glows` lacks
is a `shape` problem at the `glow`. Once the whole description holds its shape, a static
object whose finish path the table lacks is a `finish` problem at its `finish`:
`statics[<i>].finish: no finish "<finish>/<role>"`, one per object.

`staticClass` reads the class from the keys: `prop` with an `on`, `overhead` with a
positive lift, and `floor` otherwise. The class's limits belong to `level-rules`.

`staticBox` reads a static object at a given height of its underside as an oriented box of
the slab's type. Its base centre stands at `at` and that height, its frame is the level's
turned by `yaw` about +Y as a prop's, so a positive yaw turns the length toward +X, and
its width, height and length lie along its X, Y and Z. The reading does not round. The
height and the support belong to the build that places the object.

## The finish table

The finish table maps a finish name to a finish: its `cut`, its `light` and its `roles`. A
role maps to one recipe, and a finish path `finish/role` names one. Finish and role names
obey the id rule; the table caps neither count.

- `cut` holds `family`, one of the four slab materials, and `color`; `light` is a colour.
  Both colours are `#rrggbb` text.
- A recipe takes any of `body`, `layers` and `extends`, another role of the same finish.
- A body takes any of `shade` from 0 to 4, `metalness`, `roughness` and `lit`, each from 0
  to 1.

### A layer

A layer takes `kind`, its kind's keys, the common keys and at least one effect, all in one
flat record. A layer of a missing or unknown kind reports its kind, and no key of a kind
and no effect count.

- The kinds: `bands` (`along`, `period`, `width`; `phase`, `offset`, `fit`, `ramp`),
  `rectangle` (`from`, `to`), `dots` (`pitch`, `radius`; `phase`, `offset`, `fit`),
  `noise` (`wavelength`; `threshold` with `softness`), `cells` (`width`, `height`, `gap`;
  `shift`, `fit`, `share`), `face` (no key), `disc` (`at`, `radius`; `inner`, `diamond`)
  and `border` (`width`; `inset`).
- The common keys: `on`, one of `outside`, `inside`, `sides`, `top`, `bottom`, `end+`,
  `end-`, `ends`, `edges` and `all`; `across`, `ends` or `out`; `up`, `top`; `clip`, two
  corners `from` and `to`; `detail`, `medium` or `fine`; `wear`, a boolean; `amount`.
- The effects: `shade` and `paint` from 0 to 4; `color`, `#rrggbb` text or `"glow"`;
  `metalness`, `roughness` and `lit` from 0 to 1; and `jitter`, a record of `low` and
  `high`, each from 0 to 4.

#### The rules of the keys

- A phase lies from 0 to 1, and so do `amount`, a threshold and a cell's `shift` and
  `share`. A softness lies above 0 and at most 1.
- A band's `fit` is `true` or absent, and a band along `diagonal` takes none. The `fit`
  of a dot lattice and of cells names `across`, `up` or `both`. The format sets no limit
  of a dot's radius against its pitch, nor of a disc's `inner` against its radius.
- A border's `width` is one size for the ends, the top and the base, or a record of the
  three, `ends`, `top` and `base`, each a size. The typed border always holds the three
  widths, and the canonical text writes the record.
- A border takes neither `across` nor `up`, each a problem at its key: under `ends` or
  `out` its frame would draw a line down the face's centre, and under `top` its top and
  base widths would swap.
- A `jitter` on a kind other than `cells` is a problem at the `jitter`. It still counts as
  the layer's effect, so it yields that one problem.

### Lengths

A length is plain metres, or text that adds a share of the face to metres: `"0.25w"`,
`"1h-0.1"` or `"-0.5w+0.2"`. The typed length holds its metres and at most one share, a
factor of the face's width or height, so every typed length has one canonical text. A
point and a pair of sizes are `[across, up]`.

- Every length bounds each term, the metres and a share's factor, at a magnitude of
  1,000, so no length reaches a shader as a 32-bit infinity.
- A position (`from`, `to`, `at`, a clip's corners, `offset`) takes any terms within the
  bound.
- A size (`period`, `width`, `height`, `radius`, `pitch`, `wavelength`) takes no negative
  term and is above zero as stated. Each of its terms is 0 or at least one grid step,
  0.0001, so no size reaches a shader as a 32-bit zero. A `ramp`, a `gap`, an `inner` and
  an `inset` take the same floor and may also be 0.

### Defaults and caps

The admission fills the default of every key a stated record leaves out: `on` is
`outside`, `wear` false and `amount` 1; a phase is one half and an offset and a ramp 0; a
cell's `shift` and `share` are 0; a disc's `inner` is 0 and `diamond` false; an `inset`
is 0; a stated body's keys take the default body's. A recipe's `body`, a layer's
`across`, `up`, `clip` and `detail`, the `fit` of a dot lattice and of cells, and a
noise's mask stay absent when unstated.

A recipe draws at most 24 layers and at most two `noise` layers, the extended role's among
them. Each cap is a problem at the role's `layers`. An `extends` that names no role of the
finish, or a role that itself extends, is a problem at the `extends`.

### The drawn recipe

`recipeAt` is the one reading of a finish path. It returns what drawing the role needs:
its body, its layers and its finish's `light`, the `#rrggbb` text as the table states it.
An extending recipe draws the extended role's layers before its own and takes that role's
body unless it states one. A recipe left without a body draws the default body: shade 1,
metalness 0, roughness 0.6 and lit 0. A path the table lacks reads as no recipe.

### A hall finish

A role that a base override's `finish` names is a hall finish: a renderer draws the stage
material as the base shade and the role's layers over it. The description judges each
named path once, after the whole description holds its shape, as the decoder judges a
slab's path:

- A path the table lacks is a `finish` problem at the override's `finish`:
  `base.materials["<name>"].finish: no finish "<finish>/<role>"`.
- The drawn recipe, the extended role's layers among them, states no `body`, no `lit`
  effect and no layer on a face other than `top`, `bottom` and `outside`. Each such value
  is a `shape` problem at its own path in the table, so a fault gained through `extends`
  stands at the extended role, and the message names the hall finish's path.

A role that no override names keeps every key of a recipe. A role that both an override
and a slab name is admitted, and the hall finish's limits hold for both.

## The seed of an id

A prop's or a box's default seed is `seedOfId` of its id, from 0 to `MAX_SEED`, 4,095.
It takes the top 12 bits of the id's FNV-1a 32-bit hash, mixed by MurmurHash3's 32-bit
finaliser, so ids that differ in one character spread like random seeds. A seed sets a
look, so the function never changes.

## Lighting

The section holds `environment` (`intensity`, `ambient`, `overhead`), an optional `key`
(`color`, `intensity`, `direction`, `shadow`), `points`, each with `position`, `color`,
`intensity` and `range`, then `haze` (`density`, `color`, `glow`) and `exposure`. The
shadow holds `mapSize`, `bias`, `normalBias` and `radius`.

Colours are linear triples with each channel from 0 to 1. Intensities, ranges, the haze
density and the haze glow are not negative, and the exposure is positive. The shadow's map
size is 1024, 2048 or 4096, its bias lies from -0.01 to 0.01, its normal bias from 0 to 1
and its radius from 0 to 16. The shadow sits inside the key, and the key is optional, so a
section holds at most one key; it holds at most 32 points. The key's direction is a unit
vector with positive y.

## The level `.json`

The root keys are `schema`, `finishes`, `props` and `lighting`, and the schema id is
`level-designer-level/1`. `finishes` is the description's finish table, read by the same
admission and written with every default filled. A prop holds an id, unique among the
props, and a list of at least one slab. The typed level leaves out the schema id, because
the text alone carries it.

A slab holds nine keys. `size`, `material`, `color`, `position` and `rotation` give its
box, and the rotation is a unit quaternion `[x, y, z, w]`. Its four finish keys follow:
`finish`, a finish path; `number`, an integer from 0 to 999,999; `seed`, an integer from 0
to `MAX_SEED`; and `wear`, from 0 to 1.

The decoder checks the shape and the ids first. Only a level that passes both reaches the
finish paths and the slab admission. A slab whose path the level's table lacks is a
`finish` problem at its `finish`: `<path>: no finish "<finish>/<role>"`. A renderer joins
a slab's mesh to its recipe by that path, so the decoder judges it once at the boundary.
The slab problems are exactly the ones `admitSlabs` returns for the same props.

The encoder only formats. It writes every record in its canonical key order, indents by
two spaces and ends the text with a newline. Equal levels therefore give equal bytes,
whatever order their keys were built in, and decoding an encoded level returns the same
level. The encoder never rounds, so a level is rounded to the grid before it is encoded.

## The grid

The component owns the grid and the one rounding to it. Slab lengths lie on a 0.1 mm grid
and quaternion components on nine decimals. `roundSlab` puts a slab's size and position
on the length grid and its rotation on the component grid, and keeps its material and
colour. A half step rounds away from zero, judged on the typed decimal and not on its
float product, and rounding never yields a negative zero. Rounding twice equals rounding
once, and the rounded rotation of a unit quaternion stays within the unit tolerance.

`formatLength` is the one way a message prints a length. It prints the length grid's
rounding, so it shows the value `roundSlab` stores, with the digits `String` prints and
no unit. The slab admission and the seal thickness message print their lengths through
it.

## The slab admission

`admitSlabs` takes the level's props and holds the format caps that follow destruction
lib's measured costs:

- a level holds at most 1,024 slabs;
- each side of a slab lies from 0.02 to 40 m;
- a slab's face, width by height, is at most 25 m2.

A broken size reads `<path> slab <k>: <w> x <h> x <t> m breaks <limit>`. The path is the
prop's, `props[i]`. A level lists its props in description order, so that path names the
same prop in the description and in the level. Slab `k` counts from 0 in slab order. A
slab that breaks both size limits yields one problem per limit. The count cap reads `the
level has <n> slabs; the format admits 1,024` at the path `props`.

## Limits and tolerances

Length limits compare with a slack of 0.05 mm, half a grid step. A length typed at its
limit passes despite float error, and a value one 0.1 mm step beyond fails. The face cap
has its own slack of 0.00005 m2. Ranges without a length unit, such as metalness or
strength, compare exactly. A unit vector or quaternion passes when its length is within
0.000001 of 1, which admits components rounded to nine decimals.

The facade exports the length slack as `LENGTH_SLACK` and the point-light cap as
`MAX_POINT_LIGHTS`, so the validator and the report read these limits from their owner.

## The oriented box

`slabBox` and `staticBox` share one reading of a box. A slab's frame has its width along
local +X, its height along local +Y and its thickness along local +Z, toward the +Z face;
a static object's has its length there. The origin is the base centre. A box holds the
world centre, the three local axes as world unit vectors, the half extents and the eight
corners. Corner `k` takes the + side of local X when bit 0 of `k` is set, of Y for bit 1
and of Z for bit 2.
