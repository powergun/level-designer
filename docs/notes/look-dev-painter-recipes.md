# Painter recipes: the eleven finishes

The recipes of every role of the eleven finishes, as the art director wrote them for the
art pass of TASK-001.07. The painter briefs beside this note explain how to read them
and rank the finishes. The keys predate the last renaming in the finish format.

## 4. The recipes

Every body has value 1 and metalness 0 unless stated.

### 4.1 Corrugated: container steel and cladding

Cut: metal, bare metal. Roles of the kit: `side`, `end`, `door`, `roof`. Roles for seals:
`cladding`, `shutter`, `gate`.

`corrugated/end`, the blind end and the base of `side`. Body: roughness 0.6.

1. bands: along u, period 0.28, width 0.07, ramp 0.07 -> value 0.72, roughness 0.7. Grooves; a
   crest lies on the centre line.
2. cells: size [0.28, "1h"], shift 0, gap 0, share 0.15; v yt; clip ["-0.5w", 0.12, "0.5w", 1.5];
   wear -> color rust, roughness 0.9. Rust-stained crests.
3. rectangle: from ["-0.5w", 0.2] to ["0.5w", 0.6] -> value 1.15. Scuff band.
4. noise: wavelength [0.6, 0.02]; clip ["-0.5w", 0.2, "0.5w", 0.6]; wear; tier c -> value 0.7.
   Scratches along the box. Optional.
5. rectangle: from ["-0.5w", 0] to ["0.5w", 0.3] -> value 0.8. Floor dirt.
6. border: ends 0.12, top 0.12, base 0.16 -> paint 0.9. Posts and rails over the corrugation.
7. rectangle: u xe; from [0, 0] to [0.17, 0.12] -> value 0.6. Lower corner castings.
8. rectangle: u xe, v yt; from [0, 0] to [0.17, 0.12] -> value 0.6. Upper corner castings.

`corrugated/side`, extends `end`.

1. rectangle: u ax; from [0.85, 0.03] to [1.21, 0.13] -> value 0.25. Fork pockets, on every side.
2. glyphs: at ["0.5w-0.30", "1h-0.32"], height 0.10, text "FLCU#######", align end; tier b
   -> color white. The code, at the top right.

`corrugated/door`. Body: roughness 0.6.

1. bands: along v, period 0.42, width 0.02; tier b -> value 0.75. Pressings.
2. rectangle: from [-0.01, 0] to [0.01, "1h"] -> value 0.4. Leaf seam.
3. bands: along u, period 0.585, width 0.035 -> color galvanised grey. Four lock rods, at 0.29
   and 0.88 either side of the centre line.
4. bands: along u, period 0.585, width 0.28; clip ["-0.5w", 1.03, "0.5w", 1.07] -> color bare
   metal, metalness 1, roughness 0.7. Handles.
5. dots: pitch [2.22, 0.65], radius 0.05, phase [0.5, 0], offset [0, 0.30]; tier b -> value 0.6.
   Hinges, four per leaf.
6. rectangle: from [-0.70, 0.68] to [-0.50, 0.82]; amount 0.6 -> color white. Plate.
7. rectangle: from ["-0.5w", 0] to ["0.5w", 0.3] -> value 0.8. Floor dirt.
8. border: ends 0.10, top 0.12, base 0.16 -> paint 0.9. Frame.
9. glyphs: at [0.25, "1h-0.40"], height 0.085, text "FLCU#######"; tier b -> color white. The
   code, on the right leaf.

`corrugated/roof`. Body: value 1.1, roughness 0.8. No layer.

`corrugated/cladding`, on wall seals. Body: roughness 0.7.

1. bands: along u, period 0.25, width 0.05, ramp 0.05 -> value 0.78. Ribs.
2. bands: along v, period 3.0, width 0.03 -> value 0.7. Sheet laps.

`corrugated/shutter`, on the door and window seals. Body: roughness 0.7.

