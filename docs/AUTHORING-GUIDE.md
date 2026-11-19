# Authoring guide

This guide is for the art team that dresses the hall in `levels/dark-factory.json`. It
gives the hall in numbers, the rules of props and static objects in the validator's words,
the budgets, the finish table, the accepted limits and the authoring loop. The kinds command
prints every prop kind with its parameters, ranges and defaults; this guide repeats none.

## Frame and units

- Lengths are metres in the level frame: +Y up, the back wall at -Z, the sealed end at +Z.
- A prop's `at` is `[x, z]`, the plan point of its origin. The build drops the origin onto
  the floor under `at`.
- The origin is the centre of the plan outline for most kinds. A robot arm's origin is the
  centre of its pedestal and a jib crane's the centre of its mast; both reach along local
  +Z. A bridge crane's origin is the centre of the rectangle between its runways.
- A container's section is fixed, 2.44 m wide and 2.59 m high; only its length is typed.
- `yaw` is degrees about +Y. At 0 a prop's length runs along +Z; a positive yaw turns it
  toward +X.
- The validator's report opens with the live interior, floors, ramp zone and spawns. When
  this guide and the report differ, the report is right.

## The hall in numbers

Every number below was measured on the sealed hall, which props never change: the
shell, piers, corbels and overhead parts from the base stage's triangles at scale 3.89956,
and the obstacles and free floor from sec-111's prepared body world. Body-world numbers
are voxel edges and carry about 0.2 m.

### Shell, floors and spawns

- Interior box: x -16.6655 to 16.6655, y 0 to 18.7, z -89.8707 to 30.3188.
- Front floor: y 0 for z above -28.1399.
- Raised slab: y 0.3241 for z below -29.2332.
- Ramp zone: z -29.2332 to -28.1399, full width. Collision climbs it in four steps with
  tops at 0.28, 0.20, 0.12 and 0.04 m.
- Ceiling at y 18.7. The back wall stands at z -89.87; seals close the back slot, the
  four windows, the door on +X and the open end at +Z.
- Player spawn: (0, 0, -22).
- Minion spawns: `+x+z` (10.5, 0, 25.5), `-x+z` (-10.5, 0, 25.75), `+x-z` (12, 0.3241,
  -85.75) and `-x-z` (-10, 0.3241, -85.75).
- Main lanes on the static scene: `+x+z` 9 m, `-x+z` 8.4 m, `+x-z` 1.8 m and `-x-z`
  7.95 m. The `+x-z` lane keeps its 1.8 m; every other lane keeps 3 m.

### Piers and corbels

Six piers stand on each side wall, at the same z on both sides. Each is 2.67 m long:

- z -78.81 to -76.14 and z -38.55 to -35.88, in the window bays;
- z -58.68 to -56.01, z -18.42 to -15.74, z 1.72 to 4.39 and z 21.85 to 24.52.

The pier centres lie at z -77.48, -57.35, -37.21, -17.08, 3.05 and 23.19, a pitch of
20.13 m. The pier faces stand at x -14.85 on -X and x 15.12 on +X, from the floor to y
10.37; in the window bays they stop at y 6.22, under the window. A corbel crowns each pier:

- Underside: it slopes from the pier face at y 10.37 to the corbel's inner edge at y
  10.91, x -14.10 and 14.37. In the window bays the underside is flat at y 11.66, with the
  inner edge at x -14.14 and 14.41.
- Face: it leans outward from that inner edge to the top edge at y 13.6585, x -14.25 and
  14.52.
- Top: y 13.6585 on all twelve corbels, the height of the side walls' tops. The top is an
  open rim, no closed face. Between the top edge and the pier face it is a strip 0.60 m
  wide: x -14.85 to -14.25 and x 14.52 to 15.12.

Between the corbel top edges the hall is 28.76 m wide; between the lowest corbel edges,
28.46 m; between the pier faces, 29.97 m. Two more wall features:

- Above the walls, the sloped panels lean inward on each side from |x| 15.89 at y 12.63
  to |x| 13.86 at y 18.20. They pass over the pier faces above y 14.7 and over the runway
  line of a corbel crane above y 15.6. In three recesses per side, at z -63.75 to -61.52,
  -32.40 to -30.16 and -1.04 to 1.20, they stand 1.25 m further out, from |x| 17.14 to
  15.11.
