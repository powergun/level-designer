# Dark factory surfaces: research report

Scope: the look that TASK-001.07 must reach. The report reads the ten reference images as surfaces,
measures how far the level as built stands from them, and names the finishes and the level changes
that close the distance. A finish is a named procedural material, apart from a slab's physics
material and its tint. The sibling report `research-destruction-look-dev.md` defines the term and
covers how a finish is built and drawn; this report covers what each finish must show.

Every claim carries its source:

- Seen: visible in a named reference image or in a snapshot sheet of the level.
- Known: common in such plants, and absent from the reference images.
- Computed: derived from the authoring guide's figures and the lighting mapping rules.

The sheets are flat-lit CPU renders. They support a judgement of layout, scale, silhouette and flat
colour. How bright a surface reads in the hall is computed here at most. Mood, glints, haze and glow
stay the owner's to judge in the browser.

## Findings in brief

1. The first pass reads as silhouettes. Computed: the side of a dark prop returns a fortieth to a
   fifth of the floor's light, so the finishes need a value ladder before they need detail.
2. The mood images put the light into the line: glowing beds, status points, screens. The level's
   lines carry edge strips, one band per housing and one accent per arm.
3. The layout images are about cranes: yellow girders with chevrons, lettering and plates. The
   level's girders are plain and less than half as deep for their span.
4. Ten finishes cover the nine kinds and the seals, and an eleventh draws lines on the floor. Each
   is a painter that places a field, bands and marks by position in the slab's own metres.
5. A painter needs the slab's size, its role, one number per prop for stencilled numerals, and an
   emissive mask for lit parts.
6. The hall's light is equal from every side, so relief on a wall shows only as painted value,
   shaded as if lit from above.
7. No finish changes the arm's plank links, the crane's proportion, the empty line or the old shell.
8. The level keeps its mood, layout and lights. It changes its values, the rhythm of its lines, its
   girder depth and its marks.

## Evidence base

The reference images under `docs/art-direction/references`, each read whole and in crops. The short
names serve the rest of the report:

- crane shop: `layout/Suitable-Conditions-for-Overhead-Cranes1.jpg`;
- three cranes: `layout/overhead-cranes.png`;
- double girder: `layout/images.jpg`;
- pillar jib: `layout/jib-crane-of-DGCRANE-1.jpg`;
- twin jibs: `layout/underbraced-jib-cranes.jpg`;
- machine bay: `layout/images (1).jpg`;
- assembly hall: `layout/SANYCrawler.jpg`;
- blue lines: `mood/0_3WozhHNI2ZE7vBbe.jpg`;
- teal aisle: `mood/1744391057743.png`;
- night line: `mood/1753682547727.png`.

The seven layout images are daylit photographs: they give construction, paint and markings. The
three mood images give value, light and silhouette. Inferred: they are stylised pictures, and two
look generated, so they are read for light and never for construction. A hex colour is the median of
a small patch and carries the photograph's light.

The level as built: the validator accepts it with 127 props, 608 slabs and 133,793 triangles. The
plan, section and view sheets and fourteen custom views came from the level tool's snapshot command,
run on the committed description with a scratch work directory.

Documents read: the authoring guide, the level format, the prop-kit knowledge, the foundation report
on rendering and lighting, the sibling report and the design of this directory; of destruction lib,
its README and knowledge and the documents and source comments of its demo, Wall Lab. Wall Lab
commits no image, so its style is read and never seen. Crops, probes and sheets lived in the session
scratch directory and are not kept.

## 1. The references, read as surfaces

### Envelope and floor

- Seen, crane shop: cream ribbed cladding (`#cec2b0`) on grey steel columns (`#606263`) with cross
  bracing, a ribbon of translucent panels, ribbed roof sheets with skylights.
- Seen, three cranes and pillar jib: pale precast or painted block walls, dark roof sheeting with
  translucent strips, round high-bay lamps, deep blue building steel.
- Seen, mood: the envelope falls into darkness. Columns stand as dark verticals; the ceiling is a
  grid of luminaires (blue lines, teal aisle) or a void (night line).
