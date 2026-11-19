# Litter brief: the static objects of a factory in chaos

This brief is the art team's input for the litter of TASK-001.07: the static objects that show
the dark factory wrecked by its rebel robots. It is written in the words of `finish-format.md`
and `non-destructible-objects.md` of `docs/researches/2026-11-17-dark-factory-look-dev/`, and
its short names for the reference images are those of `research-dark-factory-surfaces.md` beside
them. A colour's name is the palette's of the painter briefs, `look-dev-painter-briefs.md`.

Every size is in metres, every position is a level coordinate and every luminance is linear.
Hall luminances are computed at the lights of the first art pass: an environment of intensity 7
and that pass's eight points. `docs/LOOK-AND-LIGHTING.md` gives the level's present levels. The
art team reads a recipe on its page of the finish sheet, which shows albedo only; the owner's
browser shows it under the lights.

## 1. What the litter shows

The owner's direction is the subject: the factory is in total chaos, and the rebel robots have
messed up its interior. Litter lies everywhere, papers, metal sheets and broken tools, on the
floor and on the tops of the production lines and the tables. The static objects are cheap and
add little geometry.

- A piece of litter is one box of 12 triangles. Its richness is paint.
- A recipe covers its whole face, so each kind is the object itself and never a scatter of
  smaller things. A box 0.02 high is the thinnest: a paper reads as a sheaf.
- The level holds no table. A table top is a top that a player looks down on: a conveyor's
  deck, the lid of a crate 1.0 or 1.2 high and the top of a stack 1.0 high. The art team keeps
  litter off every top higher than 1.3 above its floor; no rule of the validator holds that
  limit.
- The level takes 200 pieces in 19 clusters and five finish paths. A piece's id is `litter`,
  its cluster and its number, as `litter-apron-03`.

"More interesting and detailed" means what a player sees at arm's length, looking down on a
top. A deck lies 0.82 and a lid of 1.2 lies 0.52 under the eye, 1.72 above the floor, and a
pixel covers 1 to 2 mm there. The `fine` marks live on the tops: print rows, tread studs,
scratches, nails, the ribs of a grip, the sockets of a tray. On the floor a pixel covers 3.3 mm
straight down and 13 mm three metres ahead, so floor litter reads by its outline, its value,
its bold blocks and its `medium` lines.

## 2. The kinds

Each kind is one box. Its length is its longer plan side, and on its upper face `w` is the
box's width and `h` its length. A pallet piece is the exception: it keeps the pallet's width,
so its length is its shorter side.

The owner's three kinds:

- Paper: sheets, drawings and manuals. 0.21 by 0.30, 0.30 by 0.42, 0.42 by 0.59 and 0.59 by
  0.84; 0.02 high, and 0.03 or 0.04 in a pile. Tints: paper `#a3a49f` and copy yellow
  `#a89a5c`. On the floor and on tops. Path `litter/paper`. From: the owner's words; no
  reference image shows a floor of paper.
- Plate: metal sheets, offcuts, guard and cover plates. 0.4 by 0.6 to 1.0 by 1.4, 0.02 to 0.04
  high. Tints: galvanised grey, housing grey `#73767a` and worn yellow. On the floor, the decks
  and the tops. Path `litter/plate`. From: the pale sheets and offcuts on the crane shop's
  floor, and the sheet stock of pillar jib.
- Tool: bars 0.05 by 0.6, wrenches 0.06 by 0.35, torque tools 0.07 by 0.5 and rollers knocked
  off a bed, 0.05 by 0.84; 0.03 to 0.06 high. The tint is the grip: safety yellow, red, black,
  or ring grey on a roller. On the decks, the tops and the floor. Path `litter/tool`. From:
  the owner's words; the tool cart of pillar jib.

A tool's wear is a switch. A whole tool states 0. A broken one states 1 and is shorter: a bar
0.34, a wrench 0.2 and a torque tool 0.3 long. Twelve more broken tools lie on the floor alone:
long tools 0.06 to 0.08 wide and 0.5 to 0.9 long, which read from standing height.

What else lies flat in a wrecked plant and reads at a glance:

- Tray: tool trays, drawers and cases. 0.4 by 0.5, 0.45 by 0.6 and 0.6 by 0.8; 0.06 to 0.10
  high. The tint is the tray: red, hoist blue `#2f5f9e` or housing grey. On the decks, the tops
  and the floor. Path `litter/tray`. From: the red tool chest of twin jibs.
