# Non-destructible objects

Three things in the level never break: the seals, the static objects and the hall's own
surfaces. Players see them close up, so they take the same look development as the props,
with finishes of their own. This document states what a static object is and what limits
it, the records of a static object, of a box's paint and of a hall finish, how a finish
reaches each of the three, what makes their finishes richer and still cheap, and what the
art direction paints first. The [finish format](finish-format.md) defines the finish
table, the level pair, the rules of drawing and the checks.

## Destructible and static

The level keeps two families apart, in the description, in the pair and in the rules:

- A prop is a dressed destructible object, for gameplay: cover that breaks. It lives in
  `props`, is built from slabs by one of the kit's nine kinds, is listed in the level
  `.json`, carries the role `destructible` in the `.glb` and passes the destructibility
  proof.
- A static object fills a gap, for realism and for nothing else. It is litter, on the
  floor or on a prop's top, or an overhead object on a wall, a deck or the ceiling. It
  lives in `statics`, has no kind and no slab, appears nowhere in the level `.json` and
  carries the role `static` in the `.glb`.

A static object is only drawn. It has no collision and takes part in no simulation: no
body, ray or piece of debris meets it, no navigation counts it and no proof runs on it. A
player walks through it and shoots through it. Three limits follow, and the build
enforces each with a number:

- It gives no cover. Whatever a body can stand behind is a prop, so all cover stays
  destructible. Litter on a prop goes with the slab it lies on, at that slab's first
  damage.
- It blocks no path. Nothing in the game and nothing in the QA walk collides with it.
- It blocks no sight line. Litter is 0.15 m high at most, on the floor or on a prop's
  top, and an overhead object starts above every body's head.

No static object is therefore a rack, a rail, a bollard, a cart, a column, a cabinet on
the floor or stock that stands. No object on a wall hangs lower than the hang height,
and none hangs on a prop: a crane's hook block hangs free, without a cable. The kit keeps
its nine kinds; a static object is not a tenth.

## Static objects

### The art direction

The owner directs the static objects: the dark factory is in total chaos, and the rebel
robots have messed up its interior. Litter lies everywhere, papers, metal sheets and
broken tools, on the floor and on the tops of the production lines and the tables. The
level holds no table, so a table top is the bench-high top of a prop: a conveyor's deck
first, then a top that a player looks down on, such as a crate's lid, a low stack or an
arm's pedestal.

The static objects are cheap and add little geometry. Each is one box, and its richness
is paint.

### The classes and their limits

A static object is a box, and its keys name its class: with `on` it is litter on a prop,
with a positive `lift` an overhead object, and with neither floor litter. Litter is thin
and small, wherever it lies:

- It is 0.15 m high or lower: the height of a pallet, the tallest thing in the references
  that lies flat. A body walks through it, so a taller thing would read as an obstacle
  that gives way.
- Its longer plan side measures 1.5 m or less, about a pallet's. A longer flat thing, a
  track, a duct or a line, is a layer of the floor's hall finish.

Floor litter lies on one floor level, off the ramp and off the slab's edge, where a flat
box would float or sink.

Litter on a prop lies on one of that prop's tops. A top is the level upper face of a slab;
a pitched slab, an arm's link or a jib's tie, has none. The build stands the litter on the
highest top whose plan outline holds its `at`, on a tie the first in slab order, and that
slab is the litter's support. Such litter lies on no floor, so the floor and the ramp are
not judged for it.

An overhead object starts at the hang height or higher, 2.17 m, counted from the hall's
highest floor, the raised slab. `level-rules` owns that height for a hanging prop: every
body of the game passes under it. It keeps the players' sight clear by one fact: an
object that starts above a height hides nothing below it, because a sight line from an
eye to a point under that height stays under it. Counted from the highest floor, the hang
height lies above every body on either floor, so no eye loses any part of a body behind
an overhead object. A lift that ends lower is refused.

### What the owner and the references name

Litter, the owner's three kinds first:

- papers: loose sheets, drawings and manuals, alone and in drifts;
- metal sheets: plates, flat sheet stock and offcuts, as on the crane shop's floor;
- broken tools and parts of tools, each a box whose marks are painted;
- pallets, as in both jib images and at the machine's foot in the machine bay;
- a cable or a hose that lies on the floor, common in such plants.