- Seen, floors by day: stained concrete with a green walkway between yellow lines (crane shop), a
  dark sealed floor with one yellow lane line (assembly hall), smooth grey (`#837f79`) with tyre
  marks (pillar jib).
- Seen, floors by night: glossy. The floor mirrors the ceiling lines (teal aisle) and streaks the
  point lights (night line), with joints 1.5 to 2.5 m apart.
- Known: saw-cut joints every 4 to 6 m, and yellow lines 0.1 m wide around every cell.

### Bridge cranes and runways

- Seen, three cranes: one box girder per crane in safety yellow (`#ffc50f` lit, `#d77e00` in shade),
  about a twentieth of its span deep. It carries blue lettering for serial, class and capacity
  ("20T"), a white numbered disc, a white plate at mid-span, a lamp and looped cables. The hoist is
  blue (`#4660a1`) with a red load display; a white control box rides the end carriage.
- Seen, crane shop: red-and-black chevrons at both girder ends, and a green hoist.
- Seen, double girder: two girders with a handrail, a bolted splice, a plate, cable loops, a yellow
  hook block and black slings around a bundle of tubes.
- Seen, runways: deep blue beams on blue trussed columns with a thin red line along the top (three
  cranes); grey beams with stiffeners on grey columns (crane shop, double girder); orange cranes on
  a cream concrete gallery (assembly hall).
- The crane is the brightest, most saturated object of every daylight image.

### Jib cranes

- Seen, pillar jib: a round column with a black slewing band two thirds up, an I-beam boom on a
  bracket, a yellow chain hoist with black cable loops. The paint is a dusty ochre (`#e6b63f`) and
  scuffed.
- Seen, twin jibs: square columns (`#e9aa01`), white plates, a blue capacity label ("1000 kg"), a
  black hoist on a chain, stickers and switch boxes at hand height, and yellow guard barriers at the
  column feet.

### Lines and robot arms

- Seen, blue lines: a bed between two aluminium rails. The rails' fine grooves catch light as bright
  parallel lines. The bed carries glowing cyan bars across the line about every 0.4 m (`#15b1da`),
  and their light spills onto the housings.
- Seen, teal aisle: benches about 0.9 m high, of pale profile frames with dark inset panels and
  levelling feet. Each top holds a glowing striped field.
- Seen, night line: a floor track of two grated strips beside a smooth plate. It carries car bodies
  in bare metal with cold rim light on their roofs.
- Seen, blue lines and night line: black arms with a satin sheen, round joints, tapered castings and
  thick black cable packs that loop off the arm. Small blue or cyan lights sit at the joints, red
  points in the distance. The arms read as silhouettes against the lit beds and the haze.
- Seen, teal aisle: pale castings with dark links and ringed joint discs.
- Known: rollers 0.05 m thick at 0.1 m pitch, leg frames every 1 to 1.5 m, and arms in a maker's
  orange, yellow or white with axis and hazard labels.

### Machine housings and cabinets

- Seen, blue lines: pale boxes 1 to 1.5 m tall, under and beside the arms, with flat panels, one
  dark recessed window per face, thin frames and small cyan status lights.
- Seen, teal aisle: a wall of cabinets with glazed doors about 0.8 m wide. Each door has a handle,
  columns of small lights and rows of data, over a plinth band.
- Seen, machine bay: a charcoal housing (`#3d322a` in warm light) with a stepped profile and cream
  perforated vent panels, a blue cabinet and a pale green machine.
- Known: light grey cabinet paint, modules of 0.6 to 1.2 m, a kick plate.

### Stock, containers, lights and markings

- Seen: no reference image shows a shipping container. The brief asks for storage containers, the
  first pass built ISO boxes, and the owner passed them.
- Seen, crane shop: steel beams in dark mill scale with red-brown primed ends (`#775751`), plate
  stacks, pale sheets, blue skips (`#4c84b7`), yellow lifting stands.
- Seen, three cranes: precast panels on edge in racks, pale grey (`#99a7b1`), with dark insert
  pockets and lifting loops.
- Seen, jib images: sheet stock in a yellow post stillage, pallet racking with cartons, timber
  crates (`#b37841`) and pallets.
