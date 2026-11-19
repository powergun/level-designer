# Painter recipes: the ten finishes and the floor lines

The recipes of every role of the ten finishes, and the floor lines, as the art team types them
in the art passes of TASK-001.07. The painter briefs beside this note explain how to read them
and rank the finishes. A hall luminance in brackets is computed at the lights of the first art
pass, an environment of intensity 7; `docs/LOOK-AND-LIGHTING.md` gives the level's present levels.

## 4. The recipes

Every body has shade 1 and metalness 0 unless stated.

### 4.1 Corrugated: container steel and cladding

Cut: metal, bare metal. Roles of the kit: `side`, `end`, `door`, `roof`. The finish also holds
the seals' roles, `cladding`, `gate`, `slats`, `shutter` and `roller`; the seals brief beside
this note, `look-dev-seals-brief.md`, owns their recipes, their values and the seals' records.

`corrugated/end`, the blind end and the base of `side`. Body: roughness 0.6.

1. bands: along across, period 0.28, width 0.07, ramp 0.07 -> shade 0.72, roughness 0.7. Grooves;
   a crest lies on the centre line.
2. noise: wavelength [0.07, 0.9], threshold 0.85, softness 0.1; clip ["-0.5w+0.12", 0.16] to
   ["0.5w-0.12", "1h-0.12"]; wear -> color rust, roughness 0.9. Rust runs on the corrugated field.
3. rectangle: from ["-0.5w", 0.2] to ["0.5w", 0.6] -> shade 1.15. Scuff band.
4. border: width ends 0.12, top 0.12, base 0.16 -> paint 0.9. Posts and rails over the corrugation.
5. rectangle: from ["-0.5w", 0] to ["0.5w", 0.3] -> shade 0.8. Floor dirt, on the bottom rail too.
6. rectangle: across ends; from [0, 0] to [0.17, 0.12] -> shade 0.6. Lower corner castings.
7. rectangle: across ends, up top; from [0, 0] to [0.17, 0.12] -> shade 0.6. Upper castings.
8. face: on inside -> color `#3a2f2b`. Dark primer.

`corrugated/side`, extends `end`.

1. rectangle: across out; from [0.85, 0.03] to [1.21, 0.13] -> shade 0.25. Fork pockets.
2. glyphs: at ["0.5w-0.30", "1h-0.32"], height 0.10, text "FLCU######", align end; detail medium
   -> color white. The code, at the top right.

`corrugated/door`. Body: roughness 0.6.

1. bands: along up, period 0.42, width 0.02, phase 0; detail medium -> shade 0.75. Five pressings,
   none at the handles' height.
2. rectangle: from [-0.01, 0] to [0.01, "1h"] -> shade 0.4. Leaf seam.
3. bands: along across, period 0.585, width 0.035 -> color galvanised grey. Four lock rods, at
   0.29 and 0.88 either side of the centre line.
4. bands: along across, period 0.585, width 0.28; clip ["-0.5w", 1.03] to ["0.5w", 1.07] -> color
   bare metal, metalness 1, roughness 0.7. Handles.
5. rectangle: from [-0.70, 0.68] to [-0.50, 0.82]; amount 0.6 -> color white. Plate.
6. border: width ends 0.10, top 0.12, base 0.16 -> paint 0.9. Frame.
7. layers 5 to 7 of `end`. Floor dirt and corner castings.
8. dots: pitch [2.22, 0.65], radius 0.05, phase [0.5, 0], offset [0, 0.30]; detail medium
   -> shade 0.6. Hinges, four on each post, drawn after the frame's paint.
9. face: on inside -> color `#3a2f2b`. Dark primer.
10. glyphs: at [0.25, "1h-0.40"], height 0.085, text "FLCU######"; detail medium -> color white.
    The code, on the right leaf.

`corrugated/roof`. Body: shade 1.1, roughness 0.8. No layer.

- Parameters the author sets: the tint; `door`, the end a player comes close to; `number`; `wear`.
- Tints: blue `#2c4764` (0.060), green `#3c4a33` (0.061), red `#6d3f31` (0.070), grey `#4a4e52`
  (0.075), ochre `#6a5a2a` (0.105). A side prints 0.93 of its tint and a door about 1.1 times it.