The same kinds lie on the tops, in the sizes a top holds.

Overhead objects:

- sign boards: the bay signs that hang over the assembly hall's floor, each on thin
  hangers from a truss, and the boards on its columns;
- lamps on the walls and under the trusses: the floodlights on the crane shop's columns
  and the high-bay lamps of the three cranes;
- the lamps of the emergency wall lights, which the owner names: small cold lamps on the
  walls and the piers beside the passways, each a box with a glow and a point light
  before it;
- the dressing of a gallery on a deck: the glazed gallery above the night line, cabinets
  with lit screens as on the teal aisle's cabinet wall, and a handrail as on the double
  girder.

A hanger is a static object too, a thin box from the truss down to its sign. The art
team's briefs settle the lists of objects.

### The shape and its keys

A box serves every object above, so a static object is one box of 12 triangles, and no
other shape is built. A round part is painted, as a hub disc is on an arm.

The description's `statics` lists the static objects, apart from `seals` and from
`props`. The key is optional: a description without it holds no static object. A static
object takes a box's paint keys, which "A box: a seal or a static object" lists, and
seven keys of its own, which follow a prop's pose:

- `id`, unique among seals, static objects and props;
- `at`: `[x, z]`, the plan point of its centre;
- `yaw`: degrees about +Y, by default 0, for litter that lies askew; a positive yaw turns
  its length toward +X, as a prop's;
- `size`: `[width, height, length]` in metres, each at least 0.02; at yaw 0 the width
  runs along X and the length along Z;
- `lift`: the height of its underside above the floor under `at`, by default 0 and never
  negative, so no author types a floor's height; a positive lift makes an overhead object;
- `on`: the id of a prop, for litter that lies on that prop. It comes without `lift`;
- `color`: its tint, as `#rrggbb` text.

The admission fills every default, the seed among them, so each reader of the typed
record finds the same values. The finish sheet shows a box's upper face, its lower face
and its sides along the width. An author therefore types the side that carries a mark as
the width and turns the box by its yaw: a board on a wall that faces along X takes a yaw
of 90.

A pallet on the floor, a metal sheet on a conveyor and a sign board on a pier's face read
like this:

```json
{ "id": "pallet-7", "at": [8.4, 12.1], "yaw": 17, "size": [1.0, 0.14, 1.2],
  "color": "#a8743f", "finish": "timber/pallet" },
{ "id": "sheet-12", "on": "line-w-conv-1", "at": [-4.3, -2.1], "yaw": 31,
  "size": [0.6, 0.02, 0.4], "color": "#8b9097", "finish": "litter/sheet" },
{ "id": "sign-pier-3", "at": [15.09, 3.05], "yaw": 90, "size": [1.6, 0.8, 0.06],
  "lift": 4.2, "color": "#9a2a1c", "finish": "sign/board", "number": 3 }
```

### One placement

A static object joins the build after sec-111's preparation. The static scene that sec-111
prepares holds the base stage and the seals alone, so the body world, the navigation, the
spawns and the floors never hold a static object.

`level-pipeline` places every static object once, in a step of its own after the props are
expanded, rounded and admitted:

- floor litter and an overhead object stand over the prepared floor under `at`, raised by
  the lift;
- litter on a prop stands on its support's top.

The step yields one placed box per static object, in description order: the box where it
stands, as an oriented box of `level-format`, the type that a slab's box has. Its three
axes are the box's X, Y and Z. Each fact of a placement has one owner:

- `level-format` owns the class that a static object's keys name, and the reading of its
  `at`, `yaw` and `size` as an oriented box at a given height of its underside.
- `level-pipeline` owns that height, a litter's support, as the prop and the index of the
  slab, and the `place` error.
- `level-glb` owns the name of the support's mesh node.

Every consumer reads the one placement, and none computes a second:

- `level-glb` draws the placed box with the object's id and paint, and writes the support.
- `level-rules` judges the sixth fact of a built level: a list of pairs, each a static
  object of the description with its placed box. It reads the object's id and class from
  the pair.
- `level-cli` reads the description alone: a swatch takes a box's size and paint, not its
  place.

### In the pair

In the `.glb` a static object is an object node with the role `static`, after the seals
and before the props, with one box mesh. A litter on a prop names its support there, the
mesh node of the slab it lies on: sec-111 hides that node at the slab's first damage, and
the litter goes with it. The level `.json` holds none of it: a renderer reads a static
object's geometry, its look and its role from the `.glb`.