- Seen, lights: a ceiling lattice of near-white lines and dashes about 1.2 m long (teal aisle),
  short rectangles in rows (blue lines), sparse points, a cart with green lights and orange sparks
  (night line).
- Seen, markings: capacity, serial and number on every crane and jib; red sign boards with white
  characters on columns and hanging red signs (assembly hall); yellow guards.
- Seen: every plate names a real maker. The level takes the plate and never the name.
- Known: a container's corrugation at 0.28 m pitch, its corner posts, its door end with four lock
  rods and its code 0.1 m high; crate stencils; machine ID plates.

### How the mood images light these surfaces

- The beds, tubes, screens and status points are the only bright things, and each sits against
  black.
- Arms and frames are the darkest values: silhouettes with a thin sheen on their upper edges.
- Housings sit between. Blue lines shows, as linear patch medians, an arm at 0.010, a housing's
  window at 0.006, its face at 0.027 and a bed bar at 0.37.
- Haze lifts distant surfaces toward the light's colour: the far hall of blue lines reads 0.23.
- Cranes, jibs, stock and containers appear in no mood image.

## 2. The distance

### What the hall's light does to a surface

Computed from the mapping rules and the guide's facing ratios. The result reproduces the guide's two
floor luminances, 0.054 and 0.041, with a floor sheen of 0.019.

- A non-metal face returns 0.44 of its albedo facing up, 0.24 as a side and 0.10 as an underside.
  Metalness removes diffuse light: at the committed 0.55, a side returns 0.11.
- Today's sides return, in diffuse light: an arm 0.001, an enclosure 0.003 to 0.006, a container
  0.005 to 0.012, a crate 0.024, a crane web 0.04. The floor shows 0.054, a tube 0.31 and the clear
  colour 0.005.
- The environment is a vertical gradient, equal in every horizontal direction, and the key is
  vertical. A vertical rib or groove therefore changes neither the diffuse light nor the sheen of a
  wall. Relief shows only where it is painted, or in a point's pool.
- Bare metal mirrors the environment, whose horizon shows 0.21 and whose zenith 0.51. A bare steel
  side returns about half the horizon's value, twice the floor: the lightest unlit surface of the
  hall.
- The game's grade is cold and holds saturation at 0.82, and the ambient light is blue. A warm paint
  keeps little hue, so value carries identity.
- A pixel spans about 2 mm per metre of distance, by the sibling report's lens figures.

Inferred: a pattern shows only where its light part reaches about half the floor's level. The first
pass sits far below it, so the owner saw a mood and no surfaces.

### The kinds, in order of what a finish adds

1. Conveyor, 6 props. Today: a charcoal bench with two cyan edge strips. References: the bed is the
   line's light. Missing: rollers, rails, light bars, leg frames.
2. Bridge crane, 4, and jib crane, 6. Today: thin ochre lines under the roof and ochre gallows.
   References: the plant's signal colour and its lettering. Missing: chevrons, capacity, numbers,
   plates, a blue hoist, the slewing band.
3. Enclosure, 7. Today: black boxes with one cyan band. References: pale housings with windows,
   doors, grilles and status lights, and a wall of cabinets.
4. Container, 12. Today: the largest plain faces at eye level, in five muted colours. Known:
   corrugation, posts, a door end, a code.
5. Robot arm, 16. Today: a black inverted V of two planks with an orange accent. References: joint
   discs, cable packs, joint lights.
6. Partition, 27, and crate, 28. Today: plain slabs and brown cubes. References: steel stacks,
   precast panels, stillages, plank crates with stencils.
7. Light strip, 21. Today: one unbroken line. References: rows of lamps with joints.
8. Seals, 13. Today: flat grey boxes, the end wall 35 by 20 m. Known: shutters, cladding.
9. The hall. The sheets draw the stage untextured, so its surfaces go unjudged here. A base override
   only tints a stage material; floor lines come as a treatment of the floor's surface.

### What no finish can change

- Arm: its links are planks 0.4 m thick with an open wedge at each joint. It has no round joint and
  no cable loop, and all sixteen arms hold one of two poses.
- Bridge crane: the girder is 0.65 m deep on a span of 29.37 m, a forty-fifth, and reads from the
  floor as a rail. The hook hangs without a rope and carries nothing.