- Ladder: dark. Body 0.05 to 0.12 (side 0.012 to 0.03); numerals 0.5; rods 0.25.
- Lit: none. Wear needs the rust runs, the scuff band and the dirt.
- Layers: 10 on `side`, with one `noise` and one legend; 12 on `door`.
- From: Known for containers.

### 4.2 Housing: painted sheet steel

Cut: metal, bare metal. Light: pale cyan. Roles of the kit: `machine`, `machine-plate`,
`cabinet`, `skirt`, `pedestal`, `hoist`, `top`. Every body but the top's has roughness 0.7: by
`docs/LOOK-AND-LIGHTING.md`, the first art pass's points pass the bloom threshold with a
highlight on a fifth of the standing places at 0.6 and on none from 0.7.

`housing/machine`. Bays fitted at 1.25: a window, three points and a handle in each.

1. bands: along up, period 0.04, width 0.02, phase 0; clip ["-0.5w", 0.30] to ["0.5w", 0.54]
   -> shade 0.6. Louvre strip of six slots.
2. dots: pitch [1.25, 0.10], fit across, radius 0.02, phase [0.5, 0], offset [0.40, 1.60]; clip
   ["-0.5w", 1.57] to ["0.5w", 1.83] -> color "glow", lit 1. Status points beside each window.
3. bands: along across, period 1.25, fit, width 0.66; clip ["-0.5w", 1.42] to ["0.5w", 1.98]
   -> shade 1.15. Window frames, one in the middle of each bay.
4. bands: along across, period 1.25, fit, width 0.60; clip ["-0.5w", 1.45] to ["0.5w", 1.95]
   -> color glass, roughness 0.15, lit 0. Windows.
5. bands: along across, period 1.25, fit, width 0.03, phase 0.125; clip ["-0.5w", 0.96] to
   ["0.5w", 1.14]; detail medium -> color bare metal, metalness 1, roughness 0.7. Handles.
6. rectangle: from ["-0.5w", 1.15] to ["0.5w", 1.35] -> shade 0.5. Recess behind the glow band,
   drawn always.
7. rectangle: from ["-0.5w", 0] to ["0.5w", 0.12] -> shade 0.6. Kick band.
8. rectangle: up top; from ["-0.5w", 0] to ["0.5w", 0.06] -> shade 1.1, roughness 0.8. Cap.
9. bands: along across, period 1.25, fit, width 0.015, phase 0; detail medium -> shade 0.5. Seams.
10. noise: wavelength [0.6, 0.6]; wear -> shade 0.8, roughness 0.9. Dust. Optional.

`housing/machine-plate`, the +X side, extends `machine`.

1. rectangle: from ["-0.5w+0.20", 0.80] to ["-0.5w+0.54", 0.94] -> color white. ID plate, beside
   the first handle.
2. glyphs: at ["-0.5w+0.37", 0.82], height 0.10, text "###", align centre; detail medium
   -> color black. Station number.

`housing/cabinet`, on enclosures up to 1.2 wide. Bays fitted at 0.75: a screen, three points
and a handle in each.

1. bands: along up, period 0.04, width 0.02, phase 0; up top; clip ["-0.5w", 0.10] to
   ["0.5w", 0.30] -> shade 0.6. Louvre of five slots under the top.
2. bands: along across, period 0.75, fit, width 0.30; clip ["-0.5w", 1.45] to ["0.5w", 1.65]
   -> color "glow", lit 1. Screens.
3. bands: along up, period 0.04, width 0.015, phase 0.25; clip ["-0.5w", 1.45] to ["0.5w", 1.65]
   -> lit 0. Data rows. They cut the light and leave the paint between the screens alone.
4. dots: pitch [0.75, 0.07], fit across, radius 0.02, phase [0.5, 0], offset [0.25, 1.48]; clip
   ["-0.5w", 1.45] to ["0.5w", 1.65] -> color "glow", lit 1. Status points beside each screen.
5. bands: along across, period 0.75, fit, width 0.03, phase 0.125; clip ["-0.5w", 0.96] to
   ["0.5w", 1.14]; detail medium -> color bare metal, metalness 1, roughness 0.7. Handles.
6. layers 6 to 9 of `machine`, with period 0.75 in the seams.

`housing/skirt`. The top 0.08 lies behind the edge strip.

