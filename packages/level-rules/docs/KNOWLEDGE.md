# level-rules knowledge

`@level-designer/level-rules` owns the validator's checks of the level format. It judges a
built level from six facts: the typed description, the typed level, the inspection of the
level GLB, the base stage's image count, the prepared static level and the placed static
objects. The sixth lists, in description order, each static object of the description with
the oriented box where `level-pipeline` placed it; the rules judge that box and place none.
From the description they read only `base.scale`, the seals and each prop's `at`.
`level-pipeline` is its consumer.

The component runs under Bun only. It reaches destruction lib's Rapier copy, so no page
imports it and `just lint` does not bundle it for the browser.

## The judgement

One asynchronous judgement returns three parts:

- the findings, each with a rule id, a subject and the message an author reads, in the order
  of the format's rules and, within a rule, in description order;
- the ramp zone, the z extent of the body world's step floors, or none;
- the main lane of each minion spawn: its width with the standing footprints, and the width
  it keeps.

The judgement is asynchronous only because destruction lib's Rapier backend loads that way.
The facade also offers the owner's triangle cap, which the report prints beside the count, and
the 2.17 m height of the standing band, which `level-cli` draws on the section sheets.

The component owns the spawn names: `player`, then the minion spawns in sec-111's order as
`+x+z`, `-x+z`, `+x-z` and `-x-z`. The rules name spawns by them, and the facade lists the
named spawns with their feet positions for the report's spawn lines.

## Units

- `finding`: the finding shape, the wording of counts and points, and the slack comparisons.
- `plan`: a slab's plan outline as a convex polygon, the plan gap between convex shapes, the
  overlap tests of convex shapes, and the shortest crossing with a free lane.
- `footing`: how each prop meets the prepared floors, and its standing footprint.
- `owner`: the owner's checks.
- `placement`: the placement rules, of the props and of the static objects.
- `clearance`: the clearance rules and the lane measurement.
- `proof`: the destructibility proof and the debris proxies.

The root unit holds the judgement and the `scale` rule. Dependencies point down: `plan` and
`finding` sit at the bottom, `footing` uses both, and the rule units use all three.

## Limits and wording

Every length limit compares with the length slack that `level-format` owns, 0.05 mm, so a
value typed at its limit passes and a value 0.1 mm beyond fails. Counts compare exactly. A
message renders every length and coordinate with `formatLength` of `level-format`, and a
count with thousands separators.

## Footing

The floor under a plan point is sec-111's `floorHeightAt` on the prepared static level. The
floors under a slab are the floors under its eight corners, each read 0.05 mm toward the
box centre in plan, so a slab that only touches a higher floor's edge stays on its own level.

- A prop stands when its lowest point lies within 0.01 m of the floor under `at`.
- It hangs when its lowest point is 2.17 m or more above the highest floor under its slabs.
- A standing slab is a slab of a standing prop that starts less than 2.17 m above the floor
  under `at`. Its plan outline is the convex hull of its corners seen from above.
- The standing footprint is the union of the standing slabs' outlines. A roof at 2.17 m or
  higher is no standing slab, so a tall hollow prop has its ring of walls for a footprint.

## The rules

The owner's checks read the GLB inspection and the point lights. `light-inside` judges a
light's plan position and the ceiling, `light-floor` its height over the floor under it, so
a sunk light yields one finding. `texture` compares the level's image count with the base
stage's.

The placement rules:

- `interior` names, per slab, the corner farthest outside the interior box and its distance.
- `support` gives the height of the lowest point above the floor the hang test reads, the
  highest floor under the prop's slabs.
- `floor` and `ramp` judge standing props only; a hanging prop may cross both.
- `low-top` reads each standing slab's top over the floor under `at`.
- `overlap` checks each pair of props, and in it each pair of slabs, by the separating axis
  test of two oriented boxes: the depth is the least overlap over the fifteen axis
  candidates. A finding names the deepest pair; contact up to 1 mm passes.
- `seal` fails when the part of a seal inside the interior box is thinner than 0.02 m on an
  axis.
- `interior` also names, per placed static object after the props, its corner farthest
  outside the interior box.
- `static`, after `seal`, judges each placed static object by the limits of its class, which
  `level-format`'s `staticClass` reads from `on` and `lift`.

