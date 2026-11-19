# Seals brief: the seals and the overhead objects

This brief is the art team's input for milestone 6 of TASK-001.07: the finishes of the seals,
and the overhead objects, the static objects that hang on a wall, a deck or a truss. It is
written in the words of `finish-format.md` and `non-destructible-objects.md` of
`docs/researches/2026-11-17-dark-factory-look-dev/`, and its short names for the reference
images are those of `research-dark-factory-surfaces.md` beside them. A colour's name is the
palette's of the painter briefs, `look-dev-painter-briefs.md`.

Every size is in metres, every position is a level coordinate and every luminance is linear.
Hall luminances are computed at the lights the owner passed, by the model of
`docs/LOOK-AND-LIGHTING.md`. At the ambient of 3.3 a top shows 0.21 of its albedo, a side 0.11
and an underside 0.046, and the page shows black under 0.014. A point adds its candela times
the cosine over pi times the squared distance, with its range's falloff and the luminance of
its colour. The art team reads a recipe on its page of the finish sheet, which shows albedo
only; the owner's browser shows it under the lights.

## 1. What the milestone adds

The milestone is additive. No prop, litter, lamp, light, floor line or passed recipe changes,
and no point light joins. The mood stays the owner's dark factory: every new surface sits on
the ladder's dark step or under it, so at the ambient it shows black and reads as a
silhouette. Three marks stand just over the black point there, at 0.02 to 0.03: a board's
frame line, the yellow pipe and the warning yellow. Every other mark shows where a passed
point reaches it, or as one of six lamps.

- Six seals take a finish: the end wall, the door and the four windows. The seven seals behind
  the stage's walls stay flat.
- 28 overhead objects join the 17 emergency lamps: ten boards on piers, three hanging signs on
  six rods, one sign on the front deck's edge and eight pipe runs on the east wall. The level
  then holds 245 static objects of the 256 the format admits.
- They take five painted paths and one plain path: six programs at the view's start.

"More interesting and detailed" means what a player reads from where the player stands:

- the end wall, at arm's length beside the dock box: a wicket door with its push bar, the
  gate's guide and a control box; from the dock, ribs, sheet laps, columns on the floor's
  joints, a base wall, and a gate with slats, a hood and a board for its digit;
- the door, at arm's length in the light of its own emergency lamp: slats, a row of vision
  slots at eye height, two handles and a warning sill;
- a window, 9 m away or more: three leaves between two posts under a hood;
- a board, 3 to 30 m away: a frame with its fixings, a field for the bay's number, two lamps;
- a pipe run, 4 m over the east lane: three pipes with crests, gaps, clamps and couplings.

## 2. The seals

A seal keeps its id, its extents and its tint, `#55595d` (0.099), as the owner passed them. A
painted seal states `finish` in place of `metalness` and `roughness`. Its role's body holds
roughness 0.9, the seals' passed value, so no highlight of a point changes. No seal takes a
`glow`, and every `number` stays 0.

The painted seals, each as `min` to `max`:

- `end-wall`: [-17.7, -0.5, 30.22] to [17.7, 19.2, 31.5]. `corrugated/gate`, `wear` 0.5.
- `door-plus-x`: [16.06, -0.1, -15.25] to [16.36, 7.35, -7.8]. `corrugated/roller`, `wear` 0.6.
- `window-minus-x-rear`: [-16.4, 6.25, -82.35] to [-16.1, 11.6, -71.7]. `corrugated/shutter`.
- `window-minus-x-mid`: [-16.4, 6.25, -42.9] to [-16.1, 11.6, -32.25]. `corrugated/shutter`.
- `window-plus-x-rear`: [16.06, 6.25, -82.35] to [16.36, 11.6, -71.7]. `corrugated/shutter`.
- `window-plus-x-mid`: [16.06, 6.25, -42.9] to [16.36, 11.6, -32.25]. `corrugated/shutter`.

The flat seals keep `metalness` 0 and `roughness` 0.9. Each stands behind a wall, a sloped
panel or a pier of the stage and shows only through a gap, where no pattern reads:

- `back-slot`: [-16.9, 17.95, -90.1] to [16.9, 19, -89.8].
- `wall-top-plus-x`: [16.62, 13.5, -90.1] to [16.9, 19, 31.5].
- `wall-minus-x`: [-16.9, -0.5, -90.1] to [-16.62, 19, 31.5].
- `pier-plus-x-1` to `pier-plus-x-4`: x 16.64 to 16.9 and y -0.5 to 13.5, at z -58.686 to
  -56.004, -18.421 to -15.739, 1.711 to 4.394 and 21.844 to 24.526.

On a seal's large side `x` runs from the face's centre toward the right of a viewer who faces
it, and `y` up from the seal's base. The stage's frames, measured on the built level, hide the
rim of the door and of each window:

- The end wall: a viewer in the hall faces +Z, so a positive `x` is the level's -X. `y` is the
  level's y plus 0.5, and the floor lies at `y` 0.5.
- The door: `y` is the level's y plus 0.1. The frame leaves `x` -3.65 to 3.65 and `y` 0.1 to
  7.37 in sight.
- A window: `y` is the level's y less 6.25. The frame leaves `x` -5.24 to 5.24 and `y` 0.09 to
  5.3 in sight.

## 3. The seal recipes

The finish is `corrugated`, the containers'; its `cut` and `light` stand. Five roles join it.
`cladding` and `slats` are bases that no seal names, so neither costs a program. A layer reads
as in the painter recipes: kind, its keys, the common keys, then `->` and its effects. None of
the five holds a `glyphs` layer or a `border`: every guide is a `rectangle`.

`corrugated/cladding`. Body: roughness 0.9. 5 layers, one `noise`.

1. bands: along across, period 0.25, width 0.05, ramp 0.05 -> shade 0.78. Ribs; a crest lies on
   the centre line.
2. bands: along up, period 3, width 0.03 -> shade 0.7. Sheet laps, at the level's y 4, 7, 10,
   13 and 16.
3. rectangle: from ["-0.5w", 0] to ["0.5w", 1.9] -> paint 0.55. The plain base wall, up to the
   level's y 1.4, where the side walls' darker base ends.
4. bands: along across, period 6.667, width 0.3 -> paint 0.7. Columns at 3.33, 10 and 16.67
   either side of the centre line, on the floor's joints.
5. noise: wavelength [0.4, 5], threshold 0.72, softness 0.2; wear -> shade 0.8. Water streaks.
   Optional.

`corrugated/gate`, on the end wall, extends `cladding`. 19 layers. The gate fills the level's x
-3 to 3 and y 0 to 4.7, behind the dock box and the three gate strips. Its first eight layers:

1. rectangle: from [-3, 0.5] to [3, 5.2] -> paint 0.9. Leaf.
2. bands: along up, period 0.1, width 0.03; clip [-3, 0.5] to [3, 5.2] -> shade 0.7. Slats.
3. rectangle: from [-3, 0.5] to [3, 0.75] -> color worn yellow.
4. bands: along diagonal, period 0.3, width 0.15; clip [-3, 0.5] to [3, 0.75] -> color black.
   Warning bars at the foot.
5. rectangle: across out; from [3, 0.5] to [3.15, 5.2] -> shade 0.5. Guides.
6. rectangle: from [-3.15, 5.2] to [3.15, 5.6] -> paint 0.75. Hood.
7. rectangle: from [-3.15, 5.57] to [3.15, 5.6] -> shade 1.3. Its lit upper lip.
8. rectangle: from [-0.55, 5.7] to [0.55, 6.9] -> paint 0.5. The board for the gate's digit.

Its last six layers lie east of the gate, where a player stands beside the dock box:

1. rectangle: from [-3.75, 1.6] to [-3.53, 1.92] -> color switch grey. Control box, at the
   level's x 3.53 to 3.75.
2. disc: at [-3.69, 1.8], radius 0.02 -> color red. Stop button.
3. disc: at [-3.59, 1.8], radius 0.02 -> color galvanised grey. Key switch.
4. rectangle: from [-5.95, 0.5] to [-4.95, 2.65] -> shade 0.5. The wicket door's frame.
5. rectangle: from [-5.9, 0.5] to [-5, 2.6] -> paint 0.8. Its leaf, at the level's x 5 to 5.9,
   2.1 high.