- Small pilasters stand on both walls, at x -15.86 and 16.14, from the floor to y 10.37,
  at z -90.48 to -89.74, -70.34 to -69.61, -50.21 to -49.47, -30.08 to -29.34, -9.95 to
  -9.21 and 10.19 to 10.92.

### Overhead

- Trusses: x -13.24 to 14.54, y 16.28 to 17.94. Their lowest members, at y 16.28, sit at
  four cross frames inside the hall, near z -69.9, -44.8, -19.7 and 5.4; every other truss
  member is higher. A hanging part whose top stays under 16.28 clears every truss.
- Ceiling fixtures: lamps at y 16.92 to 17.05, in three columns, x -8.76, 0.53 and 9.81,
  and nine rows, z -88.38, -68.36, -61.21, -41.19, -34.04, -14.02, -6.87, 13.15 and
  20.30. Each column and each row is about 0.44 m wide.
- Back deck: full width, y 6.08 to 6.34, z -84.98 to -66.58.
- Front deck: full width, y 6.08 to 6.34, z -47.72 to -29.32.
- Upper deck: x 6.08 to 16.67, y 11.89 to 12.15, z -47.72 to -29.32.
- Under the two lower decks the raised slab has 5.76 m of headroom.

Base parts that rise above the corbel tops, inside the interior, give the extent of their
parts above y 13.66. A runway, a bridge or a trolley in these extents enters base geometry:

- three pipe columns on -X, x -14.14 to -12.87, through the ceiling, at z 4.67 to 5.94, z
  -20.25 to -18.98 and z -12.58 to -11.31;
- two tall tubes on -X, x -15.38 to -14.01, up to y 17.78, at z 19.21 to 21.48 and z
  -65.18 to -62.94, and a third at the ramp, x 6.11 to 8.36, z -29.62 to -28.39;
- two tank tops on -X, x -13.53 to -10.26, up to y 14.98, at z -10.58 to -9.45 and z
  -57.60 to -56.47;
- a pipe at x -1.40 to 0.19, up to y 15.69, at z -67.99 to -66.26;
- the back tower, x 2.82 to 8.80, up to y 15.87, at z -89.53 to -84.28, with a thin rod
  at about (5.4, -85.1) through the ceiling;
- two stubs: x -14.45 to -14.37 at z -50.29 to -50.20, up to y 14.18, and x 13.22 to
  13.30 at z -14.56 to -14.48, up to y 14.36.

### Static standing obstacles

These are the body world's boxes that start under 2.17 m; `gap` judges every prop against
them. Each extent below is a box edge of the body world. The two side walls are not
symmetric, so each side is given by stretch.

On the -X side of the raised slab, z -89.87 to -29.28:

- The wall's standing edge lies at x -16.07, with pilaster steps to -15.77 at z -89.87 to
  -89.67, -70.37 to -69.57 and -30.18 to -29.28.
- The piers stand in to x -14.77 in the window bays, z -78.97 to -75.97 and -38.78 to
  -35.78, and to x -14.67 at z -58.87 to -55.87.
- A tube stands in to x -13.87 at z -65.57 to -62.67.
- A tank stands in to x -9.78 at z -58.37 to -55.67, against the pier.
- A tube stands in to x -13.37 in two parts, z -51.37 to -49.27 and z -47.57 to -45.87,
  with a free bay of 1.7 m between them.
- Deck posts stand at x -14.17 to -13.37, at z -83.57 to -82.77, -75.77 to -74.77 and
  -67.77 to -67.07.

On the -X side of the ramp and the front floor:

- A row of tubes stands in to x -14.67 from the ramp, z -28.98, to z -2.58.
- A pipe column stands in to x -12.77 at z -20.28 to -18.88.
- A pipe column and a tank stand in to x -9.78 at z -12.68 to -8.68.
- From z -2.48 the wall's standing edge lies at x -16.07, and from z 24.42 at -16.17.
- The piers stand in to x -14.67 at z 1.42 to 4.52 and 21.92 to 24.82.
- A low panel and a pilaster step the edge to x -15.87 at z 6.62 to 11.02.
- A pipe column stands alone at x -14.17 to -12.77, z 4.62 to 6.02.
- A tube stands in to x -13.87 at z 19.12 to 21.92.

On the +X side:

- The wall's standing edge lies at x 16.17 from the back wall to z 24.82, then at 16.37.
- Pilaster steps reach x 16.07 at z -89.87 to -89.57, -70.57 to -69.47, -50.37 to -49.27,
  -30.28 to -29.28 and 10.02 to 11.12.