- Lines: they carry no workpiece, and the night line's subject is the car body. They run 33 m in
  broken pieces with sixteen arms; the references repeat one station to the horizon.
- Kinds: the kit has no cart (night line), no hanging sign (assembly hall), no rack and no glass.
  Nothing stands on a deck, and only a strip or a crane hangs.
- Shell: an old masonry hall with tanks and pipes, where the references show steel sheds. The brief
  builds on it, and the story holds: a new line in an old hall.

## 3. The finishes

Each finish is a painter in the form of Wall Lab's walls, pillars and spheres: a function of the
surface position in the slab's own metres. It is sharp at any distance and never repeats. Its limit
is its cost per pixel: a finish stays under the design's caps on a recipe, with bands, cells and
rectangles before noise and at most two noise layers, both for wear.

Baking a finish into tiles is the fallback, which the owner chooses if the shaders cost too much.
Under it the look would lose sharpness nearer than about 1.2 m and repeat every 2.4 m, five times
along a long container and fifteen along the end wall. It would also lose marks at both ends of
slabs of differing size, light marks on tinted paint, numerals per prop without an image of marks,
and floor lines as a treatment of the floor's own surface.

### What every finish obeys

To read in the hall:

- The value ladder, as a body's albedo and its side's luminance: black, up to 0.02 and 0.005; dark,
  0.05 to 0.12 and 0.012 to 0.03; mid, 0.12 to 0.22 and 0.03 to 0.054, the floor's level; signal,
  0.35 to 0.5 and 0.085 to 0.12, on small or overhead areas only.
- Paint is non-metal. Metalness marks bare metal alone, as line work: rails, rollers, worn edges,
  hole rims.
- Relief is painted as value lit from above: a light upper lip, a dark lower lip, a dark groove. A
  relief height adds to it only in a point's pool, so a painter may leave it out.
- A lit part writes an emissive mask, and the prop's glow gives its colour and strength, under the
  bloom threshold as the tubes are. A prop without a glow takes pale paint (`#7ccbd6`) instead.
  Computed: albedo 0.5 returns 0.22 on a top and 0.12 on a side, beside a tube's 0.31.
- Inside a face, light and dark parts differ by 2 to 1 or more; lettering by 4 to 1.
- No line is narrower than 0.015 m. Numerals stand 0.1 m high at eye level and 0.3 m or more
  overhead.
- Wear is light and functional, on a tenth of a face at most. Each feature fades to its mean before
  it aliases.

To stay one object under fire:

- A finish states three surfaces: the outside face, the inside or back face, and the edges. An
  inside face is plain. A thick slab's edges are faces in their own right.
- A top takes its own role, so a wall's bands never lie on a roof. A field is symmetric about the
  centre line, so the two runs of a split slab meet in step.
- The pattern stays in place when the slab is hit. A hole adds a rim and the material's core, and
  never swaps the look. Text reads upright and unmirrored on every face.

### What a painter carries, and what keeps another carrier

A painter knows the slab's size and the position on it, so these are painter features:

- a repeating field: corrugation, rollers, boards, courses, bays, stiffeners;
- a band anchored at the floor, the top or a hinge, and a mark at either end or in a corner: a kick
  band, a container's rails and posts, chevrons at a girder's ends, the hub disc at a link's hinge,
  a window row above the glow band;
- a light mark on tinted paint and any second hue: a white plate on yellow, grey rings on a black
  arm, red primer on dark steel;
- a lit part, on the slab's own material. A painter on the strip's material answers the tube's dark
  joints: the lower face and the long edges are lit in lamps and dark between them.

A mark sits on its slab through the slab's role and parameters, and no plate slab is added. Three
needs keep another carrier:

- the girder's depth is geometry, a dimension of the prop kit;
- floor lines are rectangles in plan coordinates, mixed into the floor's own material;
- the cut look is data per finish, for sec-111's interior painters at adoption.

Lettering and numerals have three possible carriers:

- A small atlas of marks, one image in the GLB. It gives any glyph and the crispest edge. It adds an
  image and a sampler to every finish that letters, against the owner's wish for the smallest GLB.