6. rectangle: from [-5.8, 1.5] to [-5.1, 1.54]; detail medium -> color bare metal, metalness
   1, roughness 0.7. Push bar.

The board is ready for milestone 7: the gate's digit, 1.0 high, stands on [0, 5.8]. Its ink
is galvanised grey, which shows 0.32 opposite the gate point. White would show 0.64 there,
close under the bloom threshold of 0.75.

`corrugated/slats`. Body: roughness 0.9. 5 layers.

1. bands: along up, period 0.1, width 0.03 -> shade 0.7. Slats.
2. rectangle: across ends; from [0, 0] to [0.25, "1h"] -> paint 0.6. A guide at each end.
3. rectangle: up top; from ["-0.5w", 0] to ["0.5w", 0.4] -> paint 0.75. Hood.
4. rectangle: up top; from ["-0.5w", 0.4] to ["0.5w", 0.43] -> shade 0.5. The shadow under it.
5. rectangle: from ["-0.5w", 0] to ["0.5w", 0.18] -> paint 0.6. Bottom rail.

`corrugated/shutter`, on the four windows, extends `slats`. 6 layers.

1. bands: along across, period "0.3333w", width 0.2 -> paint 0.6. Two posts a third of the
   width apart, so three leaves. The posts run over the hood and the rail, and the half bands
   at the ends fall on the guides.

`corrugated/roller`, on the door, extends `slats`. 10 layers, one `noise`.

1. rectangle: from ["-0.5w", 0.1] to ["0.5w", 0.35] -> color worn yellow.
2. bands: along diagonal, period 0.3, width 0.15; clip ["-0.5w", 0.1] to ["0.5w", 0.35]
   -> color black. Warning sill, 0.25 high from the floor.
3. bands: along across, period 0.6, width 0.3; clip [-2.95, 1.65] to [2.95, 1.75] -> color
   glass. Ten vision slots, at the level's y 1.55 to 1.65.
4. rectangle: across out; from [0.6, 0.62] to [0.95, 0.66]; detail medium -> color bare metal,
   metalness 1, roughness 0.7. Two handles.
5. noise: wavelength [0.9, 0.15], threshold 0.7, softness 0.2; clip ["-0.5w", 0.35] to
   ["0.5w", 2.2]; wear -> shade 0.7. Scuffs. Optional.

The lamp `emergency-1` hangs on the door's centre line at the level's y 3.37 to 3.53, clear of
every mark. The slots keep the body's roughness: a glossy pane 4 m from an emergency point
risks a highlight over the bloom threshold.

## 4. The overhead objects

Each object is one box with a `lift`, the height of its underside over the floor under its
`at`: the front floor at y 0 or the raised slab at y 0.3241. Every underside stands 4.5 m or
more over its floor. Each place below was measured on the built level.

### Boards on piers

Ten boards, each `size` [0.9, 1.1, 0.05], `yaw` 90, `color` red `#9a2a1c`, `finish`
`sign/board`. A board's back lies on its pier's face, x 15.12 on +X and x -14.85 on -X. All
stand from y 4.85 to 5.95: 1.3 over the emergency lamps and 0.13 under the decks.

- `bay-board-e-1`, `bay-board-e-2` and `bay-board-e-3`: at x 15.095 and z -77.48, -57.35 and
  -37.21, `lift` 4.5259.
- `bay-board-e-4`, `bay-board-e-5` and `bay-board-e-6`: at x 15.095 and z -17.75, 3.75 and
  23.19, `lift` 4.85.
- `bay-board-w-1` and `bay-board-w-3`: at x -14.825 and z -77.48 and -37.21, `lift` 4.5259.
- `bay-board-w-5` and `bay-board-w-6`: at x -14.825 and z 3.75 and 23.19, `lift` 4.85.

Three boards sit off their pier's centre. `bay-board-e-5` and `bay-board-w-5` stand over their
lamps at z 3.75, clear of the jibs' masts, and `bay-board-e-4` stands 0.66 clear of the tube
at z -16.64. Two piers on -X take no board: a tank covers the pier at z -57.35, and two tubes
of the stage's row bulge through the face of the pier at z -17.08. From: the red boards on the
columns of assembly hall.

