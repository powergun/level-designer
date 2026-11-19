# Look development build plan: milestones 4 to 7

This document holds the last four milestones of the look development build plan,
`build-plan.md`. That plan's working rules and its "How a milestone ends" hold here, and
a subtask number below 4.1 names a subtask of that plan. Terms, premises and component
surfaces come from the [design](design.md), the data and its rules from the
[finish format](finish-format.md), and the static objects and the hall from
[non-destructible objects](non-destructible-objects.md).

## Milestone 4: the other prop finishes

### 4.1 The seven finishes (art team)

- Scope: `cast-concrete`, `bed`, `casting`, `timber`, `steel-stock`, `luminaire` and
  `block`, with their lit parts and without legends, by the briefs. The two brick fences
  take `block`, and a partition's `finish` names the barriers and the stacks.
- Checks: as 2.6.

### 4.2 The owner's test (lead)

- Starts: the QA app, on both machines. A failure: the run log.
- Judges the art direction: the beds and the arms against the blue lines and the night
  line images, the stock and the crates against the crane shop and both jib images, and
  the strips' lamps against the teal aisle.
- Judges the frame rate: at each spawn and along both lines, with every prop painted.

## Milestone 5: floor lines, litter and the lighting pass

The level the owner passed is proved for layout and stays: no passed prop moves, turns or
leaves. The owner named no prop to add, so the milestone adds none; the art study's two
offers, cabinets beside the housings and stock in the yard, stay out. The floors gain the
layout's lines, and the static objects enter the level as the litter of a factory in
chaos: papers, metal sheets and broken tools on the floor and on the tops of the lines
and the bench-high props. The view and the QA page need no change: a painted box draws by
the twins of 1.8, and the walk installs blockers for slabs alone.

The static objects' mechanism is built whole here and admits an overhead object too,
through `lift` and the hang height. The level takes at most 200 pieces of litter, in at
most six new finish paths.

The owner's test of the litter opens the lighting pass, which ends the milestone. The
lights change to the owner's mood, a dark factory, in small steps that the owner tests
one by one. The pass adds 17 overhead objects, the lamps of the emergency wall lights, so
the level holds 217 static objects and leaves 39 of the cap to milestone 6.

### 5.1 The floor lines (art team)

- Scope: the layout's lines around both assembly lines and at the yard's slots, as layers
  of the floors' hall finishes, with their places in the hall's brief.
- Checks: the validator accepts. The reviewer compares the description with the committed
  one: every passed prop keeps its `at` and its `yaw`, none is gone and none is added.
  The reviewer reads each new floor line against the plan sheet beside the floor's page.

### 5.2 The brief of the litter (art team)

- Scope: a brief, beside the painter notes: the kinds of litter, each with its sizes, its
  tints and its reference; where it lies, on the floor and on which tops; its finishes,
  six new paths at most; and what "more interesting and detailed" means on each.
- Checks: the reviewer reads the brief against the owner's direction, the references and
  the limits of a static object. Nothing in it gives cover, blocks a path or stands in a
  sight line. Every piece is one box inside the litter's limits, and litter on a prop
  lies on a top that a player looks down on. Every mark is a layer the format can state,
  inside the caps.

### 5.3 `level-format`

- Scope: `statics`, an optional root key, with its cap; a static object's seven keys and
  five paint keys, every default filled, the seed among them; ids unique among seals,
  static objects and props; a static object's class, and its reading as an oriented box
  at a given height of its underside.
- Checks of the record: 256 static objects pass and 257 fail. A side of 0.02 m passes and
  one step below fails. A lift of 0 passes and a negative one fails. Each paint key passes
  at its limits and fails beyond. A path the table lacks returns `finish`. A `glow` that
  `glows` lacks, an id that a seal and a static object share, an `on` that names no prop
  and a `lift` beside an `on` are refused, each with its path. A description without
  `statics` admits as before and holds no static object.
- Checks of the box: at a stated height and a yaw of 30 degrees the eight corners equal
  hand-computed points, and a yaw of 90 turns the length to +X.

### 5.4 `level-glb` (after 5.3)

- Scope: a static object's node in the level scene, between the seals and the props,
  with the mesh of its placed box and a litter's `support`; a painted box's colour and
  three accessors, by the box's frame rule; its path's material.
- Checks: every sentence of the finish format's GLB section on a static object is
  asserted on a written file. On a yawed box each of the six faces carries its
  hand-computed frame at its four corners. A litter on a prop names a mesh node of the
  file, and floor litter carries no `support`. A box and a slab of one path and glow
  share one material.

### 5.5 `level-rules` (after 5.3)