1. rectangle: from ["-0.5w", 0.10] to ["0.5w", "1h-0.10"] -> shade 0.5. Inset panel.
2. rectangle: from ["-0.5w", 0] to ["0.5w", 0.06] -> shade 0.3. Foot shadow.
3. bands: along across, period 1.25, fit, width 0.02, phase 0 -> color bare metal, metalness 1,
   roughness 0.7. Leg posts.

`housing/pedestal`.

1. rectangle: from ["-0.5w", 0] to ["0.5w", 0.12] -> shade 0.6. Kick band.
2. rectangle: from ["-0.5w", 0.12] to ["0.5w", 0.20] -> color worn yellow.
3. bands: along diagonal, period 0.20, width 0.10; clip ["-0.5w", 0.12] to ["0.5w", 0.20]
   -> color black. Warning bars.
4. border: width 0.03 -> shade 0.6. Door outline.
5. glyphs: at [0, 0.55], height 0.10, text "##", align centre; detail medium -> color white.

`housing/hoist`. The kit paints a hoist in its crane's colour, so the recipe paints the blue.

1. face: on all -> color `#2f5f9e`.
2. bands: along across, period 0.6, fit, width 0.015, phase 0; detail medium -> shade 0.5. Seams.
3. rectangle: on sides; from ["-0.3w", "0.3h"] to ["0.3w", "0.7h"] -> color white. Plate, without
   a legend: the trolley's number has two digits and the jib hoist's one.

`housing/top`. Body: shade 1.1, roughness 0.8. No layer.

- Parameters the author sets: the tint, `#73767a` on enclosures and pedestals; `number`; `wear`.
  A skirt takes its conveyor's colour. An enclosure's yaw turns its +X side, with the plate,
  toward the aisle.
- Ladder: mid for housings: 0.18 (side 0.043, top 0.087). Hoist blue 0.11 (side 0.027). A skirt
  keeps the conveyor's 0.041 (side 0.010), under the dark step: its posts and its strip carry
  it. Glass 0.004.
- Lit: status points and screens, at the prop's glow. On a prop without a glow they take the
  pale cyan as paint.
- Wear needs nothing: the kick band and the cap carry it. It can do without the noise.
- Layers: 12 on `machine-plate`, with one `noise` and one legend.
- Heights: a machine's window clears the cap from a height of 2.1, and a cabinet's louvre
  clears the screens from 2.05.
- The level draws the housings as the owner passed them: no `border`, no `glyphs`, no inside
  primer, and the hoist's blue as a `rectangle` that passes the face on every side. The
  pedestal's door outline waits for the owner's word.
- From: blue lines, teal aisle, machine bay.

### 4.3 Beam: painted structural steel

Cut: metal, bare metal. Light: pale cyan. Roles of the kit: `girder`, `runway`, `flange`,
`truck`, `hook`, `plinth`, `mast`, `mast-front`, `boom`, `tie`.

`beam/girder`. Body: roughness 0.5. The web is 1.25 high. Above a span of 20.3 m it is two faces
that butt at mid-span, 14.535 m each on the level. Each face draws the whole recipe, so no mark
hangs on a face's end.

1. bands: along across, period 1.5, fit, width 0.03, phase 0; detail medium -> shade 0.85.
   Stiffeners. Optional. The lines that meet at mid-span are the splice.
2. rectangle: from ["-0.5w", 0] to ["0.5w", 0.02] -> shade 0.8. Weld line.
3. rectangle: from [-0.21, "0.25h"] to [1.39, "0.75h"] -> color white. Plate.
4. disc: at [-0.95, "0.5h"], radius "0.35h" -> color white. The number's disc, left of the plate;
   the pair stands centred on a face.
5. glyphs: at [0.59, "0.3h"], height "0.4h", text "##t", skip 1, align centre -> color black.
   Capacity on the plate.
6. glyphs: at [-0.95, "0.3h"], height "0.4h", text "#", align centre -> color black. Crane number
   on the disc.

`beam/runway`. Body: roughness 0.5.

1. bands: along diagonal, period 0.20, width 0.10; across ends; clip [0, 0] to [0.40, "1h"]
   -> color black. End bars.
2. rectangle: up top; from ["-0.5w", 0.03] to ["0.5w", 0.07] -> color red. Conductor line.

`beam/truck`. Body: roughness 0.5.

1. bands: along diagonal, period 0.20, width 0.10; on all -> color black. Warning bars.
2. disc: across ends; at [0.45, "0.5h"], radius 0.14 -> color black. Hubs.
3. rectangle: across ends; from [0, 0] to [0.08, "1h"] -> color black. Buffers.

