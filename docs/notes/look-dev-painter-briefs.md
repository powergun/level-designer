# Painter briefs: the recipes of the eleven finishes

These briefs are the art director's input for the art pass of TASK-001.07. They were
written before the last renaming of recipe keys in the finish format: `shade` was
`value`, `detail` was `tier`, and `across` and `up` were `u` and `v`. The art pass brings
them into line when it types the recipes. The recipes themselves are in
[the painter recipes](look-dev-painter-recipes.md).

Scratch input for the art pass of TASK-001.07. Each finish of
`docs/researches/2026-11-17-dark-factory-look-dev/research-dark-factory-surfaces.md` is written
here as the recipes of its roles, in the words of `finish-format.md` as it stood at 21:08: its
kinds, keys, axes, faces and effects. Every size is in metres and every luminance is linear.
Hall luminances are computed from the authoring guide's figures: a non-metal face returns 0.44 of
its albedo facing up, 0.24 as a side and 0.10 as an underside; the floor shows 0.054 and a tube
0.31. No recipe was typed, built or seen: the sheets of milestone 3 are the first test.

## 1. How the recipes are written

- A layer reads: kind, its keys, the common keys, then `->` and its effects. An axis is named only
  where it is not `x` and `y`; a face only where it is not `outside`.
- A full-width box runs from `"-0.5w"` to `"0.5w"`; a full-height one from 0 to `"1h"`.
- A recipe has no switch and no condition. A mark that some slabs carry is a role the kit names;
  a variant is a second role, and `extends` keeps it short.
- `on` names one face, so a mark that both side faces show is written twice. The recipes say
  "and the same on `inside`" for that.
- A legend's `at` is read as the foot of its start, its centre or its end, by `align`.
- A layer marked `wear` scales with the prop's wear, 0.3 by default. A layer the look can do
  without is marked optional.
- A field takes no tier: `bands` and `cells` filter to their mean by themselves, and a tier
  would fade the field out and change the face's value with distance. A tier is for thin lines
  and numerals only.

### The value ladder

Albedo as linear luminance, with the hall luminance of a side in brackets:

- black: up to 0.02 (0.005): arms, beds, glass, strip housings.
- dark: 0.05 to 0.12 (0.012 to 0.03): containers, skirts, runways, steel stock, seals.
- mid: 0.12 to 0.22 (0.03 to 0.054, the floor's level): housings, concrete, timber, block.
- signal: 0.35 to 0.5 (0.085 to 0.12): crane yellow, white plates and numerals; small or overhead
  areas only.
- lit: an emission of 1 at the prop's glow: 0.30 for the line glow, under the bloom threshold.
- Inside a face, light and dark parts differ by 2 to 1 or more; numerals by 4 to 1.

### The palette

- white `#b8bcbf` (0.50); black `#101010` (0.005); glass `#0b0e10` (0.004).
- safety yellow `#d39b12` (0.37); worn yellow `#9c7618` (0.20); red `#9a2a1c` (0.085).
- bare metal `#9a9da0` with metalness 1 and roughness 0.7; galvanised grey `#868a8e` (0.25).
- rust `#8a4a22` (0.10); primer `#7a4a3e` (0.094); ring grey `#5a5f66` (0.11); dado `#4f5a55`
  (0.096); switch grey `#2a2d30` (0.025); hose grey `#2e3034` (0.03).
- pale cyan `#7ccbd6` (0.52): each finish's `light`, the colour `"glow"` takes on a prop without a
  glow.

### Cost

- Bare metal is line work only, under 2 % of a face. The owner checks it for glare.
- Every recipe stays under 10 hashes of the 16. `cells` spends one and `noise` four; a layer
  written for two faces counts twice. Each noise is wear and optional.
- Girders, runways, end trucks, the trolley and the hook never come nearer than 12 m to an eye on
  the floor. Their recipes hold no thin line but the optional stiffeners.

## 2. Ranking and the first three

By what a finish adds to the resemblance:

1. Housing: the machines of the line at eye level (enclosures, cabinets, skirts, pedestals).
2. Bed: the light in the line.
3. Beam: cranes and jibs, the subject of the layout images.
4. Corrugated: containers and seals, the largest plain faces.
5. Floor lines: in every daylight reference, on the largest surface of both views.
6. Casting: the arms.
7. Cast concrete: the barriers in front of the player spawn, the precast row.
8. Timber: 28 crates and the timber stacks.
9. Steel stock.
10. Luminaire: lamps with joints.
11. Block: the two fences.

The first three to build, corrugated, beam and housing, are confirmed by the two main views.
Measured: the share of the screen each prop group covers in the view sheet's two tiles from the
player spawn, toward the back wall (opening) and toward the sealed end (aisle), 640 by 360 px with
the game's lens. Each group was recoloured in a scratch copy of the description and its tile
compared with the base tile. Percent of the tile, opening then aisle:

- seals 1.39 and 7.49; containers 1.29 and 0.71;
- concrete partitions 3.50 and 0.06;
- enclosures 0.00 and 2.59; conveyors 0.00 and 0.34; arm pedestals 0.00 and 0.31;
- bridge cranes 1.72 and 0.97; runways 0.23 and 0.50; jibs 0.38 and 0.50;
- arms 0.00 and 0.57; crates 0.25 and 0.47;
- metal partitions 0.75 and 0.00; brick 0.52 and 0.00; wood 0.25 and 0.00;
- all props and seals 10.27 and 14.53. The stage covers the rest, the floor most of all.

By finish: Corrugated 2.68 and 8.20; Beam 2.33 and 1.97; Cast concrete 3.50 and 0.06; Housing
0.00 and 3.24 (with the conveyors, whose tops belong to Bed); Timber 0.50 and 0.47; Steel stock
0.75 and 0.00; Casting 0.00 and 0.57; Block 0.52 and 0.00.

- The three cover 74 % of the prop pixels of the two views: 92 % of the aisle view and 49 % of
  the opening view.
- Corrugated alone is 44 %, and the seals are most of it. The seal roles belong to the first
  three.
- Cast concrete lifts the opening view to 83 %, because the four apron barriers stand in front of
  the spawn. It is cheap: build it fourth. Bed comes fifth in the build although it ranks second
  for the look.

## 3. Numerals

- The glyph: seven strokes in a box 0.6 of its height wide, at a pitch of 0.85 of its height, as
  the format states. Each stroke should be 0.14 of the height thick, with gaps of 0.05 where
  strokes meet: the gaps are a stencil's bridges, which is why the numeral reads as plant
  lettering and not as a display.
- The legends and their texts: container code `"FLCU#######"`; crane capacity `"##t"` with `skip`
  1; crane number `"#"`; jib capacity `"#t"`; station number `"###"`; pedestal number `"##"`;
  crate code `"AC####"`; panel number `"P###"`; chalk numerals `"###"`; the gate's digit `"#"`.
- Ink: white on dark paint; black on yellow and white; a darker value of the paint on timber and
  concrete.
- A legend stands on `outside` only and on `x`, never on a mirrored axis.
- A stroke reads while it spans 1.5 px: up to about 47 glyph heights (5 m at 0.10, 14 m at 0.30,
  29 m at 0.62). Legends up to 0.15 take tier b.
- Small print is not glyphs: a plate carries none. No word and no maker's name anywhere.
- The crate and the arm's pedestal need a number from the kit; until they have one their legends
  are left out (design check, cure 3).

## 5. What an author sets

Per prop, beyond today's colours and `glow`; every other value is the recipe's:

- every kind: `wear` and `seed`.
- container: `door`, `number`.
- enclosure: `number`; its yaw turns the plate to the aisle.
- bridge-crane: `capacity`, `number`. jib-crane: `capacity`.
- crate: `stencil`.
- partition: `finish`, `number`.
- seal: `finish`, `number`.
- the level: the floor's rectangles.

## 6. What the recipes give up

Nothing is missing from the kinds: the angle is `bands` along `diagonal`, and the fitted period
is `fit`. Given up, and not asked for:

- bolts on a circle, arrows, wood grain;
- a different mark from bay to bay: every bay of a housing carries the same window, handle and
  points;
- bars and wear on the floor lines: floor layers are rectangles;
- a legend on the trolley and the hoist, which share a role but not a digit count.

## 7. Not checked

- Whether each text parses and lands where it is meant: `"0.5w-0.30"`, a `clip` on `xe` and `yt`,
  `phase` with `fit`, a legend's `at`.
- Whether `diagonal` measures the sum of the two coordinates or the true distance. The recipes
  assume the true distance for bars 0.10 wide; on the sum they take period 0.28 and width 0.14,
  and the brace is already written for the sum.
- The cost of any recipe and any value in the renderer: every hall luminance is computed.
- Which end of a link is its upper edge.
- The screen shares hold for the sheet's two spawn views only, at 640 by 360 px.