- Card: flattened cartons. 0.5 by 0.7 to 0.9 by 1.3, 0.02 to 0.04 high. Tint: kraft `#a08058`.
  On the floor, and two on lids. Path `litter/paper`. From: the cartons in the racking of twin
  jibs.
- Pallet: pallets 1.0 by 1.2 and 0.8 by 1.2, and pieces 1.0 wide and 0.5 or 0.6 long, all 0.14
  high; crate lids 1.2 by 1.2, 0.05 high. Tints: pallet brown `#b37841`, the references' crate
  brown, and the crates' `#a06e3c`. On the floor only. Path `litter/pallet`. From: both jib
  images and machine bay.

## 3. The recipes

The finish is `litter`. Cut: metal, bare metal; light: pale cyan. The table's form asks for
both, and a litter uses neither: it takes no glow and no legend. A layer reads as in the painter
recipes: kind, its keys, the common keys, then `->` and its effects. A box's four sides are
`outside` faces and its upper face is `top`, so every mark of a top states `on: "top"`, which
the lists below leave out; a layer under "Sides" draws on `outside`. A field takes no `detail`;
a thin line does.

`litter/paper`. Body: roughness 0.9. 9 layers, one `noise`. Sides: face -> shade 0.3, the
sheet's shadow on the floor.

1. border: width 0.006, inset 0.02; detail medium -> shade 0.6. Frame line.
2. bands: along up, period 0.014, width 0.006; clip ["-0.38w", "0.42h"] to ["0.38w", "0.84h"]
   -> shade 0.55. Print rows.
3. rectangle: from ["-0.38w", "0.87h"] to ["0.1w", "0.93h"]; detail medium -> shade 0.45.
   Header bar.
4. rectangle: from ["0.1w", "0.07h"] to ["0.4w", "0.2h"]; detail medium -> shade 0.7. Title
   block.
5. rectangle: from ["-0.5w", "0.5h-0.003"] to ["0.5w", "0.5h+0.003"]; detail medium -> shade
   0.75. rectangle: from [-0.003, 0] to [0.003, "1h"]; detail medium -> shade 0.75. Fold cross.
6. bands: along diagonal, up top, period 100, width 0.2, phase 0, offset "-0.283w-0.072"
   -> shade 0.5. One bent corner in shade, its legs 0.04 plus a tenth of the width. The period
   keeps every other band off the face.
7. noise: wavelength [0.12, 0.12], threshold 0.6, softness 0.25; wear -> shade 0.55. Trodden
   dirt.

`litter/plate`. Body: roughness 0.6, a paint. 9 layers, one `noise`. Sides: face -> color bare
metal, metalness 1, roughness 0.7, the cut edges.

1. dots: pitch [0.04, 0.04], radius 0.008 -> shade 1.35. Tread studs.
2. rectangle: from ["-0.5w", "1h-0.1"] to ["0.5w", "1h"] -> color primer. A primed end, as on
   the steel stock.
3. border: width 0.012; detail medium -> shade 1.3. Sheared lip.
4. dots: pitch ["0.86w", "0.9h"], radius 0.012, phase [0, 0], offset ["-0.43w", "0.05h"];
   detail medium -> color black. Four fixing holes, one in each corner.
5. bands: along diagonal, up top, period 100, width 0.4, phase 0, offset "-0.212w-0.143"
   -> shade 0.6. A bent corner in shade, its legs 0.08 plus a fifth of the width.
6. bands: along diagonal, up top, period 100, width 0.008, phase 0, offset "-0.212w+0.057";
   detail medium -> shade 1.6. The lit crease of that corner.
7. bands: along diagonal, period 0.37, width 0.003; detail fine -> color bare metal, metalness
   1, roughness 0.7. Scratches, 1 % of the face.
8. noise: wavelength [0.2, 0.2], threshold 0.7, softness 0.2; wear -> color rust, roughness
   0.9. Rust.

`litter/pallet`. Body: roughness 0.85. 6 layers, one `noise`. Sides: rectangle from ["-0.5w",
0.025] to ["0.5w", "1h-0.025"] -> shade 0.15, the openings; bands along across, period "0.46w",
width 0.1, phase 0, in the same clip -> paint 1, the three blocks.

1. cells: width "1w", height 0.1, gap 0.045, fit both -> shade 0.2, jitter low 0.8, high 1.2.
   Deck boards with dark gaps.
2. dots: pitch ["0.44w", 0.145], fit up, radius 0.006, phase [0, 0.5]; detail fine -> shade
   0.35. Nails over the three stringers.
3. rectangle: from ["-0.5w", "0.5h"] to ["0.08w", "0.5h+0.14"] -> shade 0.2. A board broken
   out.