## The static rule

The rule owns three numbers: a litter's height of 0.15 m, a litter's plan length of 1.5 m and
the hang height of 2.17 m that `support` uses too. Per object it reports, in this order:

- litter, on the floor or on a prop: a box higher than 0.15 m, and a longer plan side, width
  or length, over 1.5 m; the box's size is read, so a yaw changes nothing;
- floor litter: the floors under its plan corners, read as a slab's are, on two levels, and
  a plan outline that enters the ramp zone, by the test of `ramp`;
- an overhead object: an underside less than 2.17 m above the hall's highest floor, the last
  of sec-111's ascending main floor heights, wherever the object hangs.

Litter on a prop is judged for neither floor nor ramp: its prop passes them. No rule limits
the height of the top it lies on; the art team's brief holds that limit.

The clearance rules measure plan distances from standing footprints. A static standing
obstacle is an obstacle or enclosure box of the body world that starts less than 2.17 m above
the floor under its centre. The clearance rules read a footprint as the standing outlines
that no other outline of the same prop contains: a crate's lid stands for its four sides. Per
prop, `gap` reports its pairs with later props first, then its static obstacles in body world
order; `spawn` follows the spawn order `player`, `+x+z`, `-x+z`, `+x-z` and `-x-z`.

The `scale` rule fails whenever sec-111 measures a scale other than exactly 1, and advises
`base.scale` times the measured scale to six decimals.

## The gap rule

`gap` judges a pair, two footprints or a footprint and one static obstacle, whose distance is
0.7 m or more and under 1.5 m. Such a pair fails only where a player fits between the two:

- a crossing is the shortest segment between two outlines of the pair, or a segment from one
  outline that meets an edge of the other at a right angle;
- its lane is the rectangle 0.7 m wide along it;
- the pair fails when a crossing 0.7 m or longer and under 1.5 m has a free lane, one that
  overlaps no other footprint or static obstacle by more than the slack; the pair's own two
  never count;
- the message gives the shortest such crossing, and for an obstacle that crossing's end on it.

The search is exact. The crossings that meet one edge at a right angle form families: the
stretch of an edge of one outline outside the other edge and over it. A family's lengths run
linearly along it, and its lane can change state only where a lane side passes a vertex of
another shape, or where an edge of another shape crosses the line of the starts or of the
ends. The search tests the lane at those positions, at the length limits, at the midpoints
between them and at both ends. Only a shape within half a lane of the two outlines' bounds can
block a lane, so the others are filtered by their bounds first.

Crates in a row, a touching block, chained conveyors and a prop against a wall of several
body boxes therefore pass, and a third prop that narrows a pocket is judged with its own pair.
The rule does not catch every arrangement:

- a pair nearer than 0.7 m is not judged, so two props that touch at an acute angle leave a
  wedge the rule never sees;
- it stays conservative where nothing fills a gap: a notch 0.4 m deep between two crates
  beside a smaller one fails, and so does a corridor mouth only 0.36 m deep;
- a prop that leaves a pocket against a wall of several flush body boxes gets one finding per
  box that the pocket faces, because each box is its own pair;
- a prop inside a tall hollow prop is judged against its walls;
- that the pairs a narrowing prop forms catch every pocket it leaves is shown on drawn cases,
  not proven.

## The lane measurement

The lane grid has 0.1 m cells from the interior's lowest x and z. A cell is blocked when it
reaches outside the interior, or when a static standing obstacle or a standing slab's outline
overlaps it by more than the slack; a cell is tested against the outline, not sampled at its
centre, so a thin wall at any yaw blocks every cell it crosses.

A free cell's clearance is the distance from its centre to the edge of the nearest blocked
cell, and the grid's outer edge counts as blocked. A direct search finds it: per row the
nearest blocked cell, then rows outward until no nearer blocked cell can exist. The squared
distance in half cells is an exact integer, so equal clearances compare exactly.

Free cells join a union-find forest widest first. The cell that first connects a minion
spawn's cell to the player spawn's cell is the narrowest cell of a widest route, and the lane
is twice its clearance plus one cell wide. A route starts in its spawn's cell, so the spawn's
own clearance bounds its lane. A spawn without a route has a lane of width 0, and its message
names the spawn's cell. The formula reads an opening of an odd cell count one cell wider: a
2.9 m corridor on the grid reads 3.0 m and a 2.8 m one reads 2.8 m.

