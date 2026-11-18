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
- A static object fills a gap, for realism and for nothing else. It is floor litter, or
  an overhead object on a wall, a deck or the ceiling. It lives in `statics`, has no kind
  and no slab, appears nowhere in the level `.json` and carries the role `static` in the
  `.glb`.

A static object is only drawn. It has no collision and takes part in no simulation: no
body, ray or piece of debris meets it, no navigation counts it and no proof runs on it. A
player walks through it and shoots through it. Three limits follow, and the build
enforces each with a number:

- It gives no cover. Whatever a body can stand behind is a prop, so all cover stays
  destructible.
- It blocks no path. Nothing in the game and nothing in the QA walk collides with it.
- It blocks no sight line. Litter lies under the foot, and an overhead object starts
  above every body's head.

No static object is therefore a rack, a rail, a bollard, a cart, a column, a cabinet on
the floor or stock that stands. No object on a wall hangs lower than the hang height,
and none hangs on a prop: a crane's hook block hangs free, without a cable. The kit keeps
its nine kinds; a static object is not a tenth.

## Static objects

### The two classes and their limits

A static object is a box. Its `lift`, the height of its underside above the floor, names
its class: litter has none, and an overhead object has one. Floor litter is thin and
small:

- It tops out 0.15 m above the floor or lower: the height of a pallet, the tallest thing
  in the references that lies flat. A body walks through it, so a taller thing would read
  as an obstacle that gives way.
- Its longer plan side measures 1.5 m or less, about a pallet's. A longer flat thing, a
  track, a duct or a line, is a layer of the floor's hall finish.
- It lies on one floor level, off the ramp and off the slab's edge, where a flat box
  would float or sink.

An overhead object starts at the hang height or higher, 2.17 m, counted from the hall's
highest floor, the raised slab. `level-rules` owns that height for a hanging prop: every
body of the game passes under it. It keeps the players' sight clear by one fact: an
object that starts above a height hides nothing below it, because a sight line from an
eye to a point under that height stays under it. Counted from the highest floor, the hang
height lies above every body on either floor, so no eye loses any part of a body behind
an overhead object. A lift that ends lower is refused.

### What the references show

Floor litter:

- pallets, as in both jib images and at the machine's foot in the machine bay;
- plates, flat sheet stock and offcuts, as on the crane shop's floor;
- a cable or a hose that lies on the floor, common in such plants.

Overhead objects:

- sign boards: the bay signs that hang over the assembly hall's floor, each on thin
  hangers from a truss, and the boards on its columns;
- lamps on the walls and under the trusses: the floodlights on the crane shop's columns
  and the high-bay lamps of the three cranes;
- the dressing of a gallery on a deck: the glazed gallery above the night line, cabinets
  with lit screens as on the teal aisle's cabinet wall, and a handrail as on the double
  girder.

A hanger is a static object too, a thin box from the truss down to its sign. The art
team's brief settles the list of objects.

### The shape and its keys

A box serves every object above, so a static object is one box, and no other shape is
built. A round part is painted, as a hub disc is on an arm.

The description's `statics` lists the static objects, apart from `seals` and from
`props`. A static object takes a box's paint keys, which "A box: a seal or a static
object" lists, and six keys of its own, which follow a prop's pose:

- `id`, unique among seals, static objects and props;
- `at`: `[x, z]`, the plan point of its centre;
- `yaw`: degrees about +Y, by default 0, for litter that lies askew; a positive yaw turns
  its length toward +X, as a prop's. A wall, a deck and a truss stand square to the hall,
  so an overhead object leaves it at 0;
- `size`: `[width, height, length]` in metres, each at least 0.02; at yaw 0 the width
  runs along X and the length along Z;
- `lift`: the height of its underside above the floor under `at`. A lift of 0, the
  default, makes floor litter, so no author types a floor's height; a positive lift, an
  overhead object;
- `color`: its tint, as `#rrggbb` text.

A pallet on the floor and a sign board on a pier's face read like this:

```json
{ "id": "pallet-7", "at": [8.4, 12.1], "yaw": 17, "size": [1.0, 0.14, 1.2],
  "color": "#a8743f", "finish": "timber/pallet" },
{ "id": "sign-pier-3", "at": [15.09, 3.05], "size": [0.06, 0.8, 1.6], "lift": 4.2,
  "color": "#9a2a1c", "finish": "sign/board", "number": 3 }
```

### In the build and the pair

A static object joins the build after sec-111's preparation, with the props. The
pipeline stands it on the prepared floor under `at`, raised by its lift, and `level-glb`
appends it to the level scene. The static scene that sec-111 prepares holds the base
stage and the seals alone, so the body world, the navigation, the spawns and the floors
never hold a static object.

In the `.glb` it is an object node with the role `static`, after the seals and before
the props, with one box mesh. The level `.json` holds none of it: a renderer reads its
geometry, its look and its role from the `.glb`.

### What judges a static object

- `place`, a build error: its `at` lies inside the interior, as a prop's.
- `interior`: its box stays inside the interior.
- `static`: the limits of its class. `level-rules` owns all three numbers in this one
  rule: the litter's top, the litter's length and the hang height it already holds.

No other rule judges it, because no body meets it and no sight line between bodies
crosses it. `gap`, `spawn`, `lane`, `overlap`, `support`, `floor`, `ramp` and `low-top`
stay rules for props, and `destructible` and `proxies` prove slabs. Whether a static
object touches the wall, the deck or the floor it belongs to shows on the sheets and in
the owner's QA, as it does for a prop against the base stage.

### Caps

- The description admits at most 256 static objects.
- A static object is a box of 12 triangles. All of them add at most 3,072 triangles under
  the cap of 300,000, which the validator counts on the `.glb`.
- A static object adds nothing to sec-111's body world or to any of its budgets.

### In the QA app and on the sheets

The QA walk installs one blocker for each slab of the level `.json` and none for a static
object, so the capsule walks through litter as the player will. The view draws a static
object with its finish. Like every level mesh it casts and receives the key's shadow;
that is drawing, not simulation.

The level sheets draw a static object as they draw a seal, in its colour and without a
number. The finish sheet shows its finish.

### At adoption

sec-111's level preparation skips a `static` node, as it skips a `destructible` one: no
structure, ray, debris or navigation meets it. Its stage view draws the node with the
painter.

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

- The seals: the end wall as cladding with a gate, the door and the four windows as
  shutters. The end wall is the level's largest plain face, 35 by 20 m.
- The static objects: pallets, plates and offcuts where a line or the yard looks swept,
  bay signs on their hangers along the centre aisle, and the edge of the front deck,
  which faces the opening view, with a glazed gallery, cabinets and a handrail.
- The two floors: the front floor, and the raised slab with its ramp. A floor fills a
  third or more of the frame from every spawn. Every daylight reference marks its floor,
  and the mood images show a sealed floor with joints: the joints, the aisle's lines and
  the lines around the cells and the yard's slots.
- The side walls with their piers: they stand at eye level beside every lane. The
  references' walls are painted, pale above a darker base.

The raised slab's role holds layers on `top` alone: its stage material also covers the
back wall, the partitions under the decks and most pipes and tanks. Those, the ceiling,
the trusses and the decks keep the look of the base stage. The owner steers what follows
at the milestone tests.
