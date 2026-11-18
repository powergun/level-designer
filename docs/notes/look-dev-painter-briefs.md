# Painter briefs: the ten finishes and the floor lines

These briefs are the art team's input for the art passes of TASK-001.07. Each finish of
`docs/researches/2026-11-17-dark-factory-look-dev/research-dark-factory-surfaces.md` is written
as the recipes of its roles, in the words of `finish-format.md` of the same directory: its kinds,
keys, coordinates, faces and effects. The recipes themselves are in
[the painter recipes](look-dev-painter-recipes.md).

Every size is in metres and every luminance is linear. Hall luminances are computed from the
figures of `docs/LOOK-AND-LIGHTING.md`: a non-metal face returns 0.44 of its albedo facing up,
0.24 as a side and 0.10 as an underside; the floor shows 0.054 and a tube 0.31. The art team reads
a recipe on its page of the finish sheet, which shows albedo only; the owner's browser shows it
under the lights.

## 1. How the recipes are written

- A layer reads: kind, its keys, the common keys, then `->` and its effects. `across`, `up` and
  `on` are named only where they differ from the defaults: from the centre line, from the base
  and `outside`.
- A full-width box runs from `"-0.5w"` to `"0.5w"`; a full-height one from 0 to `"1h"`. A `clip`
  is written as its two corners, `from` then `to`.
- A recipe has no switch and no condition. A mark that some slabs carry is a role the kit names;
  a variant is a second role, and `extends` keeps it short.
- `on` names the faces a layer draws on. A mark that both faces of a slab show draws on `sides`;
  on the inside face it lies behind its place on the outside.
- A legend's `at` is its foot: the low corner at its start, the middle of its base or the low
  corner at its end, by `align`.
- A layer marked `wear` scales with the prop's wear, 0.3 by default. A layer the look can do
  without is marked optional.
- A field takes no `detail`: `bands` and `cells` filter to their mean by themselves, and a
  detail would fade the field out and change the face's value with distance. A detail is for
  thin lines and numerals only: `medium` is gone 15 m away and `fine` 4 m away.
- A fitted period is checked against every face it meets. A face that measures a whole number
  of periods plus one half sits on the edge of the fit's rounding, where a sheet and a frame can
  differ by one bay.

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

- Bare metal is line work only, under 2 % of a face. The owner checks it for glare. A bed's
  rails, 16 % of a deck, are therefore ring grey paint.
- Every recipe stays inside the format's caps: 24 layers, two `noise` layers and three legends,
  the extended role's among them. The longest recipes hold 12 layers, no recipe holds more than
  one `noise` layer, and only the girder holds two legends. Each noise is wear: corrugated's is
  its rust and housing's is its optional dust. The seven finishes of milestone 4 hold none.
- Every painted path is one more program when the view starts, and its layers are drawn on
  every slab that names it. A mark that few slabs carry is a role of its own: `stack-posts`,
  `mast-front`, `machine-plate`.
- Girders, runways, end trucks, the trolley and the hook never come nearer than 12 m to an eye on
  the floor. Their recipes hold four thin lines: the girder's optional stiffeners and its weld
  line, the runway's conductor line and the hoist's seams.

## 2. Ranking and the build order

By what each adds to the resemblance:

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

The build plan orders them by what each milestone draws and shows:

- Milestone 1: housing, the smallest slice with real layers, on `bands`, `rectangle`, `dots` and
  `noise`. The owner passed it so: the pedestal's door outline waits for the owner's word.
- Milestone 2: corrugated on the containers, and beam, with `cells`, `face`, `disc`, `border` and
  the finish sheet.
- Milestone 3: the floor lines, with the hall's other marks.
- Milestone 4: cast concrete, bed, casting, timber, steel stock, luminaire and block.
- Milestone 6: the seal roles of corrugated. Milestone 7: every legend.

The two main views confirm corrugated, beam and housing as the first three prop finishes.
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
- Corrugated alone is 44 %, and the seals are most of it.
- Cast concrete lifts the opening view to 83 %, because the four apron barriers stand in front of
  the spawn.

## 3. Numerals