1. bands: along v, period 0.10, width 0.03 -> value 0.7. Slats.
2. border: ends 0.15 -> value 0.5. Guides.

`corrugated/gate`, on the end wall, extends `cladding`. The seal's `y` starts 0.5 under the
floor, so the gate stands from 0.5 to 5.2.

1. rectangle: from [-3.0, 0.5] to [3.0, 5.2] -> paint 0.9. Gate leaf.
2. bands: along v, period 0.10, width 0.03; clip [-3.0, 0.5, 3.0, 5.2] -> value 0.7. Slats.
3. rectangle: from [-3.0, 0.5] to [3.0, 0.75] -> color worn yellow.
4. bands: along diagonal, period 0.30, width 0.15; clip [-3.0, 0.5, 3.0, 0.75] -> color black.
   Warning bars at the gate's foot.
5. rectangle: u ax; from [3.0, 0.5] to [3.15, 5.2] -> value 0.5. Guides.
6. glyphs: at [0, 5.6], height 1.0, text "#", align centre -> color white. The seal's number.

- Parameters the author sets: the tint (albedo 0.05 to 0.12); `door`; `number`; `wear`; on a seal
  its `finish` and its `number`.
- Ladder: dark. Body 0.05 to 0.12 (side 0.012 to 0.03); numerals 0.5; rods 0.25.
- Lit: none.
- Wear needs the stained crests, the scuff band and the dirt. It can do without the noise.
- Hashes: 1; 5 with the noise.
- Inside face: add `face`, on inside -> color `#3a2f2b`. Dark primer.
- From: Known for containers; the crane shop's cladding for the wall language.

### 4.2 Housing: painted sheet steel

Cut: metal, bare metal. Light: pale cyan. Roles of the kit: `machine`, `machine-plate`,
`cabinet`, `skirt`, `pedestal`, `hoist`, `top`.

`housing/machine`. Body: roughness 0.5. Bays fitted at 1.2.

1. bands: along v, period 0.04, width 0.02; clip ["-0.5w", 0.30, "0.5w", 0.55] -> value 0.6.
   Louvre strip.
2. bands: along u, period 1.2, fit, width 0.66; clip ["-0.5w", 1.42, "0.5w", 1.98] -> value 1.15.
   Window frames, one in the middle of each bay.
3. bands: along u, period 1.2, fit, width 0.60; clip ["-0.5w", 1.45, "0.5w", 1.95] -> color
   glass, roughness 0.15. Windows.
4. dots: pitch [1.2, 0.07], fit u, radius 0.015, phase [0.85, 0], offset [0, 1.75]; clip ["-0.5w",
   1.72, "0.5w", 1.92] -> color "glow", lit 1. Three status points beside each window.
5. bands: along u, period 1.2, fit, width 0.03, phase 0.125; clip ["-0.5w", 1.00, "0.5w", 1.18];
   tier b -> color bare metal, metalness 1, roughness 0.7. Handles.
6. rectangle: from ["-0.5w", 1.15] to ["0.5w", 1.35] -> value 0.5. Recess behind the glow band,
   drawn always.
7. rectangle: from ["-0.5w", 0] to ["0.5w", 0.12] -> value 0.6. Kick band.
8. rectangle: v yt; from ["-0.5w", 0] to ["0.5w", 0.06] -> value 1.1, roughness 0.8. Cap.
9. bands: along u, period 1.2, fit, width 0.015, phase 0; tier b -> value 0.5. Seams.
10. noise: wavelength [0.6, 0.6]; wear -> value 0.8, roughness 0.7. Dust. Optional.

`housing/machine-plate`, the +X side, extends `machine`.

1. rectangle: from ["-0.5w+0.20", 0.80] to ["-0.5w+0.54", 0.94] -> color white. ID plate, under
   the first handle.
2. glyphs: at ["-0.5w+0.37", 0.82], height 0.10, text "###", align centre; tier b -> color black.
   Station number.