4. noise: wavelength [0.3, 0.3], threshold 0.6, softness 0.3; wear -> shade 0.65. Dirt.

`litter/tool`. Body: roughness 0.5. 7 layers. Sides: face -> shade 0.45.

1. bands: along up, period 0.02, width 0.007; clip ["-0.5w", 0.02] to ["0.5w", "0.38h"]
   -> shade 0.55. Grip ribs.
2. rectangle: from ["-0.5w", "0.42h"] to ["0.5w", "1h"] -> color galvanised grey. The shaft,
   as paint.
3. rectangle: from ["-0.5w", "0.38h"] to ["0.5w", "0.42h"] -> color black. Collar.
4. rectangle: from ["-0.5w", "1h-0.05"] to ["0.5w", "1h"] -> color switch grey. Head.
5. rectangle: from ["-0.5w", "1h-0.05"] to ["0.5w", "1h"]; wear -> color bare metal, metalness
   1, roughness 0.7. The break: at a wear of 1 the head is sheared off and the shaft ends
   bright; at 0 the head stays.
6. rectangle: from [-0.003, "0.42h"] to [0.003, "1h-0.05"]; detail fine -> color bare metal,
   metalness 1, roughness 0.7. The shaft's highlight.

`litter/tray`. Body: roughness 0.6. 8 layers. Sides: rectangle from ["-0.22w", "0.5h-0.006"] to
["0.22w", "0.5h+0.006"]; detail medium -> color bare metal, metalness 1, roughness 0.7, the
handle.

1. rectangle: from ["-0.5w+0.03", 0.03] to ["0.5w-0.03", "1h-0.03"] -> color `#16181b`. The
   liner; the rim keeps the tint.
2. bands: along across, period "0.18w", width "0.07w", phase 0; clip ["-0.5w+0.04", "0.1h"] to
   ["0.5w-0.04", "0.68h"] -> color galvanised grey. Five tools.
3. The same bands; clip to "0.3h" -> color worn yellow. Their grips.
4. dots: pitch ["0.15w", 2], radius "0.05w", phase [0.5, 0], offset [0, "0.84h"]; clip
   ["-0.5w+0.04", "0.76h"] to ["0.5w-0.04", "1h-0.04"] -> color galvanised grey. Six sockets in
   one row: the pitch along the tray is longer than any tray.
5. The same dots, radius "0.022w"; detail medium -> color black. Their bores.
6. rectangle: from ["-0.5w+0.03", "0.73h"] to ["0.5w-0.03", "0.73h+0.008"]; detail medium
   -> paint 1. Divider.
7. border: width 0.005; detail medium -> shade 1.35. Rolled rim.

What the recipes give up: a recipe cannot tear an edge, so a broken tool is a shorter box with a
bright end and a broken pallet a piece. Every pallet misses the same board, every plate bends
the same corner and every tray holds the same tools. The yaw, the size, the tint, the seed and
the wear tell the pieces apart.

## 4. Values

Computed at the first art pass's lights. A top returns 0.44 of its mean albedo in that
environment, and a point adds its candela times the cosine over pi times the squared distance,
with the range's falloff. That sum gives the two floors 0.054 and 0.041. A pool by it shows 1.37
times the floor; a value in brackets scales the points to a pool of 1.5 times the floor. A mean
is a swatch of the top on the painter's number back end, written as albedo -> luminance.

- Paper (0.37), between the ladder's mid and signal steps: its top prints 0.31 near and 0.33
  far -> 0.14 to 0.15. Under the yard's point of 65 cd it shows 0.23 (0.27) on the slab. On the
  lid of `yard-crate-3`, the level's brightest top, it shows 0.29 (0.35), and its bare paper
  0.34 (0.41). Copy yellow: 0.27 -> 0.12.
- Card (0.24), mid: 0.20 -> 0.09; in the yard 0.15.
- Plate, just above mid: galvanised grey 0.24 -> 0.105, in the yard 0.18 (0.21); worn
  yellow 0.19 -> 0.085; housing grey 0.175 -> 0.077.
- Pallet (0.23), mid: 0.155 -> 0.068, its boards 0.10; in the yard 0.12.
- Tool, a small signal: a whole tool with a safety yellow grip 0.25 -> 0.11, with a red one
  0.15 -> 0.064, a roller 0.175 -> 0.077, a long broken tool with a red grip 0.18 -> 0.08. On
  the brightest deck, `line-e-conv-1`, the yellow tool shows 0.15. A break is bare metal and
  mirrors the hall.