- On the raised slab the piers stand in to x 15.07 in the window bays, z -78.97 to -75.97
  and -38.78 to -35.78, and to 14.97 at z -58.87 to -55.87.
- On the front floor the piers stand in to x 14.97 at z -18.58 to -14.68, 1.42 to 4.42
  and 21.62 to 24.62.
- A tube stands in to x 12.07 at z -17.18 to -14.38, on the front floor.
- At the door, a strip stands in to x 15.97 at z -14.68 to -7.48.

The +X side of the raised slab carries nothing but its wall and piers, so the free strip
east of the slab islands reaches the wall: x 13.47 to 16.17 beside island A and x 11.88 to
16.17 beside island B, narrowed to about 15.0 at the piers.

On the hall floor:

- Slab island A, under the back deck: x -3.19 to 13.47, z -83.57 to -64.97.
- Slab island B, under the front deck: x -2.69 to 11.88, z -47.17 to -34.38.
- Both islands are groups of boxes, not rectangles, and their west edges are ragged. Island
  B's west edge stands at x -2.00, -1.50 and -1.30 along most of its length, and island A's
  at x -2.30 and -2.40, with nubs out to the stated -2.69 and -3.19. A prop laid along an
  island's edge therefore earns `gap` findings; stand it 1.5 m off the outermost corner.
- The back tower: x 3.69 to 7.88, z -89.87 to -85.07.
- Posts at the ramp top, z -30.58 to -29.88: x -2.00 to -1.20, x 3.79 to 4.49 and x 9.68
  to 10.28.
- Pipe stacks on the ramp: x 5.79 to 8.58, z -29.58 to -28.18, and x 10.58 to 12.27, z
  -29.78 to -28.68.
- At the sealed end, a standing box spans the hall from z 30.02.

### Free floor

The largest free rectangles, measured on a 0.1 m grid, largest first and without overlap.
A rectangle's edge meets an obstacle somewhere along it, not everywhere: the east edge of
the second front-floor rectangle is the pier line, and between the piers the wall stands
1.2 m further out. A prop near an edge either touches the obstacle, keeps under 0.7 m from
it, or stands 1.5 m off. On the front floor:

- x -9.77 to 12.03, z -28.07 to 29.93 (21.8 by 58.0 m);
- x 12.03 to 14.93, z -14.37 to 29.93 (2.9 by 44.3 m);
- x -12.77 to -9.77, z -8.67 to 29.93 (3.0 by 38.6 m);
- x -12.67 to -9.77, z -28.07 to -11.47 (2.9 by 16.6 m).

On the raised slab:

- x -9.77 to 14.93, z -64.97 to -47.27 (24.7 by 17.7 m), the cross lane between the islands;
- x -13.37 to -3.27, z -89.87 to -64.97 (10.1 by 24.9 m), the west lane;
- x -14.77 to -2.07, z -45.87 to -29.27 (12.7 by 16.6 m);
- x -2.07 to 16.13, z -34.37 to -30.67 (18.2 by 3.7 m);
- x 8.93 to 16.03, z -89.87 to -81.37 (7.1 by 8.5 m);
- x -3.27 to 3.63, z -89.87 to -83.67 (6.9 by 6.2 m).

## Heights over the two floors

Every height parameter counts from the floor under `at`: a light strip's `height`, a bridge
crane's `railHeight` and a jib crane's `height`. The same world height therefore takes a
different parameter on each floor. The corbel tops stand at y 13.6585 in the world:

- over the front floor, a bridge crane rests its runways on the corbels with `railHeight`
  13.66, 1.5 mm above the tops;
- over the raised slab, the same corbels take `railHeight` 13.34, because the floor under
  `at` stands 0.3241 m higher; 13.3344 lands exactly on the tops.

Below the corbel tops a runway sinks into the open corbel, above them it floats. The
validator never compares a prop with the base stage, so it accepts both. A crane's runways
are level, so a crane meets every corbel of its travel at the same height, also across the
ramp; the floor under its `at` alone decides the parameter.

### A bridge crane on the corbels

Put the crane's `at` on x 0.1355 and give it a `span` of 29.37: `span` is the distance
between the runway beams' centre lines, and these lines then run along the middle of the
corbel top strips, x -14.55 and 14.82. A runway rests on corbels when both its ends lie
inside a pier's z range. Its `travel` then spans one bay, 17.46 to 22.80 m, two bays,
37.59 to 42.93 m, or three bays, 57.72 to 60 m. A crane has 16 slabs. Above a span of
20.3 m each girder web splits in two, 18 slabs, and above a travel of 40 m each runway
splits too, 20 or 22 slabs.