`housing/cabinet`, on enclosures up to 1.2 wide. Body: roughness 0.5. Bays fitted at 0.8.

1. bands: along v, period 0.04, width 0.02; v yt; clip ["-0.5w", 0.10, "0.5w", 0.30] -> value 0.6.
   Louvre under the top.
2. bands: along u, period 0.8, fit, width 0.30; clip ["-0.5w", 1.45, "0.5w", 1.65] -> color
   "glow", lit 1. Screens.
3. bands: along v, period 0.04, width 0.015; clip ["-0.5w", 1.45, "0.5w", 1.65] -> lit 0. Data
   rows. They cut the light and leave the paint between the screens alone.
4. dots: pitch [0.8, 0.07], fit u, radius 0.015, phase [0.85, 0], offset [0, 1.75]; clip ["-0.5w",
   1.72, "0.5w", 1.92] -> color "glow", lit 1. Status points.
5. bands: along u, period 0.8, fit, width 0.03, phase 0.12; clip ["-0.5w", 1.00, "0.5w", 1.18];
   tier b -> color bare metal, metalness 1, roughness 0.7. Handles.
6. layers 6 to 9 of `machine`, with period 0.8 in the seams.

`housing/skirt`. Body: roughness 0.5. The top 0.08 lies behind the edge strip.

1. rectangle: from ["-0.5w", 0.10] to ["0.5w", "1h-0.10"] -> value 0.5. Inset panel.
2. rectangle: from ["-0.5w", 0] to ["0.5w", 0.06] -> value 0.3. Foot shadow.
3. bands: along u, period 1.2, fit, width 0.05, phase 0 -> color bare metal, metalness 1,
   roughness 0.7. Leg posts.

`housing/pedestal`. Body: roughness 0.5.

1. rectangle: from ["-0.5w", 0] to ["0.5w", 0.12] -> value 0.6. Kick band.
2. rectangle: from ["-0.5w", 0.12] to ["0.5w", 0.20] -> color worn yellow.
3. bands: along diagonal, period 0.20, width 0.10; clip ["-0.5w", 0.12, "0.5w", 0.20] -> color
   black. Warning bars.
4. border: width 0.03 -> value 0.6. Door outline.
5. glyphs: at [0, 0.55], height 0.10, text "##", align centre; tier b -> color white. Once the
   pedestal has a number.

`housing/hoist`. Body: roughness 0.5.

1. bands: along u, period 0.6, fit, width 0.015, phase 0; tier b -> value 0.5. Seams.
2. rectangle: from ["-0.3w", "0.3h"] to ["0.3w", "0.7h"] -> color white. Plate, without a legend:
   the trolley's number has two digits and the jib hoist's one.

`housing/top`. Body: value 1.1, roughness 0.8. No layer.

- Parameters the author sets: the tint (housings `#73767a`, skirts `#383e42`, hoists `#2f5f9e`);
  `number`; `wear`. An enclosure turns its +X side, with the plate, toward the aisle by its yaw.
- Ladder: mid for housings: 0.18 (side 0.044, top 0.08). Dark for skirts: 0.047. Glass 0.004.
- Lit: status points and screens, at the prop's glow. On a prop without a glow they take the
  pale cyan as paint.
- Wear needs nothing: the kick band and the cap carry it. It can do without the noise.
- Hashes: none; 4 with the noise.
- Inside face: add `face`, on inside -> color `#2b3030`. Dark primer.
- From: blue lines, teal aisle, machine bay.

### 4.3 Beam: painted structural steel

Cut: metal, bare metal. Light: pale cyan. Roles of the kit: `girder`, `runway`, `flange`,
`truck`, `hook`, `plinth`, `mast`, `mast-front`, `boom`, `tie`.

`beam/girder`. Body: roughness 0.5. The web is 1.25 high.