- Tray, dark with a rim: 0.08 to 0.09 -> 0.04; its steel 0.25 -> 0.11.

Beside them the front floor shows 0.054, the slab 0.041, a floor line 0.107 and a tube 0.31.
Paper is the lightest litter: 2.5 times the front floor on a top, and 0.41 as bare paper under
the strongest point, 55 % of the bloom threshold of 0.75.

On the finish sheet a path's page stands on its largest piece, with the mean of each face:

- `litter.paper.png`: a card 0.9 by 1.3, its top 0.192 and its side 0.071.
- `litter.plate.png`: a plate 1.0 by 1.4, its top 0.236 and its cut edge 0.335.
- `litter.pallet.png`: a crate lid in the crates' brown, its top 0.127. Its side is plain: a lid
  0.05 high leaves no room for the openings.
- `litter.tool.png`: a long broken tool with a red grip, 0.07 by 0.8, its top 0.182. Its far
  end shows the break.
- `litter.tray.png`: a red tray 0.6 by 0.8, its top 0.077 and its side 0.099.

The paper tint and a pallet's side with its blocks show on no page. They are read on swatches
from the painter's number back end.

## 5. Where the litter lies

"Everywhere" means that no view along a lane or a line looks swept. The density is highest
where a player walks and looks down: at the player spawn, in the aisle and on the lines. P is
paper, C card, M plate, W pallet, T tool and Y tray.

On the front floor, 91 pieces. Around the player spawn and down the aisle:

- `apron`, 17: x -4.5 to 4.5, z -27.3 to -18. P6 in one fan from a dropped sheaf at (1.5,
  -24.3) toward the ramp, C1 M3 W2 T4 Y1, three of the tools long and strewn from the dumped
  tray. The first frame: the player spawn looks over it to the ramp, 1 to 6 m ahead.
- `apron-flanks`, 6: |x| 5 to 10.5, z -26.8 to -15.5, around the two skew fences. P2 M2 W2.
  Seen leaving the spawn toward either outer walk.
- `aisle-north`, 12: x -3.9 to 3.9, z -14.5 to -1. The spill of both first conveyors across
  the aisle lines: P2 C1 M3 W1 T4 Y1, the tools two rollers and two long broken tools. From
  the player spawn turned to +Z, in the light of the fill at z -6.8.
- `aisle-mid`, 11: z -1 to 9. P3 M2 W1 T4 Y1. Between the housings, by the fill at z 1.7.
- `aisle-south`, 11: z 9 to 20. P2 C1 M3 W1 T3 Y1. Both +z minion spawns look up the aisle
  through it.

At the sealed end and outside the lines:

- `dock`, 8: x -8 to 8, z 20.5 to 27.2. P3 C2 M1 W2. The first frames of both +z spawns, under
  the gate strips.
- `walk-east`, 8: x 7.5 to 11, z -14 to 20. P1 C1 M3 W1 T2. The lane of the `+x+z` spawn,
  outside the east line's box.
- `walk-west`, 8: x -9.6 to -7.5, z -14 to 20. P2 C1 M2 W1 T1 Y1. The lane of the `-x+z` spawn,
  outside the west line's box.
- `east-stock`, 5: x 11 to 13.4, z -2.5 to 6.5 and 17.5 to 20. P1 C1 M2 W1. Stock pulled apart
  beside `jib-east`.
- `west-stock`, 5: x -13 to -9.9, z -2.5 to 4.2, 7.6 to 9.8 and 17.4 to 20. P1 C1 M1 W2. The
  same beside `jib-west`.

On the raised slab, 55 pieces:

- `ramp-top`, 8: x -12 to 5, z -34 to -29.7, clear of the posts. P4 C1 M2 W1. In the first
  frame, up the ramp.
- `fall-lane`, 9: x -6.9 to -2.9, z -46 to -34.5. P3 M2 W1 T2 Y1. The lane from the ramp to the
  yard, under `strip-lane`.
- `fall-yard`, 5: x -14.1 to -11, z -45.7 to -37. P1 M2 W2. Behind the fall's containers, seen
  from the ramp's top.
- `yard-court`, 14: x -8 to 12.5, z -64.5 to -47.6, between the containers. P6 C2 M3 W2 Y1. The
  far end of the opening view, under the yard's point of 65 cd.
- `east-strip`, 5: x 12.2 to 14.9, z -47 to -31, and x 13.7 to 14.9, z -83 to -66. P2 C1 M1 W1.
  The lane of the `+x-z` spawn.