`beam/hook`: bands: along diagonal, period 0.20, width 0.10; on all -> color black.
`beam/plinth`: the same bars on edges; its top stays plain.

`beam/mast`. Body: roughness 0.5.

1. rectangle: from ["-0.5w", 0] to ["0.5w", 0.04] -> shade 0.6. Base plate.
2. rectangle: on all; up top; from ["-0.5w", 1.40] to ["0.5w", 1.60] -> color black. Slewing band,
   under the boom, on the panels' end edges too.

`beam/mast-front`, the +X panel, extends `mast`.

1. rectangle: from [-0.11, 0.50] to [0.11, 0.82] -> color switch grey. Switch box.
2. disc: at [-0.05, 0.72], radius 0.015 -> color "glow". disc: at [0.05, 0.72], radius 0.015
   -> color red. Its two lamps, as paint.
3. disc: at [0, 1.01], radius 0.06, diamond -> color worn yellow. disc: at [0, 1.01], radius 0.03,
   diamond -> color black. Warning label.
4. rectangle: from [-0.05, 1.12] to [0.05, 1.26] -> color white. Label.

`beam/boom`. Body: roughness 0.5.

1. bands: along diagonal, period 0.20, width 0.10; on sides; across ends; clip [0, 0] to
   [0.25, "1h"] -> color black. End bars on both faces: a boom shows both.
2. glyphs: at [0, "0.5h-0.10"], height 0.20, text "#t", align centre -> color black. Capacity.

`beam/flange` and `beam/tie`: no layer.

- Parameters the author sets: the tint (`#d39b12`); the runway colour (`#1f4f8f`); `capacity`
  and `number`; `wear`.
- Ladder: signal. Yellow 0.37 (web 0.09, underside 0.036); black 0.005; white 0.5 (0.12); runway
  blue 0.078 (0.019); red 0.085.
- Lit: none; a crane has no glow. Wear needs nothing overhead.
- Layers: 8 on `mast-front`; 6 on `girder`, two of them legends; no `noise`.
- From: three cranes, crane shop, double girder, the jib images.

### 4.4 Bed: the conveyor's top

Cut: metal, bare metal. Light: pale cyan. Role of the kit: `deck`. The deck's `outside` is its
top, and `up` runs along the conveyor.

`bed/deck`. Body: shade 0.45, roughness 0.5. The tint is the conveyor's colour.

1. bands: along up, period 0.10, width 0.02 -> color ring grey. Roller crests.
2. bands: along up, period 0.10, width 0.015, phase 0 -> shade 0.2. Gaps between rollers.
3. bands: along up, period 0.40, width 0.04 -> lit 1. Light bars, in every fourth gap. They keep
   the bed's albedo: the glow's colour as paint would pass the bloom threshold under a lamp.
4. bands: along up, period 2.0, width 0.15 -> paint 0.7, lit 0. Guard plates, each over one bar.
5. rectangle: across ends; from [0, 0] to [0.08, "1h"] -> color ring grey, lit 0. Rails.
6. face: on edges -> color ring grey. The deck's edges read as the rails' sides.

- Parameters the author sets: none beyond the conveyor's colour and glow. The bar period, 0.40,
  is the recipe's.
- Ladder: black. Bed 0.019 (top 0.008); crests and rails 0.11 (0.05); the top prints 0.047; bars
  lit at the conveyor's glow, 0.30.
- Lit: the bars, 7 % of a deck. Wear: none.
- Bare-metal rails wait for the owner's word. At 0.08 wide they are 16 % of a deck, and bare
  metal is line work. They are one value away: the colour of layers 5 and 6, with metalness 1
  and roughness 0.7.
- Layers: 6; no `noise`.
- From: blue lines, teal aisle.

### 4.5 Casting: the arm

Cut: metal, `#a9adb0`. Light: pale cyan. Roles of the kit: `shoulder`, `upper-arm`, `forearm`,
`head`. `y` runs from the hinge. `end+` is the edge a right angle above the link's direction:
the forearm's top, and the back of an upper arm that stands at 80 degrees or more.

`casting/forearm`, the base of `upper-arm`. Body: roughness 0.5, the cranes' value. Layers 1 to
4 draw on `sides`, both faces of the link.