### Hanging signs

Three signs, each `size` [2.4, 0.8, 0.08], `color` red, `finish` `sign/board`, `glow` `eye`.
A sign hangs across the hall, so both its faces show. Two rods carry it, each `size` [0.04,
height, 0.04], `color` `#1a1c1f`, `finish` `sign/hanger`, 0.9 either side of the sign's
centre. A rod rises from the sign's top to y 16.3, 0.02 into the lowest member of a truss,
whose underside lies at y 16.28, and ends 0.6 under the ceiling fixtures.

- `aisle-sign-1`: at [0, -19.7], `lift` 7.2. Rods `aisle-sign-1-rod-w` at [-0.9, -19.7] and
  `aisle-sign-1-rod-e` at [0.9, -19.7], `lift` 8, height 8.3. The member spans z -19.85 to
  -19.54.
- `aisle-sign-2`: at [0, 5.39], `lift` 7.2. Rods `aisle-sign-2-rod-w` at [-0.9, 5.39] and
  `aisle-sign-2-rod-e` at [0.9, 5.39], `lift` 8, height 8.3. The member spans z 5.24 to 5.55.
- `lane-sign`: at [-10, -69.86], `lift` 8.5759, so y 8.9 to 9.7, over the back deck. Rods
  `lane-sign-rod-w` at [-10.9, -69.86] and `lane-sign-rod-e` at [-9.1, -69.86], `lift`
  9.3759, height 6.6. The member spans z -70.02 to -69.7.

The aisle signs hang over the centre aisle from y 7.2 to 8: over the light strips at 5.58 and
the line jibs' heads at 5.4, under the crane hooks at 11.16. `aisle-sign-1` hangs 2.3 behind
the player spawn and 3.9 from the nearer girder of `crane-apron`. `aisle-sign-2` hangs 2.4
from the nearer girder of `crane-lines`, whose underside lies 6.2 higher. The lane sign shows
from the yard's court and from the ramp, between the yard and the front deck's underside.
From: the hanging signs of assembly hall, and the box on a pole under the ceiling of teal
aisle.

### The sign on the front deck's edge

`ramp-sign`: at [0, -29.29], `size` [2, 0.75, 0.06], `lift` 5.7559, `color` red, `finish`
`sign/board`, no glow. Its back lies on the deck's edge face at z -29.32, and it stands from
the deck's underside at y 6.08 to 6.83. It hangs 0.18 in front of the lip's strips and 0.08
over them, so it hides no part of a strip. From the eye at the player spawn its top stands at
35.1 degrees, 0.2 under the far girder of `crane-fall`, and its 2 m of width stay 1.6 degrees
clear of that crane's hook. From: the hanging signs of assembly hall.

### Pipe runs on the east wall

Eight runs, each `size` [length, 0.36, 0.12], `yaw` 90, `color` `#4a4e52`, `finish`
`service/pipes`, at x 16.39 on the wall's face at x 16.45. One line runs from y 5.45 to 5.81,
under the decks at 6.08 and the window frames at 6.16. A run ends 0.02 inside a pier's flank,
or on the back wall, the door's frame or the end wall, and passes through the pilasters. The
duct's support stands on the wall from z -68.63 to -65.77, and two runs end 0.17 off it.

- `pipes-e-1`: at [16.39, -84.33], length 11.08, `lift` 5.1259. Back wall to pier.
- `pipes-e-2`: at [16.39, -72.48], length 7.36, `lift` 5.1259. Pier to the duct near z -67.
- `pipes-e-3`: at [16.39, -62.13], length 6.94, `lift` 5.1259. That duct to pier.
- `pipes-e-4`: at [16.39, -47.28], length 17.5, `lift` 5.1259. Pier to pier.
- `pipes-e-5`: at [16.39, -27.15], length 17.5, `lift` 5.45. Pier to pier, across the ramp.
- `pipes-e-6`: at [16.39, -2.94], length 9.36, `lift` 5.45. Door frame to pier.
- `pipes-e-7`: at [16.39, 13.12], length 17.5, `lift` 5.45. Pier to pier.
- `pipes-e-8`: at [16.39, 27.36], length 5.72, `lift` 5.45. Pier to end wall.