1. bands: along diagonal, period 0.20, width 0.10; u xe; clip [0.10, 0, 0.70, "1h"] -> color
   black. Chevrons at both ends, mirrored.
2. bands: along u, period 1.5, fit, width 0.03, phase 0; tier b -> value 0.85. Stiffeners.
   Optional.
3. rectangle: from ["-0.5w", 0] to ["0.5w", 0.02] -> value 0.8. Weld line.
4. rectangle: from [-0.80, "0.25h"] to [0.80, "0.75h"] -> color white. Plate on the centre line.
5. disc: u xe; at [3.2, "0.5h"], radius "0.35h" -> color white. A disc at each end.
6. glyphs: at ["-0.5w+1.0", "0.25h"], height "0.5h", text "##t", skip 1 -> color `#101828`.
   Capacity at the low end.
7. glyphs: at ["0.5w-1.0", "0.25h"], height "0.5h", text "##t", skip 1, align end -> color
   `#101828`. Capacity at the high end.
8. glyphs: at ["-0.5w+3.2", "0.3h"], height "0.4h", text "#", align centre -> color black. Crane
   number on the low disc.
9. glyphs: at ["0.5w-3.2", "0.3h"], height "0.4h", text "#", align centre -> color black. Crane
   number on the high disc.
10. cells: size [0.3, "1h"], shift 0, gap 0, share 0.4; v yt; clip ["-0.5w", 0, "0.5w", 0.25];
    wear -> value 0.5, roughness 0.35. Grease under the trolley. Optional.

`beam/runway`. Body: roughness 0.5.

1. bands: along diagonal, period 0.20, width 0.10; u xe; clip [0, 0, 0.40, "1h"] -> color black.
   End bars.
2. rectangle: v yt; from ["-0.5w", 0.03] to ["0.5w", 0.07] -> color red. Conductor line.

`beam/truck`. Body: roughness 0.5.

1. bands: along diagonal, period 0.20, width 0.10; on all -> color black. Warning bars.
2. disc: u xe; at [0.45, "0.5h"], radius 0.14 -> color black. Hubs.
3. rectangle: u xe; from [0, 0] to [0.08, "1h"] -> color black. Buffers.

`beam/hook`: bands: along diagonal, period 0.20, width 0.10; on all -> color black.

`beam/plinth`: bands: along diagonal, period 0.20, width 0.10; on edges -> color black. Its top
stays plain.

`beam/mast`. Body: roughness 0.5.

1. rectangle: from ["-0.5w", 0] to ["0.5w", 0.04] -> value 0.6. Base plate.
2. rectangle: v yt; from ["-0.5w", 1.40] to ["0.5w", 1.60] -> color black. Slewing band, under
   the boom.

`beam/mast-front`, the +X panel, extends `mast`.

1. rectangle: from [-0.11, 0.50] to [0.11, 0.82] -> color switch grey. Switch box.
2. disc: at [-0.05, 0.72], radius 0.015 -> color "glow". disc: at [0.05, 0.72], radius 0.015
   -> color red. Its two lamps, as paint.
3. disc: at [0, 1.01], radius 0.06, diamond -> color worn yellow. disc: at [0, 1.01], radius 0.03,
   diamond -> color black. Warning label.
4. rectangle: from [-0.05, 1.12] to [0.05, 1.26] -> color white. Label.

`beam/boom`. Body: roughness 0.5.

1. bands: along diagonal, period 0.20, width 0.10; u xe; clip [0, 0, 0.25, "1h"] -> color black.
2. glyphs: at [0, "0.5h-0.10"], height 0.20, text "#t", align centre -> color black. Capacity.

`beam/flange` and `beam/tie`: no layer.

- Parameters the author sets: the tint (`#d39b12`); the runway colour (`#1f4f8f`); `capacity`
  and `number`; `wear`.
- Ladder: signal. Yellow 0.37 (web 0.09, underside 0.036); black 0.005; white 0.5 (0.12); runway
  blue 0.078 (0.019); red 0.085.