- The glyph: seven strokes in a box 0.6 of its height wide, at a pitch of 0.85 of its height, as
  the format states. Each stroke should be 0.14 of the height thick, with gaps of 0.05 where
  strokes meet: the gaps are a stencil's bridges, which is why the numeral reads as plant
  lettering and not as a display.
- A letter is one of A, C, E, F, H, J, L, P and U, or `t`. A `#` is a digit of the number.
- The legends and their texts: container code `"FLCU######"`, four letters and the number's six
  digits; crane capacity `"##t"` with `skip` 1; crane number `"#"`; jib capacity `"#t"`; station
  number `"###"`; pedestal number `"##"`; crate code `"AC####"`; panel number `"P###"`; chalk
  numerals `"###"`; the gate's digit `"#"`.
- A recipe holds at most three legends. The girder holds two on each of its faces: its capacity
  on the plate and its number on the disc.
- Ink: white on dark paint; black on yellow and white; a darker value of the paint on timber and
  concrete.
- A legend stands on `outside` only and takes neither `across` nor `up`, so it never reads
  mirrored.
- A stroke reads while it spans 1.5 px: up to about 47 glyph heights (5 m at 0.10, 14 m at 0.30,
  29 m at 0.62). Legends up to 0.15 take the `medium` detail.
- Small print is not glyphs: a plate carries none. No word and no maker's name anywhere.
- A crate and an arm take no `number`: the kit hashes their digits from the prop's seed.

## 5. What an author sets

Per prop, beyond today's colours and `glow`; every other value is the recipe's:

- every kind: `wear` and `seed`.
- container: `door`, `number`.
- enclosure: `number`; its yaw turns the plate to the aisle.
- bridge-crane: `capacity`, `number`. jib-crane: `capacity`.
- crate: `stencil`.
- partition: `finish`, `number`.
- seal: `finish`, `number`, `wear`, `seed`, `glow`.
- the level: the floor lines, as layers of the two floors' hall finishes.

## 6. What the recipes give up

Nothing is missing from the kinds: the angle is `bands` along `diagonal`, and the fitted period
is `fit`. Given up, the first three without being asked for:

- bolts on a circle, arrows, wood grain;
- a different mark from bay to bay: every bay of a housing carries the same window, handle and
  points;
- a legend on the trolley and the hoist, which share a role but not a digit count;
- hose ribs, oil, mottling, flaked paint, tyre rubs and a crate's dirt: each is too fine or too
  faint to read beside the marks that stay;
- a strip's dark housing and lens: the whole batten glows, and only its joints are dark;
- a mark at one end of a split slab. Every face of a split role draws the whole recipe: a girder
  web above a span of 20.3 m and a container's side above 9.84 m are two faces. The girder's web
  therefore carries no chevrons, and the trucks, the runways' ends and the hook mark a crane's
  ends; a container of 12.2 m reads as two 20 foot boxes end to end. Such a mark waits for a role
  per run, which nobody builds before the owner has seen the cranes.

## 7. Not checked

- Any recipe under the level's lights. Every role that a slab names is typed in the level and
  read on its page of the finish sheet, on its path's largest face. The seal roles and the
  legends are neither typed nor computed, and `cast-concrete/wall` and `top` have no page.
- A lit value: a page shows albedo only, so the cabinet's data rows, the bed's light bars and the
  strips' joints were never seen. The painter's number back end places them.
- A face that no page shows: a container's other four tints, a crane's shorter faces and the
  smaller crates, stacks, barriers and fences are computed on the painter's number back end.
- Whether each mark of the seal roles and each legend lands where it is meant: a share with an
  offset, a `clip` under `across` `ends` or `up` `top`, `phase` with `fit`, a legend's `at`.
- Whether a fitted period of the seal roles meets a face at a whole number of periods plus one
  half.
- Whether a floor line's plan rectangle catches an up-facing surface of a base part that shares
  the floor's stage material.
- The glare of the bodies smoother than roughness 0.7: corrugated, beam, bed and casting.
  `docs/LOOK-AND-LIGHTING.md` gives the figure for the metal roles: the points' highlights pass
  the bloom threshold on a fifth of the standing places at 0.6 and on none from 0.7.
- The cost of any recipe and any value in the renderer: every hall luminance is computed, and
  the owner reads the frame rate and the view's start time.
- The screen shares hold for the sheet's two spawn views only, at 640 by 360 px.