- Thin plate slabs. They stay destructible, but they add about 45 slabs, a plate under 0.2 m is
  unproven in the destructibility proof, and a plate still needs an image or a painter.
- Painter arithmetic: numerals of seven segments, drawn from one number per prop. It adds no image
  and no slab, and a legend costs seven rectangles.

Painter arithmetic is the recommendation. A plant sprays stencilled numerals on steel and timber,
the gaps between segments read as a stencil's bridges, and small print reads as rows of dashes at
any distance the hall allows. The atlas stays the way out if segments read badly in QA. No painter
draws a word or a maker's name.

### Housing: painted sheet steel

- Takes: enclosure sides, ends and roof; arm pedestal; crane trolley; jib hoist; conveyor skirts.
- Field: satin paint, roughness 0.5, in bays of 1.2 m, 0.8 m on a cabinet. A bay has a seam 0.015 m
  wide, a darker kick band up to 0.12 m and a lighter cap band under the roof.
- Marks: on a machine, in every bay, a dark window 0.6 by 0.5 m from 1.45 m, above the glow band,
  with a handle and three lit status points beside it; a louvre strip from 0.3 to 0.55 m; one ID
  plate with three digits. A cabinet door has a lit screen 0.3 by 0.2 m. A skirt has bare leg posts
  around dark inset panels. A pedestal has two digits and warning bars at its foot.
- Colour: light grey housings on the mid step (`#73767a`), anthracite skirts (`#383e42`), blue
  hoists (`#2f5f9e`).
- Wear: a dusty cap band and a darker kick band.
- Shot through: a bright bare-steel rim with the paint flaked back 0.01 m; a dark primer inside.
- From: blue lines, teal aisle, machine bay.

### Bed: the conveyor's top

- Takes: the conveyor deck's top and edges.
- Field: a dark anodised bed (`#22262a`) with rollers across the line at 0.1 m pitch, each a light
  crest and a dark gap.
- Marks: two bare aluminium rails 0.08 m wide along the long edges; a lit bar 0.04 m wide across the
  bed every 0.4 m, in the conveyor's glow; a guard plate every 2 m.
- Wear: oil-dark patches.
- Shot through: bare aluminium rims.
- From: blue lines, teal aisle.

### Casting: the arm

- Takes: shoulder, upper arm, forearm and head, on all six faces.
- Field: graphite black (`#16181b`), satin, roughness 0.45, with a lighter cast edge 0.03 m wide
  around each side face.
- Marks: a hub disc 0.28 m across at each link's hinge end, with a mid-grey ring (`#5a5f66`) and a
  lit status point; a smaller cap at the far end; a hazard label. The upper edge face carries a
  cable pack: two ribbed hoses 0.06 m wide, clipped every 0.3 m.
- Shot through: a pale cast-aluminium core (`#a9adb0`), bare at the rim.
- From: blue lines and night line; the discs from teal aisle.

### Corrugated: container steel and cladding

- Takes: container sides, ends and roof, and the seals as cladding or shutters.
- Field: the prop's paint on the dark step, roughness 0.6. Corrugation at 0.28 m pitch as a flat
  crest and a dark groove 0.07 m wide, between plain rails at the base and the top.
- Marks: corner posts 0.12 m wide with a dark casting at each corner; two fork pockets at the base;
  on one end two door leaves with four lock rods, handles at 1.05 m and hinges; a code of four
  letters and seven digits 0.1 m high at the top right of each side and on the door.
- Seals: cladding with a sheet lap every 3 m; a shutter of slats at 0.1 m pitch with warning bars at
  its foot and one large digit above it.
- Wear: rust-stained crests below the top rail, a scuff band from 0.2 to 0.6 m, floor dirt on the
  lowest 0.3 m.
- Shot through: a bright steel rim in a rust-brown halo; dark primer (`#3a2f2b`) inside.
- From: Known. The crane shop's ribbed cladding shows the same language on a wall.

### Timber

- Takes: crates, and wood partitions as timber stacks.
- Field: sawn softwood on the mid step (`#a8743f`), roughness 0.8. A crate has boards 0.12 m high
  with gaps of 0.012 m, a fifth lighter or darker per board. A stack has courses 0.05 m high, a
  spacer gap every fourth course and board ends on its end faces.
