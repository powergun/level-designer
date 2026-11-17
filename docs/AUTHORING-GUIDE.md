# Authoring guide

This guide is for the art team that dresses the hall in `levels/dark-factory.json`. It
gives the hall in numbers, the placement rules in the words of the validator, the budgets,
the accepted limits and the authoring loop. The kinds command prints every prop kind with
its parameters, ranges and defaults; this guide repeats none of them.

## Frame and units

- Lengths are metres in the level frame: +Y up, the back wall at -Z, the sealed end at +Z.
- A prop's `at` is `[x, z]`, the plan point of its origin. The build drops the origin onto
  the floor under `at`.
- The origin is the centre of the plan outline for most kinds. A robot arm's origin is the
  centre of its pedestal and a jib crane's the centre of its mast; both reach along local
  +Z. A bridge crane's origin is the centre of the rectangle between its runways.
- A container has a fixed section, 2.44 m wide and 2.59 m high; only its length is a
  parameter.
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
16.17 beside island B, narrowed to about 15.0 at the piers. The -X side carries a tank, two
tubes and three deck posts.

On the hall floor:

- Slab island A, under the back deck: x -3.19 to 13.47, z -83.57 to -64.97.
- Slab island B, under the front deck: x -2.69 to 11.88, z -47.17 to -34.38.
- Both islands are groups of boxes, not rectangles, and their west edges are ragged. Island
  B's west edge stands at x -2.00, -1.50 and -1.30 along most of its length, and island A's
  at x -2.30 and -2.40, with nubs out to the stated -2.69 and -3.19. A prop laid along an
  island's edge therefore earns `gap` findings; stand it 1.5 m off the outermost corner.
- The back tower: x 3.69 to 7.88, z -89.87 to -85.07.
- Deck posts on -X: x -14.17 to -13.37 at z -83.57 to -82.77, z -75.77 to -74.77 and z
  -67.77 to -67.07.
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
37.59 to 42.93 m, or three bays, 57.72 to 60 m. Above a travel of 40 m each runway splits
in two, 20 slabs instead of 16.

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
runways, centred on the bridge's place, and its girders stand 0.55 to 1.2 m above
`railHeight`: on the corbels, from y 14.21 to 14.86. The trolley tops out 1.7 m above
`railHeight`, at y 15.36, under the trusses. Choose `bridgeAt` so that this 3 m stays clear
of the z extents of the pipe columns, the tank tops, the tube at the ramp, the pipe at z
-67.99 and the +X stub at z -14.56. The hook hangs `hookDrop` under the runways; over the
upper deck, keep it above y 12.15.

## What the clearance rules measure

`gap`, `spawn` and `lane` measure a prop's standing footprint, not the outline its
parameters state:

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
keeps 3 m; one of 2.9 m reads 2.8 or 3.0 m, depending on where it meets the grid. Leave
3.0 m or more.

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
description's form, `kind` and `param` for a prop's kind and parameters, `base` for a base
name, `place` for an origin outside the interior, and `slab` for a slab beyond the caps.
Each error starts with the path of the value to change, such as `props[3].params.length`.

## Budgets and caps

- First-pass budget: 800 slabs in 200 props. The report prints both counts beside the
  budget and never rejects for it; the art team holds itself to it.
- Caps: 1,024 slabs, 300,000 triangles and eight point lights. Above 1,024 slabs the build
  is blocked; above 300,000 triangles the level is rejected. The lighting section admits at
  most eight point lights.
- The description admits at most 512 props, 16 seals and eight glows.
- The stage and the seals hold 113,853 triangles, so the props may add 186,147. The report
  prints the level's count beside the cap.
- A slab's triangle count grows with its face: 12 for a 1 by 1 m slab, 20 for 2 by 1.2 m,
  44 for 4 by 2.4 m and 92 for 7 by 3.2 m. 800 crate slabs add 9,600 triangles; two bridge
  cranes of span 29.37 and travel 30 add 3,056.
- Props add no body box. The hall uses 227 of sec-111's 512 with or without props.
- The report prints the level's point lights beside the cap of eight.

## Look and lighting

A sheet shows layout, scale and silhouette, never mood. No agent judges mood, shadow, haze
or glow; the owner does, in the browser. The figures below come from the renderer's
source and from measurements of the stage and of sec-111's models, not from a browser.

### The stage's materials

The base overrides in `base.materials` take the stage's material names. An override tints
or retunes every surface that uses the name. Each material below gives its surfaces and
`a`, the mean linear luminance of its base colour texture on those surfaces:

- `Material`: the lamps of the ceiling fixtures, untextured at 0.8, the stage's only
  emissive material.
- `Material.001`: the front floor and the sloped upper panels, 0.21.
- `Material.002`: the side walls with their piers and corbels, the door and window frames,
  the deck columns and the back tower, 0.29.
- `Material.003`: the raised slab with the ramp, the back wall, the partitions under the
  decks, most pipes and tanks, and parts of the fixtures, 0.049.
- `Material.004`: the low wall panels on +X and one on -X, 0.22.
- `Material.005`: the ceiling, the three tall tubes and the -X pipe run, 0.054.
- `Material.006`: the trusses, the three pipe columns and parts of the fixtures, 0.10.
- `Material.007`: the three decks, 0.22.
- `Material.008`, `Material.009` and `Material.010`: the crate stacks on the slab
  islands, 0.17, 0.19 and 0.09.

An override tints the texture but never replaces it. A surface returns diffuse light by
its `a` times its tint times (1 - metalness). A tint therefore serves the pale materials:
it lowers them toward the dark ones, so that the lights can rise for the dark ones. On a
dark material it turns near black into black. A floor tint moves a floor about half as
much as its number says: the other half is the environment's sheen, which the roughness
0.55 of `Material.001` and `Material.003` sets, not the texture or the tint. The minions
are about half metal: a regular's surface averages an albedo of 0.23 and a mini-boss's
0.34.