- Lit: none; a crane has no glow.
- Wear needs nothing overhead. It can do without the grease.
- Hashes: none; 1 with the grease.
- From: three cranes, crane shop, double girder, the jib images.

### 4.4 Bed: the conveyor's top

Cut: metal, bare metal. Light: pale cyan. Role of the kit: `deck`.

`bed/deck`. Body: value 0.45, roughness 0.5. The tint is the conveyor's colour.

1. bands: along v, period 0.10, width 0.02 -> color ring grey. Roller crests.
2. bands: along v, period 0.10, width 0.015, phase 0 -> value 0.2. Gaps between rollers.
3. bands: along v, period 0.40, width 0.04 -> color "glow", lit 1. Light bars.
4. bands: along v, period 2.0, width 0.15 -> paint 0.7, lit 0. Guard plates.
5. noise: wavelength [0.8, 0.8], threshold 0.8, softness 0.1; wear -> value 0.5, roughness 0.3.
   Oil. Optional.
6. border: ends 0.08 -> color bare metal, metalness 1, roughness 0.7, lit 0. Rails.
7. face: on edges -> color bare metal, metalness 1, roughness 0.7. The deck's edges read as the
   rails' sides.
8. face: on inside -> paint 0.2. The underside.

- Parameters the author sets: none beyond the conveyor's colour and glow. The bar period, 0.40,
  is the recipe's.
- Ladder: black. Bed 0.02 (top 0.009); crests 0.11 (0.048); bars lit at the conveyor's glow, 0.30.
- Lit: the bars.
- Wear needs nothing. It can do without the oil.
- Hashes: none; 4 with the oil.
- From: blue lines, teal aisle.

### 4.5 Casting: the arm

Cut: metal, `#a9adb0`. Light: pale cyan. Roles of the kit: `shoulder`, `upper-arm`, `forearm`,
`head`. `y` runs from the hinge; `end+` is taken for the link's upper long edge, which the kind
sheet must confirm.

`casting/forearm`, the base of `upper-arm` and `head`. Body: roughness 0.45.

1. border: width 0.03 -> value 1.6. The cast edge that catches the light.
2. disc: at [0, "0.5w"], radius "0.46w", inner "0.29w" -> color ring grey. Hub ring at the hinge.
3. disc: at [0, "0.5w"], radius 0.0125 -> color "glow", lit 1. Status point.
4. disc: v yt; at [0, "0.5w"], radius "0.36w", inner "0.25w" -> color `#3f4348`. End cap.
5. layers 1 to 4 again, on inside.
6. rectangle: on end+; u ax; from [0.04, 0] to [0.10, "1h"] -> color hose grey, roughness 0.7.
   Two hoses.
7. bands: on end+; along v, period 0.03, width 0.012 -> value 0.75. Hose ribs.
8. bands: on end+; along v, period 0.30, width 0.04 -> color ring grey. Clips.

`casting/upper-arm`, extends `forearm`.

1. disc: at [0, "0.45h"], radius 0.05, diamond -> color worn yellow. disc: at [0, "0.45h"],
   radius 0.025, diamond -> color black. Warning label, on the outside face.

`casting/head`, extends `forearm`.

1. rectangle: v yt; from ["-0.5w", 0] to ["0.5w", 0.06] -> color ring grey. Tool flange; and the
   same on inside.

`casting/shoulder`. Body: roughness 0.45.

1. border: width 0.03 -> value 1.6.
2. disc: at [0, "0.5h"], radius "0.45h", inner "0.28h" -> color ring grey.
3. disc: at [0, "0.5h"], radius 0.0125 -> color "glow", lit 1.
4. layers 1 to 3 again, on inside.

- Parameters the author sets: the tint (`#16181b`). The ring hue is the recipe's.
- Ladder: black. Body 0.009 to 0.02 (side 0.002 to 0.005); ring 0.11 (0.027).
- Lit: one status point per hub and face, in the arm's glow.
- Wear: none. Hashes: none.
- From: blue lines, night line; the ringed discs from teal aisle.