- Marks: a batten frame 0.09 m wide around each crate face, with a diagonal brace from 1.5 m; a
  black stencil of two letters and four digits 0.12 m high on two opposite sides; two steel straps
  and bearer blocks on a stack.
- Wear: grey handling dirt on the lower third.
- Shot through: pale fresh wood (`#d2b07a`) with splinter streaks along the boards.
- From: twin jibs, machine bay.

### Beam: painted structural steel

- Takes: the bridge crane's girders, runways, end trucks and hook block; the jib's mast, boom, tie
  and plinth.
- Field: thick gloss paint, roughness 0.5, with a stiffener line every 1.5 m and a weld line along
  the base. Safety yellow on the signal step (`#d39b12`); deep blue runways (`#1f4f8f`).
- Marks, girder: black chevrons 0.7 m wide at both ends; the capacity at both ends, half the web
  high; a white disc with the crane's number; a white plate 1.6 m wide on the centre line.
- Marks, others: black bars over the end trucks, the hook block and the plinth's sides; a red line
  along each runway's top; on the mast a black slewing band under the boom, a switch box and
  stickers at hand height; the capacity 0.2 m high on the boom.
- Wear: dust on up-facing faces, grease under the trolley, chipped edges.
- Shot through: bare steel, bright against the paint.
- From: three cranes, crane shop, double girder and the jib images.

### Stock: steel, cast concrete and block

- Steel stock takes metal partitions as stacks. Courses 0.05 m high in dark mill scale (`#3d3e42`)
  with a faint metal sheen, with red-brown primer (`#7a4a3e`) on the end faces, ragged ends, two
  straps, bearer blocks and, by choice, yellow stillage posts at the ends. Shot through: bright
  steel with the courses carried into the hole. From: crane shop, pillar jib.
- Cast concrete takes concrete partitions and enclosures. Formed grey on the mid step (`#7d8286`),
  roughness 0.85, with tie dots 0.03 m across on a 0.6 m grid, pour lines and water stains. A panel
  has two lifting pockets under its top and a stencilled number. A barrier has a band of yellow and
  black bars 0.2 m high along its top and two reflectors. Shot through: a paler core with dark
  aggregate 0.01 to 0.03 m across. From: three cranes, twin jibs.
- Block takes the two brick partitions, which keep the brick physics. Painted concrete block in
  running bond, 0.39 by 0.19 m with joints of 0.012 m, light grey above a darker dado up to 1 m.
  Shot through: a grey core with the bond carried through. From: the walls of pillar jib and double
  girder.

### Luminaire and floor lines

- Luminaire takes light strips. The lower face and the two long edges are lit in the strip's glow,
  in lamps 1.2 m long with dark joints 0.04 m wide; the end caps and the upper face are the dark
  housing (`#1a1c1f`). A strip reads by its long edges. Computed: 30 m down the hall an edge shows
  three times the height of the lower face. Glow bands, edge strips and accents stay unbroken. A
  damaged lit slab goes dark, an accepted limit. From: teal aisle, blue lines.
- Floor lines are a surface treatment of the existing floor, with no object and no collision. Worn
  yellow lines 0.1 m wide (`#9c7618`) edge the centre aisle and box the two assembly lines; a yellow
  band marks the ramp's foot; side lines mark each container slot of the yard. Computed: the paint
  shows 0.088, 1.6 times the floor. From: crane shop, assembly hall, machine bay.

## 4. The level design

### What stays

- The lighting section as committed. A finish moves albedo and never a light.
- The two lines on the front floor beside the centre aisle, and the aisle itself.
- The storage yard on the raised slab as the opening view from the player spawn.
- The four bridge cranes on the corbels, the six jibs and the sixteen arms. The lines carry no
  workpiece, and the kit gains no kind.
- Cover, lanes, spawn rings and the first-pass budget, as the validator accepts them.
- The three glow colours: cyan for work, amber for alert, red-orange for the arm's eye.

### What changes