The base tubes on -X block two bays: the tube at z -65.18 to -62.94 stands in the bay
between the piers at -77.48 and -57.35, and the tube at z 19.21 to 21.48 in the bay between
3.05 and 23.19. The three bays from the pier at -57.35 to the pier at 3.05 carry a crane.

In the first of these bays, two thin rods stand at x -14.45 to -14.37, z -50.29 to -50.20,
up to y 14.18. At `at` x 0.1355 the -X runway's flange reaches x -14.40 and cuts into them
by about 0.04 m. A crane through that bay takes `at` x 0.0355 instead. Both flanges still
lie on the corbel top strips: the -X flange 0.05 m inside the strip's outer edge and the +X
flange 0.05 m inside its inner edge, each about 0.25 m from the other edge. The -X flange
then clears the rods by 0.05 m. The validator accepts `at` [0.0355, -47.28], `span`
29.37, `travel` 20.13, `railHeight` 13.34.

A worked example for the third bay, accepted by the validator: `at` [0.1355, -7.015], `span`
29.37, `travel` 20.13, `railHeight` 13.66. Its runways end on the pier centres at z -17.08
and 3.05.

The bridge spans the hall between the runway webs. Its end trucks run 3 m along the
runways, centred on the bridge's place. Its girder webs are 1.25 m high and stand 0.55 to
1.85 m above `railHeight`: on the corbels, from y 14.21 to 15.51. The trolley tops out
2.35 m above `railHeight`, at y 16.01, 0.27 m under the trusses' lowest members. Choose `bridgeAt` so that this 3 m stays clear
of the z extents of the pipe columns, the tank tops, the tube at the ramp, the pipe at z
-67.99 and the +X stub at z -14.56. The hook hangs `hookDrop` under the runways; over the
upper deck, keep it above y 12.15.

## What the clearance rules measure

`gap`, `spawn` and `lane` measure a prop's standing footprint, not its typed outline:

- A standing slab is a slab of a standing prop that starts less than 2.17 m above the floor
  under `at`. Hanging parts never count: runways, booms, strips and hook blocks.
- A tall hollow prop counts by its walls. A roof that starts at 2.17 m or higher is no
  standing slab, so the footprint is the ring of walls. That holds for every container, for
  a metal enclosure from a height of 2.22 m and for a concrete one from 2.27 m.
- A prop inside a tall hollow prop is judged against its walls.
- A tall enclosure without a glow stands narrower than its `width` by the eave, 0.03 m, on
  each long side, so its footprint is 0.06 m narrower than `width`. Two of them typed 0.68
  m apart measure 0.74 m and fail `gap`. A glow's bands bring the footprint back to `width`.

The open and the overhead kinds:

- A robot arm stands on a strip 0.4 m wide, as wide as its pedestal. Every link starts
  under 2.17 m, so the strip runs from 0.4 m behind `at` to the head's tip, 2.12 m ahead at
  the default pose. The head can drop to 0.16 m above the floor, so an arm that reaches
  over a conveyor can enter its deck and fail `overlap`.
- A jib crane stands on its plinth alone. A bridge crane has no standing footprint.

A lane is measured on 0.1 m cells from the interior's lowest corner. An opening of 3.0 m
keeps 3 m; one of 2.9 m reads 2.8 or 3.0 m by where it meets the grid. Leave 3.0 m or more.

The [prop-kit knowledge](../packages/prop-kit/docs/KNOWLEDGE.md) holds every kind's
secondary dimensions and slab counts.

## Placement rules

A finding names its rule, its subject and a message; every finding rejects the level. Each
limit passes at its typed value. The messages below are the validator's own.

### Standing and hanging

- `support`: a prop stands when its lowest point lies within 0.01 m of the floor under
  `at`, and hangs when its lowest point is 2.17 m or more above the highest floor under its
  slabs. Otherwise: "prop <id> neither stands nor hangs: its lowest point is <h> m above
  the floor; stand it on the floor or hang it at 2.17 m or higher".
- `floor`: a standing prop keeps all its standing slabs on one floor level: "prop <id>
  spans the floor levels <a> and <b>; keep a standing prop on one level".