1. border: width 0.03 -> shade 1.6. The cast edge that catches the light.
2. disc: at [0, "0.5w"], radius "0.46w", inner "0.29w" -> color ring grey. Hub ring at the hinge.
3. disc: at [0, "0.5w"], radius 0.02 -> color "glow", lit 1. Status point, as a housing's.
4. disc: up top; at [0, "0.5w"], radius "0.36w", inner "0.25w" -> color `#3f4348`. End cap.
5. rectangle: on end+; across out; from [0.04, 0] to [0.10, "1h"] -> color hose grey, roughness
   0.7. Two hoses.
6. bands: on end+; along up, period 0.30, width 0.04 -> color ring grey. Clips.

`casting/upper-arm`, extends `forearm`.

1. disc: at [0, "0.45h"], radius 0.05, diamond -> color worn yellow. disc: at [0, "0.45h"],
   radius 0.025, diamond -> color black. Warning label, on the outside face.

`casting/head`. Body: roughness 0.5. It stands alone: on a head 0.39 long the forearm's ring
would circle the glow accent. Both layers draw on `sides`.

1. border: width 0.03 -> shade 1.6.
2. rectangle: up top; from ["-0.5w", 0] to ["0.5w", 0.06] -> color ring grey. Flange.

`casting/shoulder`. Body: roughness 0.5. Every layer draws on `sides`.

1. border: width 0.03 -> shade 1.6.
2. disc: at [0, "0.5h"], radius "0.45h", inner "0.28h" -> color ring grey.
3. disc: at [0, "0.5h"], radius 0.02 -> color "glow", lit 1.

- Parameters the author sets: the tint (`#1b1e22`). The ring hue is the recipe's.
- Ladder: black. Body 0.013 (side 0.003); ring 0.11 (0.027). A link's face prints 0.03 and the
  shoulder's 0.043.
- Lit: one status point per hub and face, in the arm's glow: 0.39 with its paint.
- Wear: none. Layers: 8 on `upper-arm`; no `noise`.
- From: blue lines, night line; the ringed discs from teal aisle.

### 4.6 Timber

Cut: wood, `#d2b07a`. Roles of the kit: `crate`, `crate-stencil`, `lid`, `stack`. `boards` is a
base role that no slab names. A cell grid of width "1w" is fitted across: unfitted, it starts on
the centre line and draws a joint there.

`timber/boards`. Body: roughness 0.8.

1. cells: width "1w", height 0.12, gap 0.012, fit both -> shade 0.25, jitter low 0.8, high 1.2.
   Boards.

`timber/crate`, the two unstencilled sides, extends `boards`. The painter measures a diagonal
band's `offset` along the band's own coordinate, the sum of the two coordinates over the square
root of two, where the face's centre lies at 0.354 of the height.

1. bands: along diagonal, period 8, width 0.13, phase 0, offset "0.354h" -> paint 1.1. One brace
   through the centre, on every crate.
2. border: width 0.09 -> paint 1.1. Batten frame.

`timber/crate-stencil`, the +X and -X sides, extends `boards`.

1. border: width 0.09 -> paint 1.1. Batten frame.
2. glyphs: at [0, "0.55h"], height 0.12, text "AC####", align centre; detail medium -> shade
   0.25. The code.

`timber/lid`. Body: shade 1.15, roughness 0.85.

1. cells: width 0.12, height "1h", gap 0.012, fit across -> shade 0.25, jitter low 0.8, high 1.2.

`timber/stack`. Body: roughness 0.8. Layers 1 to 5 draw on `sides`, the two long faces. A cell
is its pitch less its gap, so the courses keep step with the spacer gaps, and the board ends
with the courses.

1. cells: width "1w", height 0.042, gap 0.008, fit across -> shade 0.3, jitter low 0.85, high
   1.15. Courses, at a pitch of 0.05.
2. bands: along up, period 0.20, width 0.02, phase 0 -> shade 0.3. Spacer gaps.
3. rectangle: from ["-0.5w", 0] to ["0.5w", 0.08] -> shade 0.3. The gap under the stack.
4. bands: along across, period 1.0, width 0.10, phase 0; clip ["-0.5w", 0] to ["0.5w", 0.08]
   -> paint 0.9. Bearers.
5. rectangle: across out; from [0.985, 0] to [1.015, "1h"] -> color `#3d3e42`, metalness 1,
   roughness 0.7. Straps.