1. Values. Each kind takes its step of the ladder: black arms and beds, dark containers and skirts,
   housings and stock up to the floor's level, yellow cranes above it. The five container colours
   stay; as non-metal paint they already sit on the dark step.
2. Lines. One station repeats at one pitch: a conveyor run, an arm on each side, a housing. The
   sixteen arms hold three poses in a repeating order.
3. Cabinets. A bank of cabinets stands beside each housing, away from the aisle, so each line shows
   the cabinet wall of the teal aisle.
4. Cranes. The girder web grows from 0.6 to about 1.25 m, a twenty-third of the span beside the
   references' twentieth. Computed from the prop-kit's and the guide's figures: the trolley tops out
   2.35 m above the rails, inside the format's 2.4 m and 0.27 m under the lowest truss members, and
   the girder ends stay under the sloped panels. Each bridge parks with a web toward a main view:
   the opening view or the centre aisle.
5. Stock. The yard's stacks take the references' stock: steel with primed ends, a row of precast
   panels, stillage posts, plank crates. The concrete fences take warning bars, and the two brick
   fences become block walls.
6. Marks. One fictional system numbers the plant in stencilled numerals: cranes 1 to 4 with their
   capacity, container codes, machine stations. No mark names a maker.
7. Seals. The end wall and the door take the corrugated finish as cladding and shutters, so the
   level's largest plain face gains a pattern.
8. Floor. Worn yellow lines edge the centre aisle, box the two lines and mark the ramp's foot and
   the yard's slots.

## 5. How to judge it

An agent judges a finish only as pixels, so each painter is also evaluated on the CPU, into sheets:

- A swatch: each finish on a flat face at a stated scale with a ruler in metres, and again at the
  footprint of 5, 20 and 60 m, for pattern, scale and what survives distance.
- A kind sheet: each kind in elevation on every face, with its finishes, tints and marks, at a
  stated scale beside a figure 1.8 m tall. It shows what each band and mark is anchored to: a kick
  band on a roof or a hub disc at the wrong end of a link shows here. It also shows the meeting of
  split runs, and text upright and unmirrored.
- A value table: per finish and tint, the albedo of the body and of its lightest and darkest parts,
  each as the computed luminance of a top, a side and an underside, beside the floor's 0.054 and a
  tube's 0.31.
- Counts that a sheet proves: 21 or 22 crests on a container's 6.06 m side, chevrons at both ends of
  a girder and none between, one hub disc per link at its hinge.
- The finishes in the eight spawn and overview views, for how they sit together and how a pattern
  repeats along a line.

The owner alone judges, in the browser:

- whether the raised values keep the mood that passed;
- the sheen of bare metal and gloss paint under the eight points, and any glare;
- whether lit parts sit well under the tubes;
- how patterns fade in the haze and whether they shimmer in motion;
- whether lettering reads in the dark.

Nobody sees a damaged finish before adoption: the QA app cannot fire.

## 6. Wall Lab: method and style

Wall Lab, subtitled "Hong Kong Noir / 1991", is destruction lib's only demo. Its walls, pillars and
spheres are the only references. Nothing comes from its statues, neither a look nor a method.

The method to take:

- A finish is explicit. A wall's preset names it apart from the physics material and the tint, and
  no look is guessed from a colour.
- Features are stated in metres in the object's own frame. The sibling report reads a brick course
  of 75 mm, form panels with tie holes at 1.2 m and boards 150 mm wide. A pattern neither stretches
  nor swims.
- One finish owns face and cut: boards and fibres, formed skin and aggregate, bond and mortar on the
  walls; paint over bright iron on the metal spheres.
- The colour is a tint under one shared finish: a rear layer darkens by its colour alone.

The style to leave: a night range under a moon that enters through boarded, mullioned windows;
sodium floods, a teal tube and a red neon marquee; a wet floor with puddles and reflections; rows of
specimens in timber, gypsum and brick.

## Not checked

- Any image from the game's renderer: no browser ran. Every luminance here is computed.
- The base stage's textures and Wall Lab's look: neither was seen.
- The cost of any painter per pixel, and whether segment numerals read as stencils.
- The validator's verdict on any changed line, cabinet bank or girder depth.
- Real plants beyond the ten images: each Known line rests on general practice.