The -X wall carries the stage's own tubes and tanks and takes none. From: the yellow pipe run
on the block wall of pillar jib, and the conduits on the walls of the set of Alien.

## 5. The overhead recipes

Two finishes join the table, `sign` and `service`, each with cut: metal, bare metal, and
light: pale cyan. The table's form asks for both; no object uses either. A box's four sides
are `outside` faces, so a board shows its marks on both faces. Its thin sides show the field's
band across their whole thickness, without frame or lenses.

`sign/board`. Body: roughness 0.8. 7 layers.

1. border: width 0.03, inset 0.04 -> color galvanised grey. Frame line.
2. rectangle: from ["-0.5w+0.12", 0.3] to ["0.5w-0.12", "1h-0.12"] -> shade 0.55. The field for
   the bay's number.
3. disc: across out; at [0.16, 0.18], radius 0.09 -> color ring grey. Two lamp rims.
4. disc: across out; at [0.16, 0.18], radius 0.075 -> color glass. Their lenses.
5. disc: across out; at [0.16, 0.18], radius 0.06 -> lit 1. Their light, on a sign with a glow.
6. disc: across ends; at [0.055, 0.055], radius 0.012; detail medium -> color black. Lower
   fixings, in the frame's corners.
7. disc: across ends, up top; at [0.055, 0.055], radius 0.012; detail medium -> color black.
   Upper fixings.

The field is ready for milestone 7: numerals 0.3 high on a sign and up to 0.5 high on a pier's
board, in white, 10 to 1 against the field.

`sign/hanger`. Body: roughness 0.7. No layer: a plain path, which costs no program.

`service/pipes`. Body: roughness 0.7. 5 layers. Three pipes at a pitch of 0.12.

1. rectangle: from ["-0.5w", 0.125] to ["0.5w", 0.235] -> color worn yellow. The middle pipe.
2. bands: along up, period 0.12, width 0.02, offset 0.025 -> shade 1.5. Crests, lit from above.
3. bands: along up, period 0.12, width 0.03, phase 0 -> shade 0.35. Gaps between the pipes.
4. bands: along across, period 2, width 0.05 -> shade 0.45. Clamps.
5. bands: along across, period 6, width 0.12, phase 0 -> shade 1.3. Couplings.

## 6. Values

Each role's place on the value ladder, the mean its page prints, and its level away from the
points, as albedo -> luminance:

- `corrugated/gate`: dark. The wall prints 0.087, 0.88 of the flat seal -> 0.010, black.
  Crests 0.099 -> 0.011, the leaf 0.081 -> 0.009, the base wall 0.054 -> 0.006.
- `corrugated/shutter`: dark. 0.085 -> 0.009, black. Posts and guides 0.059 -> 0.007.
- `corrugated/roller`: dark. 0.086 -> 0.009, black.
- `sign/board`: dark. Red 0.086; a board prints 0.083 -> 0.009, black. The field 0.047
  -> 0.005. The frame line 0.25 -> 0.028, over the black point.
- `sign/hanger`: black. 0.011 -> 0.001.
- `service/pipes`: dark. A run prints 0.105. Grey 0.075 -> 0.008 and its crests 0.012, both
  black. The yellow pipe 0.20 -> 0.022, its crest 0.033.

Where a passed point reaches a new surface, the highest level it gives:

- The gate point, 24 cd, 2.42 off the end wall. The flat seal shows up to 0.126, opposite the
  point, 0.038 at 3 m, 0.019 at 5 m and black from 8 m. Under the recipe a strip of crests
  keeps 0.126 and every mark shows less: the lip 0.123, the leaf 0.113, the hood 0.095, the
  board 0.063.
- The points of `emergency-3` and `emergency-4`, 7 m off the end wall. Each lifts the flat
  seal to 0.017 at most, and the recipe shows no more.