### What judges a static object

- `shape`, a build error of the admission: its record's form. An `on` names a prop and
  comes without `lift`.
- `place`, a build error: its `at` lies inside the interior, as a prop's, and a litter on
  a prop has a top of that prop under its `at`.
- `interior`: its placed box stays inside the interior.
- `static`: the limits of its class. `level-rules` owns all three numbers in this one
  rule: the litter's height, the litter's length and the hang height it already holds.

No other rule judges it, because no body meets it and no sight line between bodies
crosses it. `gap`, `spawn`, `lane`, `overlap`, `support`, `floor`, `ramp` and `low-top`
stay rules for props, and `destructible` and `proxies` prove slabs. The build stands
litter on its floor or its top. Whether an overhead object touches its wall, its deck or
its truss, and whether a litter overhangs its top or enters a prop, shows on the sheets
and in the owner's QA, as it does for a prop against the base stage.

### Caps

- The description admits at most 256 static objects.
- A static object is a box of 12 triangles. All of them add at most 3,072 triangles under
  the cap of 300,000, which the validator counts on the `.glb`.
- A static object adds nothing to sec-111's body world or to any of its budgets.

### In the QA app and on the sheets

The QA walk installs one blocker for each slab of the level `.json` and none for a static
object, so the capsule walks through litter as the player will. The view draws a static
object with its finish. Like every level mesh it casts and receives a key's shadow, in a
level that states a key; that is drawing, not simulation. The QA app shows no damage, so
there a litter stays on its prop.

The level sheets draw a static object as they draw a seal, in its colour and without a
number. The finish sheet shows its finish on a page of its path, as "What agents see" of
`design.md` states.

### At adoption

sec-111's level preparation skips a `static` node, as it skips a `destructible` one: no
structure, ray, debris or navigation meets it. Its stage view draws the node with the
painter. When its wall view hides a slab's mesh node at the slab's first damage, the
stage view hides every `static` node whose support names that node.

## How a finish reaches a non-destructible object

### A box: a seal or a static object

A seal and a static object are boxes, and a box takes five paint keys:

- `finish`: a path of the table. A static object requires it. A seal without it draws
  flat, by its own `metalness` and `roughness`. A seal with it states neither: the
  recipe's body owns both.
- `number`: an integer from 0 to 999,999, by default 0, for a legend's digits.
- `wear`: from 0 to 1, by default 0.3.
- `seed`: from 0 to 4,095, by default the hash of the box's id.
- `glow`: a name of `glows`, for the box's lit parts.

Every static object and every seal that names a finish is a painted box. It uses the
painters of the props and adds no mechanism:

- Each of its six faces has a frame of its own, by the box's frame rule. Its four sides
  are outside faces, its upper face is a top and its lower face a bottom, as a slab's, so
  a path that a box and a slab share draws alike on both.
- Its vertices carry what a slab's carry: the pattern coordinates, the face's size and
  class, and the box's number, seed and wear. Its colour is the tint.
- Its material is the shared one of its finish path and glow. A box and a slab of one
  path draw with one program.
- A `glow` lights its lit parts, and a `number` feeds a legend's digits, so a sign reads
  its bay and a gallery's windows shine.

### A surface of the hall

The base stage brings its own materials and textures. A base override takes one more
optional key, `finish`: a path of the table. That role is a hall finish. When it holds a
layer, the view draws every surface of that stage material through the stage wrap, a
static material:

- The stage material's own look is the base shade: its textures, its factors and its
  override. The role's layers draw over it. Where no layer covers, the surface shades
  exactly as its source.
- The frame is the level's: a floor is painted in plan coordinates, a wall in its
  horizontal level coordinate and the height. The face is the interior box's, by the
  hall's frame rule.
- The class comes per pixel from the surface's own normal. On a curved part, a pipe or a
  tank, an `on: "top"` layer therefore draws on the band that faces up.
- The `.glb` carries the role's path as `finish` in the `extras` of the stage material and
  of its double-sided twin.

A hall finish differs from a slab's role only where the mechanism cannot serve a key. Each
rule holds also through `extends`, and a fault is reported at the offending value, with
the hall path in its message:

- It states no `body`. The stage material, with its textures and its override, is the
  base shade.
- It takes no `lit` effect and no `glyphs` layer: a hall surface has no glow to emit
  with and no number to read digits from.
- Its layers draw on `top`, a surface that faces up, on `bottom`, one that faces down,
  or on `outside`, the default, one that faces sideways. A hall surface has no other
  face.
- Its coordinates are level coordinates. `across: "ends"`, `up: "top"`, `fit` and
  `border` therefore measure the hall: a `border` at the `base` of a wall is a dado, and
  one on a floor follows the walls. A position is a level coordinate, so a share serves
  as a length only.

A hall finish may hold `noise` layers under the recipe's caps, as any role may.

A floor line is a layer of a floor's hall finish: a `rectangle` on `top` between two plan
points `[x, z]` of the level frame, with a `color`, mixed into the floor's own material.
It adds no object and no collision. One mechanism serves the lines and every other mark
of the hall. A floor's roles read like this: `floor` holds the joints and the bays' tone
steps, and `front` extends it with one line of the centre aisle:

```json
"floor": {
  "layers": [
    { "kind": "cells", "on": "top", "width": 6.64, "height": 6.64, "gap": 0.025,
      "fit": "across", "shade": 0.55, "jitter": { "low": 0.9, "high": 1.1 } }
  ]
},
"front": {
  "extends": "floor",
  "layers": [
    { "kind": "rectangle", "on": "top", "from": [-2.65, -27.94], "to": [-2.55, 26.8],
      "color": "#9c7618" }
  ]
}
```

## More detailed, and cheap by design

The art team's briefs say, surface by surface, what "more interesting and detailed"
means: which marks, at which sizes and values, from which reference. A non-destructible
finish can hold more than a prop's, because it carries less:

- It is never cut. It states no cut look and no inside face, and it need not agree with
  a second view of the same slab once it is damaged.
- It is drawn whole, by one path of one renderer. A mark may sit anywhere on it; no split
  run has to meet another in step.
- A box's recipe therefore spends the caps on what a player sees from arm's length:
  seams, fixings, labels and wear at the `fine` detail, which fades beyond 4 m.
- A hall surface keeps its textures. They carry its tone and its stains, and the recipe
  adds what a texture of 1,024 px cannot hold on a wall 120 m long: joints, lines and
  bands that stay sharp at any distance.

It stays cheap by the design's own means, and by where it is drawn:

- The templates, the caps and the one static material per finish path are the props'.
- A static object is one box, and its richness is paint. Every painted path is one more
  program at the view's start, so the litter shares few paths: a piece differs from the
  next by its size, its tint, its seed and its wear.
- A box covers few pixels. From the spawns the seals cover up to 8 % of the frame; litter
  is small, and an overhead object hangs far from the eye.
- The hall covers most of every frame, the floor alone a third or more. Its marks are
  arithmetic kinds first. A hall finish may hold noise under the recipe's caps, and the
  art direction reaches for it last there.
- Only a stage material that names a finish is wrapped. The others draw as the `.glb`
  states them.

The owner reads the frame rate after each of these lands, and lighter recipes come first
when it drops.

## What the art direction paints first

- The two floors: the front floor, and the raised slab with its ramp. A floor fills a
  third or more of the frame from every spawn. Every daylight reference marks its floor,
  and the mood images show a sealed floor with joints: the joints, the aisle's lines and
  the lines around the cells and the yard's slots.
- The side walls with their piers: they stand at eye level beside every lane. The
  references' walls are painted, pale above a darker base.
- The litter of a factory in chaos: papers, metal sheets and broken tools on the floor
  and on the tops of the lines and the bench-high props, with pallets and offcuts where a
  line or the yard looks swept.
- The seals: the end wall as cladding with a gate, the door and the four windows as
  shutters. The end wall is the level's largest plain face, 35 by 20 m.
- The overhead objects: bay signs on their hangers along the centre aisle, and the edge
  of the front deck, which faces the opening view, with a glazed gallery, cabinets and a
  handrail.

The raised slab's role holds layers on `top` alone: its stage material also covers the
back wall, the partitions under the decks and most pipes and tanks. Those, the ceiling,
the trusses and the decks keep the look of the base stage. The owner steers what follows
at the milestone tests.