6. cells: on ends; width 0.144, height 0.044, gap 0.006, shift 0.5 -> shade 0.4, jitter low 0.9,
   high 1.3. Board ends.
7. face: on top -> shade 1.1, roughness 0.85.

- Parameters the author sets: the tint; `stencil`; `wear`. The level's tints are `#a06e3c` (0.19)
  on 16 crates and the stacks, and `#8b5f33` (0.14) on 12 crates.
- Ladder: mid. Body 0.19 (side 0.045, top 0.083). A crate's side prints 0.19 and its lid 0.21; a
  stack's side 0.15 and its top 0.21. A tint above 0.19 lifts the lid over the step.
- Lit: none. Wear: none; a dirt band is lost in the boards' jitter.
- Layers: 7 on `stack`, no `noise`; one legend on `crate-stencil`.
- From: twin jibs, machine bay.

### 4.7 Cast concrete

Cut: concrete, `#a3a6a6`. Roles of the kit: `panel`, `wall`, `top`. `barrier` is named by a
partition's `finish`.

`cast-concrete/wall`, on concrete enclosures, the base of `panel`. Body: roughness 0.85. Every
layer draws on `sides`, because a standing panel shows both faces.

1. bands: along up, period 0.7, width 0.02; detail medium -> shade 0.8. Pour lines.
2. dots: pitch [0.60, 0.60], radius 0.015, fit both; detail medium -> shade 0.5. Tie holes, half
   a pitch clear of the edges.
3. border: width 0.02 -> shade 1.15. Chamfer.

`cast-concrete/panel`, on standing precast panels, extends `wall`. On a panel 3 by 2.8 the
pockets and the number lie clear of the pour lines and the tie holes.

1. rectangle: on sides; across out, up top; from [0.69, 0.50] to [0.81, 0.58] -> shade 0.25. Two
   lifting pockets.
2. glyphs: at ["-0.5w+0.25", 1.50], height 0.15, text "P###"; detail medium -> shade 0.5.

`cast-concrete/barrier`. Body: roughness 0.85. Layers 1 to 4 draw on `sides`.

1. rectangle: from ["-0.5w", 0] to ["0.5w", 0.15] -> shade 0.8. Dirt.
2. rectangle: up top; from ["-0.5w", 0] to ["0.5w", 0.20] -> color worn yellow, roughness 0.6.
3. bands: along diagonal, period 0.20, width 0.10; up top; clip ["-0.5w", 0] to ["0.5w", 0.20]
   -> color black. Warning band.
4. disc: across ends, up top; at [0.30, 0.30], radius 0.03 -> color white. Reflectors.
5. face: on edges -> color worn yellow. bands: along diagonal, period 0.20, width 0.10; on edges
   -> color black. The band carried over the top and the ends.

`cast-concrete/top`. Body: shade 1.1, roughness 0.9. No layer.

- Parameters the author sets: the tint (`#777c80`); the partition's `finish`; `number`; `wear`.
- Ladder: mid. Body 0.20 (side 0.048, top 0.088). A panel prints 0.20, a barrier 0.18 and its
  top 0.10; band yellow 0.20 (0.048), black 0.005.
- Lit: none. Wear: the barrier's dirt.
- Layers: 6 on `barrier`, 5 on `panel` with its legend; no `noise`.
- The level's barriers are `lane-barrier` and the four `apron-fence` partitions; the five
  `east-panel` partitions keep `panel`. No slab of the level names `wall` or `top`.
- From: three cranes for the panels; the guards of twin jibs for the band.

### 4.8 Steel stock

Cut: metal, bare metal. Role of the kit: `stack`. `stack-posts` is named by a partition's
`finish`.

`steel-stock/stack`. Body: metalness 0.55, roughness 0.7, where no highlight passes the bloom
threshold. The tint is mill scale (`#474c52`). Layers 1 to 5 draw on `sides`. The primed courses
come first, on the grid of the courses that then draws the gaps over them.

1. cells: width "1w", height 0.044, gap 0.006, fit across, share 0.33 -> color primer, metalness
   0, roughness 0.8. A third of the courses primed.
2. cells: width "1w", height 0.044, gap 0.006, fit across -> shade 0.3, jitter low 0.8, high
   1.2. Plate courses, at a pitch of 0.05.