- Scope: first the component's rule of five facts, rewritten to six: the sixth pairs each
  static object with its placed box. Then `interior` for a static object, and `static`,
  on the hang height of `support`. The rules read an object's id, class and box from its
  pair.
- Checks, on a box room, each limit at its value and 0.1 mm beyond: the interior's edge;
  a litter 0.15 m high and one 1.5 m long, also yawed, on the floor and on a prop; an
  overhead object at the hang height over the higher of two floors, also where it hangs
  over the lower. A floor litter with a corner on another floor level fails, and so does
  a lift that ends lower. A floor litter whose plan outline enters the ramp zone fails,
  with the zone's z extent. A litter on a prop passes over two floor levels and over the
  ramp zone.

### 5.6 `level-pipeline` (after 5.4, 5.5)

- Scope: a step after the slab admission places every static object once: over the floor
  under its `at`, raised by its lift, or on the highest top of its prop under its `at`.
  `place` judges `at`. The placed boxes go to `level-glb`, with each box's paint and each
  path's body from `recipeAt`, and with their records into the built level, for the
  validation.
- Checks of the build: the fixture gains a floor litter, a hung sign and a litter over a
  crate's side. Its build is accepted, and their nodes stand between the seals and the
  props. The litter on the crate stands on the lid, the higher of the two tops under it,
  and names the lid's mesh node. The prepared static level is the one without them, so
  the gate still prepares three times, and sec-111's preparation still admits the whole
  level GLB.
- Checks of the errors: a static object outside the interior returns `place`. So does a
  litter beside its prop's tops: on a top's edge it passes, and 0.1 mm beyond it blocks.
  A floor litter 0.16 m high is rejected with `static` alone.

### 5.7 `level-cli` (after 5.3)

- Scope: one page per finish path that a static object names and neither a slab nor an
  override does, between the slabs' pages and the hall's. Its swatch is a slab's: the
  static object's width, height and length as the thickness, with its colour, seed and
  wear, on the largest shown face of the path.
- Checks, through the `run` entry with an injected pipeline: the pages hold a static
  object's path with its size, colour, seed and wear. A tie keeps the first static
  object, and one a 0.1 mm step wider takes the path. A path that a slab also names
  keeps the slab's page, and each page's file is announced.

### 5.8 The litter (art team; after 5.2, 5.6, 5.7)

- Scope: the litter of the brief with its finishes, on the floor and on the tops.
- Checks: the validator accepts, with at most 200 pieces of litter in at most six new
  paths. Every prop reads as in the committed description. The reviewer reads each new
  path's page against the brief, and the plans, the sections and a custom view of each
  group: every litter lies on a floor or on its prop's top.

### 5.9 The owner's test (lead)

- Starts: the QA app, on both machines. A failure: the run log.
- Judges the art direction: the new floor lines around both assembly lines and at the
  yard's slots; whether the factory reads as a place in chaos; and the litter from
  arm's length, on the floor and on the tops.
- Judges the play space, as in the first pass: spawn areas, main lanes, gaps, and
  collision against a prop of each kind. The walk passes through every litter, and no
  static object stands in the sight of play.
- Judges the frame rate: at each spawn, and looking down on a littered line.

### 5.10 The lighting pass (art team; after 5.9)

- Scope: values of the level alone, one step at a time: first the subtraction of the
  environment and the key, then three fills, a subtle ambient and an emergency wall light
  at each place the owner marks. An emergency wall light is a lamp, an overhead static
  object with the glow `emergency`, and a point light before it. The `key` record leaves
  the level.
- Engineering: `level-format` raises the cap of point lights from 8 to 32, with its own
  review, and `level-pipeline`'s committed test counts the glows that static objects name.
- Checks: the validator accepts each step. The art team computes every level of a step by
  the model of the look and lighting document, beside the same level before the step. No
  prop, litter, finish recipe or floor line changes.

### 5.11 The owner's tests of the lighting (lead)

- Starts: the QA app, after each step. A failure: the run log.
- Judges the mood against the two mood references: the dark of the set of Alien, and
  LEDs that read like the wolf eyes of Jin-Roh.
- Judges the fills, which light silhouettes and never the entire interior, and the
  ambient's value.
- Judges the passways: the owner marks each place that is too dark to navigate, and an
  emergency wall light follows there.
- Judges the frame rate with 25 point lights. The look and lighting document states the
  lights as the owner passed them.

## Milestone 6: seals and overhead objects

The seals take their finishes, and more overhead objects enter the level through the
mechanism of milestone 5, beside its 17 lamps, so the engineering serves the seals alone.
The view needs no change: a painted box draws by the twins of 1.8.

### 6.1 The brief of the seals and the overhead objects (art team)

