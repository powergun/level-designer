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

## Milestone 5: additions to the level

The level the owner passed is proved for layout and stays: no passed prop moves, turns or
leaves. This milestone only adds, and a prop only where the owner asked for it after an
earlier milestone's test.

### 5.1 The additions (art team)

- Scope: the props the owner asked for, each at the place the owner named. The art study
  offers cabinets beside the housings and the references' stock in the yard; neither
  enters without the owner's word. The floors gain the layout's lines: around both
  assembly lines and at the yard's slots.
- Checks: the validator accepts inside the budget of 800 slabs. The reviewer compares the
  description with the committed one: every passed prop keeps its `at` and its `yaw`,
  and none is gone. The reviewer reads every sheet, and each new floor line against the
  plan sheet beside the floor's swatch.

### 5.2 The owner's test (lead)

- Starts: the QA app, on both machines. A failure: the run log.
- Judges the art direction: each added prop where the owner asked for it, the yard
  against the crane shop, and the new floor lines around both assembly lines and at the
  yard's slots.
- Judges the play space, as in the first pass: spawn areas, main lanes, gaps, and
  collision against a prop of each kind.
- Judges the frame rate: at each spawn.

## Milestone 6: seals and static objects

The seals take their finishes, and the static objects enter the level: floor litter and
overhead objects. The view needs no change: a painted box draws by the twins of 1.8.

### 6.1 The brief of the seals and the static objects (art team)

- Scope: a brief, beside the painter notes: the seals' roles; the list of static objects
  of both classes, each with its place, its size and its reference; their finishes; and
  what "more interesting and detailed" means on each.
- Checks: the reviewer reads the brief against the references and the limits of a
  static object: nothing in it gives cover, blocks a path or stands in a sight line.

### 6.2 `level-format`

- Scope: `statics` with its cap and its six keys; the five paint keys on a seal and on a
  static object; ids unique among seals, static objects and props.
- Checks: 256 static objects pass and 257 fail. A side of 0.02 m passes and one step
  below fails. Each paint key passes at its limits and fails beyond. A path the table
  lacks returns `finish`. A `glow` that `glows` lacks, an id that a seal and a static
  object share, and a seal with a `metalness` beside a finish are refused, each with its
  path. A seal without a finish decodes as before.

### 6.3 `level-glb` (after 6.2)

- Scope: a static object's node in the level scene, between the seals and the props,
  with its box turned by its yaw; a painted box's colour and three accessors, by the
  box's frame rule; a seal with a finish draws with its path's material.
- Checks: every sentence of the finish format's GLB section on a box is asserted on a
  written file. On a yawed box each of the six faces carries its hand-computed frame at
  its four corners. A seal without a finish keeps its own material.

### 6.4 `level-rules` (after 6.2)

- Scope: `interior` for a static object, and `static`, on the hang height of `support`.
- Checks, on a box room, each limit at its value and 0.1 mm beyond: the interior's edge;
  a litter 0.15 m high; a litter 1.5 m long, also yawed; an overhead object at the hang
  height over the higher of two floors, also where it hangs over the lower. A litter
  with a corner on another floor level fails, and so does a lift that ends lower. A
  litter whose plan outline enters the ramp zone fails, with the zone's z extent.

### 6.5 `level-pipeline` (after 6.3, 6.4)

- Scope: after the preparation the pipeline stands each static object on the floor under
  its `at`, raised by its lift, with its seed, for the level scene; `place` judges `at`.
  It reads the body of each box's path with `recipeAt`, as it reads a slab's.
- Checks: the fixture gains a pallet and a hung sign. Its build is accepted, their nodes
  stand between the seals and the props, and its prepared static level is the one
  without them, so the gate still prepares three times. A static object outside the
  interior returns `place`.

### 6.6 `level-cli` (after 6.2)

- Scope: one swatch per finish path of a box, on the box's largest face.
- Checks: the swatches hold the path of a painted seal and of a static object.

### 6.7 Seals and static objects (art team; after 6.1, 6.5, 6.6)

- Scope: the seals' roles and the static objects of the brief, with their finishes: the
  end wall as cladding with a gate, the door and the windows as shutters, the litter and
  the overhead objects.
- Checks: the validator accepts. The reviewer reads the finish sheet, the plans, the
  sections and a custom view of each group against the brief: every overhead object
  touches its wall, its deck or its truss, and every litter lies on a floor.

### 6.8 The owner's test (lead)

- Starts: the QA app, on both machines, also with `?leak=1`. A failure: the run log.
- Judges the seals: the end wall, the door and the windows against the crane shop's
  cladding, from arm's length too; with `?leak=1` on the address no loud magenta shows.
- Judges the static objects against the references: the litter reads as lying on the
  floor when the walk passes through it, and no static object stands in the sight of play.
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