3. rectangle: from ["-0.5w", 0] to ["0.5w", 0.08] -> shade 0.3. The gap under the stack.
4. bands: along across, period 1.0, width 0.10, phase 0; clip ["-0.5w", 0] to ["0.5w", 0.08]
   -> color `#a8743f`, metalness 0, roughness 0.8. Bearers.
5. rectangle: across out; from [0.985, 0] to [1.015, "1h"]; amount 0.5 -> color bare metal,
   metalness 1, roughness 0.7. Straps.
6. face: on ends -> color primer, metalness 0, roughness 0.8. cells: on ends; the grid of layer 2
   -> shade 0.3, jitter low 0.8, high 1.2. Primed plate ends.
7. glyphs: at [-0.5, 0.5], height 0.10, text "###", align end; detail medium -> color white.
   Chalk.

`steel-stock/stack-posts`, extends `stack`.

1. rectangle: on sides; across ends; from [0.05, 0] to [0.13, "1h"] -> color worn yellow,
   metalness 0, roughness 0.6. Stillage posts.

- Parameters the author sets: the tint; the partition's `finish`; `number`; `wear`.
- Ladder: dark. Scale 0.071 (side 0.017); primer 0.094 (0.023); posts 0.20; chalk 0.5. A side
  prints 0.072 and a plate end 0.086.
- Lit: none. Wear: none.
- Layers: 9 on `stack-posts`, with one legend; no `noise`.
- The level's stacks with posts are `yard-stack-2`, `fall-stack-2` and `east-stack-2`, the stack
  of each pair that faces the aisle.
- From: crane shop, pillar jib.

### 4.9 Block

Cut: brick, `#8f8f8a`. Role of the kit: `wall`.

`block/wall`. Body: roughness 0.85. The tint is the upper paint (`#7d7f7c`). Layers 1 to 3 draw
on `all`, so the dado and the bond turn a fence's ends. A block is its pitch of 0.40 by 0.20
less the joint, so the dado's top lies on a joint.

1. rectangle: from ["-0.5w", 0] to ["0.5w", 1.0] -> color dado. The dado's hue and height are the
   recipe's.
2. cells: width 0.388, height 0.188, gap 0.012, shift 0.5 -> shade 0.6, jitter low 0.94, high
   1.06. Bond.
3. rectangle: up top; from ["-0.5w", 0] to ["0.5w", 0.06] -> shade 1.1. Cap course.
4. face: on top -> paint 1. The top in the upper paint, clear of the dado and the joints.

- Ladder: mid above (0.21, side 0.05), dark below (0.096, side 0.023). A fence 1.3 high prints
  0.12.
- Lit: none. Wear: none. Layers: 4; no `noise`.
- From: the walls of pillar jib and double girder.

### 4.10 Luminaire

Cut: metal, `#b8bcbf`. Roles of the kit: `strip`, `band`.

`luminaire/strip`. Body: metalness 0.55, roughness 0.7, lit 1: the whole batten glows. The tint
is the dark housing (`#1a1c1f`). The slab's `outside` is the lower face and its `ends` are the
two long edges.

1. bands: on sides; along up, period 1.2, fit, width 0.04, phase 0 -> lit 0. Joints between
   lamps, on both faces.
2. bands: on ends; along up, period 1.2, fit, width 0.04, phase 0 -> lit 0. The same joints on
   the long edges: a strip reads by them, and 30 m down the hall an edge shows three times the
   height of the lower face.

`luminaire/band`. Body: metalness 0.55, roughness 0.7, lit 1. No layer: glow bands, edge strips
and accents glow whole.

- Parameters the author sets: the glow. The lamp length, 1.2, is the recipe's.
- Ladder: black housing. A strip emits its glow, 0.31, on all but the joints, 3 % of its length.
- A dark housing with a lens is given up: a lens at roughness 0.3 throws a lamp's highlight over
  the bloom threshold.
- Wear: none. Layers: 2; no `noise`.
- From: teal aisle, blue lines.

### 4.11 Floor lines

Floor lines are layers of the two floors' hall finishes, on `top` in plan coordinates, x then z,
each `-> color` worn yellow: a rectangle between two points, or clipped bands for a pair of lines.
The hall brief beside this note, `look-dev-hall-brief.md`, holds them with the hall's other marks:
the two aisle lines, the band at the ramp's foot, the line on the slab's edge, the box around
each assembly line and the side lines of the yard's four slots.