Each lane is measured on the static scene and again with the standing footprints. It keeps
3 m, or its static width where that is narrower; a level without standing props is measured
once.

## The destructibility proof

Each slab runs two trials, a rail and then a blast, each on a fresh model from the shared
builder, alone in a fresh collision scene at the slab's pose. A trial casts from 0.2 m outside
the +Z face at its centre and must hit this slab's own registration. The rail must leave the
material gone at the hit; the blast must leave it gone and change the retained cuboids. A
throw from destruction lib fails its step. The message names the first failing step of admit,
register, aim, rail and blast.

`proxies` registers every slab that destruction lib admits in one scene and syncs it into
one Rapier backend; a refused slab belongs to `destructible` and stays out.

## What the tests prove

The tests enter through the facade. Every case but the guard and the real-hall cases runs on
a hand-built box room; no test prepares a level.

The rule limits on box rooms:

- Each rule passes at its limit and fails one step beyond with its subject and message,
  including 0.69, 0.70, 1.49 and 1.50 m for `gap`, 0.49 and 0.50 m for `low-top`, and 2.16
  and 2.17 m for `support`.
- Faces typed at -0.8 and -2.3, 1.4999999999999998 m apart in floats, pass `gap`.
- Two tall enclosures of `prop-kit` without a glow, typed 0.68 m apart, measure 0.74 m.
- A corridor of exactly 3.0 m measures 3.0 m, and a ring of 0.05 m walls under a roof at
  2.17 m, across a lane at a yaw of 23 degrees, closes it.

The static objects on box rooms:

- `static` passes a litter 0.15 m high and 1.5 m long, also at a yaw of 30 degrees, on the
  floor and on a prop, and fails each 0.1 mm beyond; an edge-biased sample of sizes at yaws
  0, 15, 45 and 90 degrees holds both limits.
- An overhead object 2.17 m above the raised slab passes over either floor, and 0.1 mm lower
  fails.
- Floor litter 0.1 mm onto another floor level or into the ramp zone fails, and the same box
  on a prop passes.
- `interior` passes a static object on the interior's edge, fails it 0.1 mm beyond and names
  it after the props.

The filled gap on box rooms:

- `gap` passes three touching crates in a row, at yaw 0 and 30 degrees; chained conveyors, at
  yaw 0 and 37 degrees; a touching 7 x 23 block at yaw 0 and a 7 x 15 block at yaws 13, 37
  and 61 degrees; and an unyawed row against a wall of two body boxes. sec-111's body boxes
  are axis-aligned, so a row stands flush against them only at multiples of 90 degrees.
- `gap` fails a 1.0 m pocket, also with a third prop in part of it, a corridor that widens
  from 1.0 m with its narrow end plugged, and a third prop that leaves 0.70 m; 0.69 m passes.

The real hall, the proof and the guard:

- On sec-111's committed prepared level three lanes measure more than 7 m and the +x-z lane
  1.8 m, its scale of 3.89956 fails `scale`, and an 8 m partition across the west lane
  narrows the -x-z lane to 2.2 m.
- The proof passes a seeded uniform sample and an edge-biased sample of 200 slabs each, the
  cap corners down to a 0.02 m face, and `prop-kit`'s glow slabs of its longest conveyor,
  enclosure and light strips.
- The guard walks sec-111's capsule: a 0.7 m gap blocks and 0.76 m lets pass, a 0.30 m top
  is climbed and a 0.5 m top blocks, and an underside at 2.17 m lets pass.

Its dependency documents are the
[level-format knowledge](../../level-format/docs/KNOWLEDGE.md), the
[level-glb knowledge](../../level-glb/docs/KNOWLEDGE.md), the
[slab-model knowledge](../../slab-model/docs/KNOWLEDGE.md), the
[sec111-gateway knowledge](../../sec111-gateway/docs/KNOWLEDGE.md) and the
[destruction-gateway knowledge](../../destruction-gateway/docs/KNOWLEDGE.md).