- The point of `emergency-1`, 44 cd, 4.06 off the door. The flat seal shows up to 0.037, at
  the lamp's height; the slats up to 0.034 and the sill's yellow up to 0.045, under a floor
  line's 0.051.
- A board shows up to 0.046 and its frame line up to 0.13: the lower edge of `bay-board-w-3`,
  2.68 from a point of 37 cd. `bay-board-e-3`, 2.40 from a point of 27 cd, follows at 0.043
  and 0.12. The three boards with no lamp under them stay at 0.011 to 0.013.
- A pipe run shows up to 0.068 on its yellow pipe, 0.098 on that pipe's crest and 0.027 on a
  grey pipe: `pipes-e-2`, 1.73 beside a point of 27 cd.

The end wall therefore reads as a dark face with a gate in the gate point's pool, never as a
lit wall: no place on it shows more than the owner passed, and beyond the pool it stays black.

## 7. Lit parts

One lit part exists: the pair of lamps on each face of the three hanging signs, twelve discs
of radius 0.06 in all, 0.32 apart in a pair.

- Glow: `eye`, at its strength of 0.75. No light value changes.
- Level: 0.296, 0.39 of the bloom threshold, 31 to 1 against its board. The eyes of Jin-Roh
  stand 68 to 1.
- It lights nothing: a glow only makes its own pixels emissive.
- Off: `finishes.sign.roles.board.layers[4].lit` at 0 turns all three signs dark. A sign that
  leaves out its `glow` goes dark alone: the layer states `lit` alone, so it paints nothing.

The pier boards and the ramp sign state no glow and show their lenses dark. No seal and no
pipe run carries a lit part.

## 8. Limits

- Every object is one box of 12 triangles, inside the interior. The lowest underside, a board
  on a slab pier, starts 4.53 over the raised slab, above the hang height of 2.17.
- Every object touches its anchor: a board its pier's face, a rod its truss, the ramp sign the
  deck's edge, a pipe run the wall. A sign hangs on its two rods.
- Measured on the built level, no object enters a prop or a part of the stage, but for a rod's
  0.02 in its truss and a pipe run's ends and pilasters. None touches a prop: the nearest are
  the lip's strips, 0.18 behind the ramp sign, and the mast of `jib-east`, 0.8 from
  `bay-board-e-5`.
- Nothing collides with a static object, so none gives cover or blocks a path. All hang above
  every body's head, so none stands in a sight line of play.
- Each object within 6 m of a spawn keeps the 4.5 m: `aisle-sign-1` at 7.2 under its rods,
  `bay-board-e-6` and `bay-board-w-6` at 4.85, `pipes-e-8` at 5.45 and `pipes-e-1` at 5.13.

## 9. Cost and the first cut

Five painted paths, and what each buys:

- `corrugated/gate`: the level's largest face, as cladding with a gate, in one program.
- `corrugated/shutter`: the four windows, as shutters of three leaves.
- `corrugated/roller`: the door, the one seal a player touches.
- `sign/board`: eleven boards, and with the glow `eye` a second program for the three signs.
- `service/pipes`: 93 m of services along the bare east wall.

The 28 boxes add 336 triangles, so the level holds 136,829. The gate holds 19 layers, the
roller 10, the board 7, the shutter 6 and the pipes 5; the gate and the roller hold one `noise`
each. The caps are 24 layers and two `noise` layers. Bare metal is line work: one push bar and
two handles.

If the owner reads a lower frame rate, the cuts come in this order:

1. the two optional `noise` layers;
2. the signs' `glow`, which ends the sixth program;
3. the eight pipe runs with their path;
4. the six layers east of the gate.

## 10. Not checked

- Any recipe under the level's lights or on a GPU. Every luminance is computed.
- The lit lamps: a page shows albedo only.
- The highlight of a point on the bare metal of the push bar and the handles.
- How red and yellow paint read under the cold points. The model takes a surface's luminance,
  and a red board or a yellow pipe returns less blue light than that.
- Whether the lane sign reads from the ramp: the mast and the tie of `jib-yard` cross that
  view from the player spawn.
- The windows' pattern in the game: at the ambient every part of a shutter stays under the
  black point.