### How the hall is lit

- The environment is the hall's light. It lights a surface by its albedo and its facing,
  tops most and undersides least: a side gets 0.55 and an underside 0.22 of what a top
  gets. It adds a mirror sheen that is half of what a floor shows, and casts no shadow.
- The key stays vertical: the roof shadows a tilted key. A layer of panels in the truss
  mesh, at y 17.08 and facing down, shadows it too. With the decks, the cranes and the
  props above the floor, the key reaches about a tenth of it, as thin lines 0.5 to 1 m
  wide along x -13.5, -4.3, 5.3 and 16 and three cross bands near z 8, -17 and -66.
  Without the truss mesh it would reach half. Its lines are the only light of the hall
  that casts a shadow.

The glows and the points:

- A glow makes a slab emissive, and an emissive slab lights nothing. A strip that must
  light its surroundings needs a point light near it, above its top or a metre under it,
  never level with its underside, where the point skims it.
- A point casts no shadow. Its highlight in a glossy finish is far brighter than its
  diffuse light, most of all where its light skims a face.
- The distance a point needs from any surface grows with its candela: a dark glossy face
  blooms by its highlight. At the back wall, the stage's darkest material, a point of 45
  cd 2.27 m off the wall stays under the bloom threshold; one of 100 cd 1.57 m off it
  makes a patch that blooms.
- A point under a deck lights the deck far more than the slab. Under the front deck, 1.7 m
  below the deck and 4.1 m above the slab, it lights the deck 26 times as much, 11 with
  the deck's tint.
- The lamps are bars 7.3 m long along z between each pair of fixture rows, the stage's
  palest surface, so a point near a bar blooms it. `Material` keeps its emissive at 0.25.

### The bloom threshold

- The bloom takes every pixel whose luminance passes 0.75, in full from 1.10. Luminance is
  0.21 R + 0.72 G + 0.07 B of the lit colour plus the emissive, taken before exposure and
  before the haze. Distance does not save a patch: a far surface blooms like a near one.
- A glow blooms when its colour's luminance times its strength passes 0.75. With their
  colours, `strip` blooms by itself from strength 0.98, `gate` from 0.83, `line` from
  1.14, `alert` from 1.30 and `eye` from 1.90.
- Under the threshold, the halo, the haze glow and the lens dirt around a glow vanish
  together. `haze.glow` only scales a halo that exists. `haze.density` also fades every
  surface with distance: at 0.012, by 30 % at 30 m and 55 % at 67 m.
- Reflected light counts too: a point's highlight on a glossy face can pass the threshold
  where the glow does not.

### The tuning handles

- `lighting.environment.intensity` moves the whole hall: floors, walls, prop tops and
  sides.
- `lighting.key.intensity` moves only the key's lines and bands. At 0 they are gone.
- Each glow's `strength` sets its tubes and nothing else.
- `finishes.metal.roughness` trades the machines' highlights against glare. With the
  committed points, at 0.6 a fifth of the standing places see a highlight of 0.75 or more;
  at 0.65, about one in a hundred; from 0.7, none.
- A point's candela and its height set its pool and its highlights; a shorter range keeps
  it off far strips and props, which it would only skim.
- The minions glint under any point by their own metal: a regular's joints are near
  mirrors, and a mini-boss's panels pass the threshold under a point. No value of the
  level ends these glints short of removing the points. A mini-boss's shoulder in a key
  line passes the threshold from a key intensity of about 1.

Reference levels: at environment intensity 7, away from the points, the front floor shows
luminance 0.054 and the slab 0.041. A strip at strength 0.4 shows 0.31, 5.7 to 1 above the
floor, and a pool shows 1.5 times the floor beside it.

## Accepted limits

The owner accepts these limits of the first pass:

- SMG rounds do nothing on a slab's thin edges, a shot-through prop never collapses,
  settled debris does not rest on slabs, and a destroyed object keeps its shadow.
- A damaged glowing slab loses its glow in the game, while a point light beside it stays.
- A hollow prop wider than about 1 m can become a hiding spot once destroyed, because its
  footprint stays a navigation obstacle.
- An arm's links hinge on one edge and leave an open wedge at each joint, and a crane's
  hook block hangs free, without a cable.
- Only the sheets and the owner's QA show a prop that enters or floats off the base stage.
- The first pass cannot express props standing on props, stock lower than 0.5 m, racks,
  strips under 0.5 m, round columns and joints, glass, or single lit ceiling fixtures.

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
- Edit the draft -> validate -> read the findings -> snapshot -> read every sheet -> edit
  again.
- The sheets land in `.tmp/snapshots/`: `plan.png` (the floor plan below 5.9 m and the
  overhead plan below 16.2 m, with a 10 m grid, the spawns with their 6 m circles and each
  prop's number), `section.png` (two long elevations and six cross sections, with lines at
  each floor and at 2.17 m), `view.png` (eight perspective views: from the spawns at
  eye height and two overviews from 12 m up) and `custom.png`.
- A point that starts with a minus sign needs the `=` form, as in `--eye=-5,1.7,-20`.
- Exit status 0 means accepted or done, 2 a blocked build or a rejected level, 3 a usage or
  file error, and 1 a defect or a broken sibling install.
- One validate takes about 4 s and one snapshot about 6 s, also with 800 crate slabs.
- When the validator accepts the draft, copy it over the committed file and run the
  formatter; `just lint` checks the committed file's layout.