- `ramp`: a standing footprint stays off the ramp zone: "prop <id> stands on the ramp, z
  <z0> to <z1>". A hanging prop may cross the ramp and the slab edge.
- `low-top`: every standing slab reaches 0.5 m or higher, because the player climbs tops up
  to 0.30 m: "prop <id> slab <k> tops out <h> m above the floor; a standing slab reaches
  0.5 m or higher".

### Inside the hall and apart

- `interior`: every slab stays inside the interior box: "prop <id> slab <k> leaves the
  interior by <d> m at (<x>, <y>, <z>)".
- `overlap`: props may touch, up to 1 mm, but never enter each other: "props <a> and <b>
  intersect: slab <i> enters slab <j> by <d> m". No prop stands on another.
- `place`, a build error: the origin must lie inside the interior: "props[<i>].at: (<x>,
  <z>) lies outside the interior".

### Clearance

- `gap`: two standing footprints, or a footprint and a static obstacle, stand under 0.7 m
  apart or at least 1.5 m apart; touching is allowed. The player enters a gap of 0.76 m,
  and the minions' navigation needs 1.5 m. Message: "props <a> and <b> stand <d> m apart;
  keep a gap under 0.7 m or at least 1.5 m", or "prop <a> stands <d> m from the static
  obstacle at (<x>, <z>); ...".
- `gap` judges only a gap where a player fits: a gap filled by a third prop or a wall
  passes, so crates in a row and chained conveyors pass.
- `spawn`: every standing footprint keeps 6 m from every spawn: "prop <id> stands <d> m
  from the <name> spawn; keep 6 m".
- `lane`: each minion spawn keeps a route to the player spawn 3 m wide, or 1.8 m for
  `+x-z`: "the main lane from the <name> minion spawn narrows to <w> m near (<x>, <z>); it
  needs <limit> m".

### The owner's checks and the proof

- `triangles`: "the level has <n> triangles; the cap is 300,000".
- `light-inside` and `light-floor`: a point light stays inside the interior and above the
  floor under it.
- `material` and `texture`: every primitive has a material, and the first pass adds no
  texture. The props' slabs satisfy both.
- `destructible`: destruction lib admits, rails and blasts every slab: "prop <id> slab
  <k>: <step> failed". `proxies` builds the debris proxies of all slabs together.

A blocked build prints its build errors instead of a report: `shape` and `id` for the
description's form, the finish table and the static objects included, `kind` and `param`
for a prop's kind and parameters, `finish` for a path the table lacks, `base` for a base
name, `place` for an origin outside the interior, and `slab` for a slab beyond the caps.
Each error starts with the path of the value to change, such as `props[3].params.length`.

## Static objects