### 4.6 Timber

Cut: wood, `#d2b07a`. Roles of the kit: `crate`, `crate-stencil`, `lid`, `stack`. `boards` is a
base role that no slab names.

`timber/boards`. Body: roughness 0.8.

1. cells: size ["1w", 0.12], fit v, shift 0, gap 0.012 -> value 0.25, jitter [0.8, 1.2]. Boards.
2. rectangle: from ["-0.5w", 0] to ["0.5w", "0.33h"] -> value 0.85. Handling dirt.

`timber/crate`, the two unstencilled sides, extends `boards`.

1. bands: along diagonal, period 8, width 0.13, phase 0, offset "0.5h" -> paint 1.1. One brace
   through the centre, on every crate.
2. border: width 0.09 -> paint 1.1. Batten frame.

`timber/crate-stencil`, the +X and -X sides, extends `boards`.

1. border: width 0.09 -> paint 1.1. Batten frame.
2. glyphs: at [0, "0.55h"], height 0.12, text "AC####", align centre; tier b -> value 0.25. Once
   the crate has a number.

`timber/lid`. Body: value 1.15, roughness 0.85.

1. cells: size [0.12, "1h"], fit u, shift 0, gap 0.012 -> value 0.25, jitter [0.8, 1.2].

`timber/stack`. Body: roughness 0.8.

1. cells: size ["1w", 0.05], fit v, shift 0, gap 0.008 -> value 0.3, jitter [0.85, 1.15]. Courses.
2. bands: along v, period 0.20, width 0.02 -> value 0.3. Spacer gaps.
3. rectangle: from ["-0.5w", 0] to ["0.5w", 0.08] -> value 0.3. The gap under the stack.
4. bands: along u, period 1.0, width 0.10, phase 0; clip ["-0.5w", 0, "0.5w", 0.08] -> paint 0.9.
   Bearers.
5. rectangle: u ax; from [0.985, 0] to [1.015, "1h"] -> color `#3d3e42`, metalness 1, roughness
   0.7. Straps.
6. layers 1 to 5 again, on inside.
7. cells: on ends; size [0.15, 0.05], shift 0.5, gap 0.006 -> value 0.4, jitter [0.9, 1.3]. Board
   ends.
8. face: on top -> value 1.1, roughness 0.85.

- Parameters the author sets: the tint (`#a8743f`, albedo 0.12 to 0.22); `stencil`; `wear`.
- Ladder: mid. Body 0.21 (side 0.05, top 0.09); gaps and stencil 0.05.
- Lit: none.
- Wear needs the dirt rectangle only. No noise.
- Hashes: 1 on a crate; 3 on a stack.
- From: twin jibs, machine bay.

### 4.7 Cast concrete

Cut: concrete, `#a3a6a6`. Roles of the kit: `panel`, `wall`, `top`. `barrier` is named by a
partition's `finish`.

`cast-concrete/wall`, on concrete enclosures, the base of `panel`. Body: roughness 0.85.

1. noise: wavelength [0.8, 0.8]; wear -> value 0.7. Mottling. Optional.
2. bands: along v, period 0.7, width 0.02; tier b -> value 0.92. Pour lines.
3. dots: pitch [0.60, 0.60], radius 0.015; tier b -> value 0.5. Tie holes.
4. border: width 0.02 -> value 1.15. Chamfer.

`cast-concrete/panel`, on standing precast panels, extends `wall`.

1. rectangle: u ax, v yt; from [0.69, 0.30] to [0.81, 0.38] -> value 0.25. Two lifting pockets.
2. glyphs: at ["-0.5w+0.25", 1.40], height 0.15, text "P###"; tier b -> value 0.5.
3. layers 2 to 4 of `wall` and the pockets again, on inside.