- Scope: a brief, beside the painter notes: the seals' roles; the list of overhead
  objects, at most 39, each with its place, its size and its reference; their finishes;
  and what "more interesting and detailed" means on each.
- Checks: the reviewer reads the brief against the references and the limits of a
  static object: nothing in it gives cover, blocks a path or stands in a sight line.

### 6.2 `level-format`

- Scope: the five paint keys on a seal.
- Checks: each paint key passes at its limits and fails beyond. A path the table lacks
  returns `finish`. A `glow` that `glows` lacks, a seal with a `metalness` beside a
  finish and a seal that lacks one without a finish are refused, each with its path. A
  seal without a finish decodes as before.

### 6.3 `level-glb` (after 6.2)

- Scope: a seal with a finish is a painted box in the static scene: its colour and three
  accessors, by the box's frame rule, and its path's material.
- Checks: every sentence of the finish format's GLB section on a painted seal is
  asserted on a written file, with its hand-computed frame at the four corners of each
  face. A seal without a finish keeps its own material. A seal, a static object and a
  slab of one path and glow share one material.

### 6.4 `level-pipeline` (after 6.3)

- Scope: the body of each painted seal's path, read with `recipeAt`, and the glows, for
  the static scene.
- Checks: the fixture gains a painted seal. sec-111's preparation admits its static
  scene, its build is accepted, and the gate still prepares three times.

### 6.5 `level-cli` (after 6.2)

- Scope: one page per finish path that a painted seal names and no slab, static object
  or override does. Its swatch is a slab's: the seal's longer plan extent as the width,
  its height, and the shorter extent as the thickness, on the largest side of the path.
- Checks: the pages hold a painted seal's path. A seal that is longer along Z gives that
  extent as its width, and one that is longer along X gives X.

### 6.6 Seals and overhead objects (art team; after 6.1, 6.4, 6.5)

- Scope: the seals' roles and the overhead objects of the brief, with their finishes: the
  end wall as cladding with a gate, and the door and the windows as shutters.
- Checks: the validator accepts. The reviewer reads the finish sheet, the plans, the
  sections and a custom view of each group against the brief: every overhead object
  touches its wall, its deck or its truss.

### 6.7 The owner's test (lead)

- Starts: the QA app, on both machines, also with `?leak=1`. A failure: the run log.
- Judges the seals: the end wall, the door and the windows against the crane shop's
  cladding, from arm's length too; with `?leak=1` on the address no loud magenta shows.
- Judges the overhead objects against the references: none stands in the sight of play.
- Judges the frame rate: at each spawn, and facing the end wall from the `+x+z` spawn.

## Milestone 7: legends and the hand-off

Lettering is built last.

### 7.1 `finish-paint`, glyphs

- Scope: in the unit `kinds`, `glyphs` and its stroke masks, with no new operation.
- Checks: each of the 20 glyphs draws its hand-written strokes. A `#` reads every digit
  from 0 to 9 at every place of 0, 100,000 and 999,999, also on a back end whose `mul`
  errs by three units in the last place. A legend's box is empty outside its glyphs.

### 7.2 `level-format`

- Scope: the keys of `glyphs`, in the unit `layer`; the cap of three legends and no legend
  in a hall finish, in the unit `finish`.
- Checks: three `glyphs` layers pass and four fail. An unknown glyph, a legend with
  `across` or `up` or on a face other than `outside`, and a hall finish with a legend
  are refused, each with its path.

### 7.3 `prop-kit`

- Scope: the number parameters of the finish format, and each slab's number.
- Checks: each parameter passes at its limits and fails beyond. A girder's number is its
  capacity times ten plus its number. A number left out, and that of a kind without one,
  is stable for one seed and differs between seeds. One prop's slabs carry one number.

### 7.4 Legends (art team; after 7.1 to 7.3)

- Scope: the plant's one numbering, at most three legends in a recipe: container codes,
  crane capacities and numbers, machine plates, panel and stack numbers, the bay signs'
  numbers and the gate's digit.
- Checks: the validator accepts. The reviewer reads each legend on the finish sheet:
  upright, unmirrored, on its plate and 4 to 1 against its ground. The root gates pass:
  `level-view`'s test builds every twin of the committed table to a program.

### 7.5 Hand-off and the owner's QA (lead)

- Starts: a setup, then the QA app, on both machines. A failure: the run log.
- Judges the legends: whether a code reads at walking distance and a girder's capacity
  from the floor.
- Judges the whole look against the ten reference images, object by object, and the
  play space as in milestone 5.
- Judges the frame rate: on the complete level, at each spawn, at cover and facing the
  end wall. The owner's acceptance of the look completes TASK-001.07.