A static object is one box of 12 triangles that is only drawn: litter, or an overhead
object. Nothing collides with it, so the clearance rules, `overlap`, `support` and
`low-top` pass it by, and flat stock too low for a prop enters as litter. The description's
optional `statics` lists at most 256. A record takes `id`, `at`, `size`, `color` and
`finish`, and any of `yaw`, `lift`, `on`, `number`, `wear`, `seed` and `glow`; "Static
objects" in the [level-format knowledge](../packages/level-format/docs/KNOWLEDGE.md) gives
each range and default. `at` is the centre's plan point, `size` is `[width, height,
length]` with sides of 0.02 m or more, and `yaw` turns the length as a prop's. The keys
name the class:

- floor litter, with neither `on` nor a lift: the build lays it on the floor under `at`;
- litter on a prop, with `on`, the prop's id, and no `lift`: on the highest level top of
  that prop under `at`. A pitched slab has no top, and only `at` is tested, so a piece may
  overhang its top;
- an overhead object, with a positive `lift`, the height of its underside over the floor.

The validator's own words for a static object:

- `shape`, a build error: an `on` that names no prop, or a `lift` beside an `on`.
- `place`, a build error: "statics[<i>].at: (<x>, <z>) lies outside the interior", and for
  litter on a prop "statics[<i>].at: (<x>, <z>) lies over no top of prop <id>".
- `interior`: "static <id> leaves the interior by <d> m at (<x>, <y>, <z>)".
- `static`, litter on the floor or on a prop: "static <id> is <h> m high; litter is 0.15 m
  high or lower", and for its longer plan side "static <id> measures <l> m in plan; litter
  measures 1.5 m or less".
- `static`, floor litter: "static <id> spans the floor levels <a> and <b>; keep floor
  litter on one level" and "static <id> stands on the ramp, z <z0> to <z1>".
- `static`, an overhead object: "static <id> starts <h> m above the hall's highest floor;
  an overhead object starts 2.17 m or higher", counted from the raised slab.

No rule limits the height of the top that a litter lies on: the art team's litter brief
holds that limit, 1.3 m above the floor, and the level's 200 pieces. The QA app shows no
damage, so a litter stays on its prop there.

## Budgets and caps

- First-pass budget: 800 slabs in 200 props. The report prints both counts beside the
  budget and never rejects for it; the art team holds itself to it. The committed level
  holds 616 slabs in 127 props, and 217 static objects: 200 litter pieces and 17 lamps.
- Caps: 1,024 slabs, 300,000 triangles and 32 point lights. Above 1,024 slabs the build
  is blocked, and above 300,000 triangles the level is rejected. The report prints the
  point lights' count beside their cap.
- The description admits at most 512 props, 256 static objects, 16 seals and eight glows.
- The stage and the seals hold 113,853 triangles, so the props and the static objects may
  add 186,147. The level's 217 static objects add 2,604, and the report prints the level's
  count beside the cap: 136,493.
- A slab's triangle count grows with its face: 12 for a 1 by 1 m slab, 20 for 2 by 1.2 m,
  44 for 4 by 2.4 m and 92 for 7 by 3.2 m. 800 crate slabs add 9,600 triangles; two bridge
  cranes of span 29.37 and travel 30 add 3,104.
- Props and static objects add no body box: the hall uses 227 of sec-111's 512 either way.

## Finishes

The description's `finishes` is the finish table: each finish, such as `housing`, holds
its `cut`, its `light` and its `roles`, and each role is one recipe of a `body`, `layers`
and an optional `extends`. A static object states its finish path, `finish/role`; the kit
chooses a slab's by its kind and part, as "Finish paths" in the
[prop-kit knowledge](../packages/prop-kit/docs/KNOWLEDGE.md) lists. "The finish table" in
the [level-format knowledge](../packages/level-format/docs/KNOWLEDGE.md) gives every key,
length, effect and cap. The art team's notes, the painter recipes and the briefs, hold the
recipes and the value ladder.

- A role's `body` holds its path's metalness and roughness, and its `lit` the emission:
  every slab of a glowing prop names the glow, and only a lit body shines in it.
- The committed table paints every finish with layers: `housing`, `corrugated`, `beam`,
  `bed`, `casting`, `cast-concrete`, `timber`, `steel-stock`, `block`, the five roles of
  `litter` and the joints of `luminaire/strip`. Six paths stay plain bodies: `housing/top`,
  `corrugated/roof`, `beam/flange`, `beam/tie`, `cast-concrete/top` and `luminaire/band`.
  The bodies of `steel-stock` and `luminaire` keep metalness 0.55, and every other body
  stands at metalness 0. Both `luminaire` paths are lit.
- Every kind takes `wear` and `seed`; the kinds command prints their ranges and defaults.
  A wearing layer follows `wear`, and `seed` varies a pattern between props.
- Three parameters choose a role: a container's `door`, `+z` or `-z`, puts
  `corrugated/door` on that end, a crate's `stencil` puts `timber/crate-stencil` on its
  +X and -X sides, and a partition's `finish` names any path of the table. Without it a
  partition takes its material's path; the level's barriers name `cast-concrete/barrier`
  and its stacks with posts `steel-stock/stack-posts`.
- Every face of a slab takes the slab's tint, the inside face included.

The snapshot command draws one page per finish path in use, `<finish>.<role>.png` in
`.tmp/snapshots/finish/`. It empties that directory first, so it holds the pages of this
level alone. A slab's page shows its path on the path's largest outside face of the level:
that face between its two end edges, the inside face and the top and bottom edges, at 5 mm
per pixel, or 20 mm when the face is longer than 8 m, and the outside face again at 40 mm,
what survives 20 m.

A path that only static objects name gets a box page, after the slabs' pages: the box as
a slab of its width, height and length as the thickness, on the static object with the
largest shown face, its width times the larger of its height and its length. The `top` and
`bottom` tiles are the box's upper and lower faces, +X to the right and +Z on top, so
`top` is the view from above flipped top to bottom. `outside` is the side along the width;
`inside`, `end-` and `end+` stand for no face of a box. No tile shows the sides along the
length: type the side that carries a mark as the width, and turn the box by its `yaw`.

Under each face stand a ruler in metres and the face's mean albedo as linear luminance,
such as `outside 5mm 0.142`. A page shows albedo only, in the slab's or the box's tint, and
draws a `"glow"` mark in the finish's `light`. The author holds each mean against the value
ladder of the art team's notes. The [look and lighting](LOOK-AND-LIGHTING.md) document
turns it into what a top, a side and an underside show, and gives the mood, the stage's
materials, the hall's light, the bloom threshold, the tuning handles, the reference levels
and how to add an emergency wall light. The QA app's next start shows the finish lit.

### Hall finishes

A base override in `base.materials` takes `finish`, a path of the table, and that role is
a hall finish: its layers draw over the stage material's own look, on every surface of
that material. A hall finish states no `body`, takes no `lit` effect and draws on `top`,
`bottom` or `outside` only, also through `extends`. The validator reports a fault at the
offending value, with the hall path in the message. Its coordinates are the level's:

- on `top` and `bottom`, the plan point `[x, z]`;
- on `outside`, the level's Z on a wall that faces along X and the level's X elsewhere,
  then the level's Y.

A layer has no height of its own. The class comes per pixel from the surface's own normal,
so an `on: "top"` layer draws on every up-facing surface of its material inside its
rectangle, also on the band of a pipe or a tank that faces up. A `clip` keeps a mark off a
known part.

The committed table holds the finish `hall`. `hall/front` paints `Material.001`,
`hall/slab` paints `Material.003` and `hall/wall` paints `Material.002`. Both floors extend
`hall/floor`, joints with tone steps between the bays. The front floor adds two aisle
lines, a band at the ramp's foot and a box around each assembly line. The slab adds a line
on its edge and the side lines of the yard's four slots, and the side walls draw a darker
base. The art team's hall brief holds the recipes, their places and their values.

The snapshot command draws one page per hall finish that an override names, after the
other pages, with one tile per class its layers draw on, over a plain grey ground: a wall
or a ceiling as a window of 16 by 8 m from the interior's low corner, at 20 mm; a floor
whole at the plan sheet's 50 mm and orientation, split into two halves side by side; and
rulers in level coordinates under and beside each tile. A floor line 0.1 m wide shows as
2 px, and a joint only as a tone. Over the grey ground the mean tells the marks' share,
not the surface's value; the QA app shows the marks on the stage.

## Accepted limits

The project knowledge lists the limits of the first pass that the owner accepts, and what
the kit cannot express.

`gap` has limits of its own. It does not judge a pair nearer than 0.7 m, so two props that
touch at an acute angle leave a wedge it never sees. It stays strict where nothing fills a
gap: a notch 0.4 m deep beside a smaller crate fails, and so does a corridor mouth only
0.36 m deep. A pocket against a wall of several body boxes gets one finding per box.

## The loop

The author edits the git-ignored draft beside the committed file and replaces the
committed file only when the validator accepts the draft:

```sh
just kinds                                                   # once: kinds and parameters
just validate --description levels/dark-factory.draft.json
just snapshot --description levels/dark-factory.draft.json
just snapshot --description levels/dark-factory.draft.json --eye=9,12.5,-4 --look-at=15,13.66,3
just fmt                                                     # after the copy over the committed file
```

- Start the draft as a copy of `levels/dark-factory.json`.
- Edit the draft -> validate -> read the findings -> snapshot -> read every sheet and the
  changed paths' pages -> edit again.
- The sheets land in `.tmp/snapshots/`: `plan.png` (the floor plan below 5.9 m and the
  overhead plan below 16.2 m, with a 10 m grid, the spawns with their 6 m circles and each
  prop's number), `section.png` (two long elevations and six cross sections, with lines at
  each floor and at 2.17 m), `view.png` (eight perspective views: from the spawns at
  eye height and two overviews from 12 m up) and `custom.png`; the finish pages in
  `.tmp/snapshots/finish/`.
- A point that starts with a minus sign needs the `=` form, as in `--eye=-5,1.7,-20`.
- Exit status 0 means accepted or done, 2 a blocked build or a rejected level, 3 a usage or
  file error, and 1 a defect or a broken sibling install.
- One validate takes about 4 s, also with 800 crate slabs. A snapshot of the committed
  level, with 45 finish pages, takes about 40 s.
- When the validator accepts the draft, copy it over the committed file and run the
  formatter; `just lint` checks the committed file's layout.