- `back-lane`, 10: x -13 to -3.5, z -89 to -66. P5 C1 M2 W2. The first frame of the `-x-z`
  spawn, in the amber pool.
- `back-east`, 4: x 9 to 15.8, z -89.4 to -81.6. P2 M1 W1. The first frame of the `+x-z` spawn.

On tops, 54 pieces, each with `on`:

- `on-lines`, 34, on the six decks: `line-w-conv-1` 8, `line-w-conv-2` 4, `line-w-conv-3` 6,
  `line-e-conv-1` 8, `line-e-conv-2` 5 and `line-e-conv-3` 3. T14 Y8 P7 M5. A player beside a
  line looks down on tools and trays against the lit bars, with papers and plates among them.
  Four plates overhang a deck's edge.
- `on-tops`, 20. On lids: `apron-crate-2`, `west-crate-3`, `west-crate-5`, `east-crate-1`,
  `east-crate-3`, `fall-crate-6`, `yard-crate-2`, `yard-crate-3`, `lane-crate-3` and
  `east-wall-crate-1`. On stacks: `ramp-stack-2`, `east-stack-2`, `west-stack-2`,
  `yard-stack-3` and `fall-stack-3`. P7 T5 Y3 M3 C2.

In all: paper 60, card 16, plate 43, pallet 24, tool 39 and tray 18. Of the tools 26 are
broken and three are rollers. The floor holds 20 tools, 16 of them broken and 12 of those
long. By path: `litter/paper` 76, `litter/plate` 43, `litter/pallet` 24, `litter/tool` 39 and
`litter/tray` 18.

## 6. Limits

- Height: a pallet is 0.14 and every other piece 0.10 or lower, under the litter's 0.15.
- Longer plan side: 1.4 at most, under the litter's 1.5.
- Floor litter on the front floor keeps its outline at z -27.9 or higher, and on the slab at z
  -29.6 or lower, so none lies on the ramp or across the slab's edge.
- Nothing stands or stacks: a pallet lies single and flat, and no pile tops out above 0.14. No
  piece gives cover, blocks a path or stands in a sight line.
- Floor litter enters no prop and no part of the stage, and lies under none lower than 5.5.
- On a top a piece is smaller than the top. Only a plate or a tray overhangs, by a third of
  its area at most, and it enters no neighbouring prop.
- A piece keeps 1 m from every spawn point.

## 7. What makes it read as wrecked

- No litter lies square: every yaw is 8 degrees or more off the hall's axes, and neighbours
  differ. Every prop but two fences stands square, so the litter alone is askew.
- A spill has a source: a fan thins out from a line into the aisle, a dropped sheaf fans from
  one point, and broken tools lie around a dumped tray.
- Things lie where they do not belong: papers and trays on the beds, tools on lids, rollers on
  the floor, and litter across the yellow lines, so the plant's order shows under the mess.
- Piles: pieces overlap at different yaws. Their tops lie 0.01 or more apart, so none
  flickers against another.
- Broken things: tools sheared off at the head, a pallet with a board out, pallet pieces, a
  lid off its crate, a plate with a bent corner, a plate that overhangs a deck.
- Density is uneven: wrecked stations and thin trails, never an even carpet.

## 8. Cost and the first cut

- The 200 boxes add 2,400 triangles and five programs at the view's start. Each box is one
  draw.
- No recipe holds more than 9 layers. Paper, plate and pallet hold one `noise` each, for wear;
  tool and tray hold none. The caps are 24 layers and two `noise` layers.
- Bare metal is line work: a plate's cut edges and scratches, a tool's highlight, a tray's
  handle. The one patch is a broken tool's break, 0.05 long on a face 0.05 to 0.08 wide.

If the owner reads a lower frame rate, the first cut takes 44 pieces and leaves 156: `on-tops`,
`back-east`, `east-strip`, `fall-yard`, `east-stock` and `west-stock`. The spawn, the aisle,
the lines and the yard keep their litter.

## 9. Not checked

- Any recipe under the level's lights or on a GPU. Every luminance is computed.
- The glare of the bare metal on plates, tools and trays under a point.
- The cost of 200 draws. The owner reads the frame rate.
- The `fine` marks on a page of the finish sheet: at 5 mm per pixel a mark under 5 mm shows
  as a tone. They are read on swatches of 1 to 3 mm from the painter's number back end.
- Whether a box 0.02 high reads as paper, and whether the litter reads as lying on the floor
  when the walk passes through it.
- Depth fighting of a thin box against the floor at a distance.
- A litter whose prop is destroyed. It goes with the slab it lies on at adoption; the QA app
  shows no damage.