`cast-concrete/barrier`. Body: roughness 0.85.

1. rectangle: from ["-0.5w", 0.25] to ["0.5w", 0.55] -> value 0.85. Tyre rubs.
2. rectangle: from ["-0.5w", 0] to ["0.5w", 0.15] -> value 0.8. Dirt.
3. rectangle: v yt; from ["-0.5w", 0] to ["0.5w", 0.20] -> color worn yellow, roughness 0.6.
4. bands: along diagonal, period 0.20, width 0.10; v yt; clip ["-0.5w", 0, "0.5w", 0.20]
   -> color black. Warning band.
5. disc: u xe, v yt; at [0.30, 0.30], radius 0.03 -> color white, roughness 0.3. Reflectors.
6. layers 1 to 5 again, on inside.
7. face: on edges -> color worn yellow. bands: along diagonal, period 0.20, width 0.10; on edges
   -> color black. The band carried over the top and the ends.

`cast-concrete/top`. Body: value 1.1, roughness 0.9. No layer.

- Parameters the author sets: the tint (`#7d8286`, albedo 0.12 to 0.22); the partition's
  `finish`; `number`; `wear`.
- Ladder: mid. Body 0.22 (side 0.053, top 0.097); band yellow 0.20 (0.048), black 0.005.
- Lit: none.
- Wear needs the two rectangles of a barrier. A panel can do without the mottling.
- Hashes: none on a barrier; 4 on a panel with the mottling.
- From: three cranes for the panels; the guards of twin jibs for the band.

### 4.8 Steel stock

Cut: metal, bare metal. Role of the kit: `stack`. `stack-posts` is named by a partition's
`finish`.

`steel-stock/stack`. Body: metalness 0.5, roughness 0.6. The tint is mill scale (`#3d3e42`).

1. cells: size ["1w", 0.05], fit v, shift 0, gap 0.006 -> value 0.3, jitter [0.8, 1.2]. Plate
   courses.
2. cells: size ["1w", 0.05], fit v, shift 0, gap 0, share 0.33 -> color primer, metalness 0,
   roughness 0.8. A third of the courses primed.
3. rectangle: from ["-0.5w", 0] to ["0.5w", 0.08] -> value 0.3. The gap under the stack.
4. bands: along u, period 1.0, width 0.10, phase 0; clip ["-0.5w", 0, "0.5w", 0.08] -> color
   `#a8743f`, metalness 0, roughness 0.8. Bearers.
5. rectangle: u ax; from [0.985, 0] to [1.015, "1h"]; amount 0.5 -> color bare metal, metalness
   1, roughness 0.7. Straps.
6. rectangle: u xe; from [0, 0] to [0.06, "1h"] -> value 0.3. Ragged ends.
7. glyphs: at [-0.5, 0.5], height 0.10, text "###", align end; tier b -> color white. Chalk.
8. layers 1 to 6 again, on inside.
9. face: on ends -> color primer, metalness 0, roughness 0.8. cells: on ends; size ["1w", 0.05],
   fit v, shift 0, gap 0.006 -> value 0.3, jitter [0.8, 1.2]. Primed plate ends.
10. border: on top; width 0.03 -> value 0.5. noise: on top; wavelength [0.4, 0.4], threshold
    0.75, softness 0.1; wear -> color rust, roughness 0.9. Rust bloom. Optional.

`steel-stock/stack-posts`, extends `stack`.

1. rectangle: u xe; from [0.05, 0] to [0.13, "1h"] -> color worn yellow, metalness 0, roughness
   0.6. Stillage posts; and the same on inside.

- Parameters the author sets: the tint; the partition's `finish`; `number`; `wear`.
- Ladder: dark. Scale 0.048 (side 0.012); primer 0.094 (0.023); posts 0.20; chalk 0.5.
- Lit: none.
- Wear needs nothing on the faces. The top can do without its rust.
- Hashes: 5; 9 with the rust.
- From: crane shop, pillar jib.

### 4.9 Block

Cut: brick, `#8f8f8a`. Role of the kit: `wall`.

`block/wall`. Body: roughness 0.85. The tint is the upper paint (`#7d7f7c`).

1. rectangle: from ["-0.5w", 0] to ["0.5w", 1.0] -> color dado. The dado's hue and height are the
   recipe's.
2. cells: size [0.40, 0.20], shift 0.5, gap 0.012 -> value 0.6, jitter [0.94, 1.06]. Bond.
3. rectangle: v yt; from ["-0.5w", 0] to ["0.5w", 0.06] -> value 1.1. Cap course.
4. noise: wavelength [0.3, 0.3], threshold 0.85, softness 0.05; wear; tier c -> color `#8f8f8a`.
   Flaked paint. Optional.
5. layers 1 to 3 again, on inside.
6. face: on edges -> value 1.05.

- Ladder: mid above (0.21, side 0.05), dark below (0.096, side 0.023).
- Lit: none. Wear needs nothing. Hashes: 2; 6 with the noise.
- From: the walls of pillar jib and double girder.

### 4.10 Luminaire

Cut: metal, `#b8bcbf`. Roles of the kit: `strip`, `band`.

`luminaire/strip`. Body: roughness 0.6, lit 0. The tint is the dark housing (`#1a1c1f`). The
slab's `outside` is the lower face and its `ends` are the two long edges.

1. face -> lit 1, roughness 0.3. The lens.
2. face: on ends -> lit 1. The long edges stay lit: a strip reads by them, and 30 m down the
   hall an edge shows three times the height of the lower face.
3. bands: along v, period 1.2, fit, width 0.04, phase 0 -> lit 0. Joints between lamps.
4. bands: on ends; along v, period 1.2, fit, width 0.04, phase 0 -> lit 0. The same joints.
5. rectangle: from ["-0.5w", 0] to ["0.5w", 0.05] -> lit 0. rectangle: v yt; from ["-0.5w", 0] to
   ["0.5w", 0.05] -> lit 0. End caps.

`luminaire/band`. Body: lit 1. No layer: glow bands, edge strips and accents stay as today.

- Parameters the author sets: the glow. The lamp length, 1.2, is the recipe's.
- Ladder: black housing; the lens emits the strip glow, 0.31.
- Wear: none. Hashes: none.
- From: teal aisle, blue lines.

### 4.11 Floor lines

`floor.layers`: 19 rectangles in plan, x then z, each `-> color` worn yellow. It shows 0.088 on
the floor, 1.6 times the floor.

1. Aisle lines: from [-2.65, -27.0] to [-2.55, 29.5]; from [2.55, -27.0] to [2.65, 29.5].
2. Cell lines, west: from [-6.65, -14.6] to [-6.55, 19.6]; from [-6.55, -14.65] to [-2.65,
   -14.55]; from [-6.55, 19.55] to [-2.65, 19.65]. East: the same with x mirrored.
3. Ramp foot: from [-12.6, -28.10] to [12.0, -27.80].
4. Slab edge: from [-13.3, -29.50] to [15.0, -29.40].
5. Yard slots, 0.30 outside each container's plan outline:
   - north: from [-5.83, -62.37] to [0.83, -62.27]; from [-5.83, -59.33] to [0.83, -59.23];
   - east: from [4.93, -61.83] to [5.03, -55.17]; from [7.97, -61.83] to [8.07, -55.17];
   - south: from [0.17, -52.77] to [6.83, -52.67]; from [0.17, -49.73] to [6.83, -49.63];
   - west: from [-6.07, -56.83] to [-5.97, -50.17]; from [-3.03, -56.83] to [-2.93, -50.17];
   - wall: from [13.23, -56.20] to [13.33, -49.54].

- The numbers follow the committed description; a prop that moves takes its lines with it.
- From: crane shop, assembly hall, machine bay.

