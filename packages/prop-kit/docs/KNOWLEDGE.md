# prop-kit knowledge

`@level-designer/prop-kit` expands a prop of the level description into slabs. It owns the
prop kinds: each kind's parameter table, every secondary dimension and the generator of the
kind's slabs. It also owns the `kind` and `param` build errors.

## Surface

- `expandProp` takes one admitted prop, its path in the description (`props[i]`), the
  floor height under its `at` and the glow names of the description's `glows`. It returns
  the prop's slabs in the level frame and in slab order, or its problems. The caller
  expands each prop once.
- Each expanded slab carries the five keys of a level `.json` slab and, beside them, the glow
  name of a glowing slab. The slabs are unrounded; the caller rounds each slab once with
  `roundSlab` of `@level-designer/level-format` before any admission.
- `listKinds` returns every kind with its parameters in table order: each parameter's name,
  its type, its range or its choices, its default and, for a colour or a glow, whether it is
  required. It is a listing of every kind for authors.

## Units

- `admit`: the admission of a prop's kind and parameters, the parameter specs, and the
  `kind` and `param` problems.
- `frame`: slab roles in the prop frame, the six facings and the pitched facing, the split of
  a role into runs and the placement of a slab on its site.
- `kinds`: the kind tables, their named dimensions, the shared hollow box layout and the
  bridge crane's `hookDrop` limit.

The root unit holds the expansion and the kind listing. Dependencies point down: `kinds` uses
`admit` and `frame`, and the root uses all three.

## Admission

A prop's `params` map is untrusted. The kit admits it once, at the expansion, into the
kind's typed parameter value with every default filled in. The generators trust that value.

- An unknown kind yields one `kind` problem at `props[i].kind`, and the parameters go
  unjudged:
  `<path>: unknown kind "<kind>"; the kinds are <list>`. The list names every kind.
- Every other refusal is a `param` problem at the parameter's path, such as
  `props[3].params.length`. A key outside the plain form shows quoted in brackets, as in
  `props[3].params["odd key"]`.
- The message reads `<path>: <kind> takes <range or type>, got <value>`. A number names its
  range (`length 1 to 12`), the colour its form (`color as #rrggbb text`), a material its
  choices (`material metal or concrete`) and a glow the names `glows` holds.
- A missing required parameter shows `got nothing`. A value of the wrong type fails its range
  or form. An unknown parameter names the parameters the kind takes.
- Problems come in reading order: unknown keys first, in map order, then every parameter in
  table order. All of them are reported.

Typed ranges compare exactly, with no slack: a parameter typed at its limit parses to the
limit's own number and passes. A glow passes when `glows` names it. Every kind requires
`color`; an optional colour, `baseColor` or `runwayColor`, admits as nothing when it is
omitted, and the kind then paints those slabs in `color`.

The bridge crane has the kit's one limit across parameters: its hook keeps its underside
`LEAST_HANG` above the floor, so `hookDrop` may not pass `railHeight` less 2.5 m. That limit
is reached by arithmetic, so it compares with the format's `LENGTH_SLACK` and prints through
`formatLength`: `<path>: bridge-crane takes hookDrop 0.5 to <limit> at railHeight <r>, got
<value>`. `hookDrop` 3.6 at `railHeight` 6.1 passes only through the slack, since the
difference is 2.4999999999999996 in floats. The limit is judged once every parameter passes:
a `hookDrop` outside 0.5 to 8 gets its plain range, and a prop with another refused parameter
reports that one first. The limit binds only below `railHeight` 10.5, so the listing shows the
plain range. For a `railHeight` typed with a fifth decimal, the printed
limit can lie half a grid step above `railHeight` less 2.5 m, on the edge of the slack, because
`formatLength` rounds a half step away from zero; typing that printed limit back can then be
refused.

Paths follow `keyPath` and every "got" part follows `describeValue`, both from
`@level-designer/level-format`, so the kit's messages share the format's path rule and value
rendering.

## Frame and origin

The prop frame is right-handed: +Y up, the length along local +Z and the width along local +X.
Its origin lies on the floor under `at`. For a box kind it is the centre of the prop's plan
outline: the prop spans x from -width/2 to +width/2 and z from -length/2 to +length/2; a
partition spans z from -thickness/2 to +thickness/2, and a crate uses `size` for width, length
and height. A robot arm's origin is the centre of its pedestal and a jib crane's the centre of
its mast; both reach along local +Z. A bridge crane's origin is the centre of the rectangle
between its runway beams. A standing kind has its lowest slabs at y = 0. A light strip has its
underside at y = `height`, a bridge crane its hook's at y = `railHeight - hookDrop`.

Placement turns the prop frame by the yaw about +Y and moves it onto the floor under `at`. A
yaw `a` turns a frame vector (x, y, z) into (x cos a + z sin a, y, -x sin a + z cos a), so a
yaw of 90 degrees turns local +Z to world +X and local +X to world -Z. A slab's world rotation
is the yaw quaternion `[0, sin(a/2), 0, cos(a/2)]` times the slab's facing quaternion, yaw on
the left.

## Slab roles and facings

A kind states each slab as a role: a box of the prop frame with a facing, or a pitched
rectangle; then a material, a colour and, for a glow slab, the glow name. A slab's own frame
has its width along +X, its height along +Y from its base and its thickness along +Z, toward
the painted +Z face. Its origin is its base centre. The facing names where the slab's +X, +Y
and +Z axes point in the prop frame:

- `+Z`: +X, +Y, +Z; the identity quaternion.
- `+X`: -Z, +Y, +X; a yaw of 90 degrees.
- `-Z`: -X, +Y, -Z; a yaw of 180 degrees.
- `-X`: +Z, +Y, -X; a yaw of 270 degrees.
- `up`: -X, +Z, +Y; the +Z face looks up.
- `down`: +X, +Z, -Y; the +Z face looks down.

The slab's size is the box's extent along those three axes. Its base centre is the middle of
the box with the height axis at its minimum, so a lying slab has its base at its -Z end.

A pitched role states the arm's links and the jib's tie. It keeps the facing `+X` and turns
about local X: a rectangle of the YZ plane that grows from its hinge by its length along the
direction `p` degrees above local +Z, (0, sin p, cos p), and by its width along the direction a
right angle above it, (0, cos p, -sin p). Its thickness spans an x interval. Its rotation is the
turn about X by 90 - p degrees after the `+X` facing, a product of unit quaternions, so the
rotation is unit by construction; a pitch of 90 equals the upright `+X` facing.

## The outward rule

destruction lib's mesher tints a slab's -Z face 20% toward a light grey, so every slab turns
its +Z face to where a player sees and shoots it:

- a side panel of a hollow kind faces away from the prop's vertical centre axis;
- a deck, a roof and a lid face up, with the tinted face inside the prop;
- a hanging slab faces down, toward the floor it is seen from;
- a glow slab faces away from the panel it is mounted on;
- a side of a hollow part, the arm's pedestal, the jib's mast or the trolley, faces away from
  that part's own vertical axis;
- a flange faces down and a plinth up;
- a runway web and an end truck face the crane's centre line, a girder web faces away from
  the other girder, the hook block faces local +Z, and the arm's links and the jib's web, tie
  and hoist face local +X;
- a partition has no inside: its +Z face looks along local +Z, and the author turns it to the
  main lane with `yaw`. Adding 180 degrees swaps its faces, and the back face reads clearly
  lighter on a dark colour.

## The joint rule

- Slabs that meet face to face form butt joints at zero distance: their contact planes
  coincide. No slab enters another, and no joint has a mitre or a gap.
- A top runs through over everything below it. Sides and ends butt its underside.
- At a vertical corner the +X and -X sides run through over the full length, and each end
  butts between their inner faces.
- The runs of a split slab butt end to end on the cut plane.
- A glow slab butts the outer face of its panel with its back.
- Slabs that meet at an angle touch along one edge, and neither enters the other. The upper
  arm hinges on the shoulder's top, the elbow on the inner edge of the bend, and the jib's
  tie on the mast's face and the web's top. Each such joint leaves an open wedge.

Placement and the grid rounding can push touching slabs up to about 0.15 mm into each other,
inside the 1 mm of contact the `overlap` rule allows.

## The splitting rule

Every role splits along its run axis into the fewest equal runs that `admitSlabs` accepts once
each run is rounded with `roundSlab`. The decision reads rounded sizes because the pipeline
rounds every slab before the admission judges it: an unrounded face of 25.00002 m2 rounds to
25.0002 m2 and fails. A face typed at exactly 25 m2 stays whole. The kit holds no copy of the
caps or the grid.

- The run axis is a slab's horizontal axis in its face: the prop's Z for a top and for a +X or
  -X side, the prop's X for a +Z or -Z end and for a partition.
- Run k of n spans from `start + k * run / n` to `start + (k + 1) * run / n`.
- Only an enclosure's and a container's roof and long sides, a partition and a bridge crane's
  four runway roles can split, and never into more than two runs. A runway splits above a
  travel of 40 m; at 60 m it has two runs of 30 m.
- A pitched role never splits. The longest is the jib's tie at a boom of 8 m, about 5.5 by
  0.1 m, far inside the caps.

## Slab order

Slab order names the mesh nodes, so it is part of the contract. Roles come in the order each
kind lists them below; +X comes before -X and +Z before -Z; a web comes before its flange; the
runs of one role ascend along the run axis; glow slabs come last.

## Colour, material and glow

Each role carries its colour. Every slab takes the prop's `color`, except the arm's pedestal,
which takes `baseColor`, and the bridge crane's runway beams, which take `runwayColor`; each
falls back to `color`. A slab's material is its kind's fixed material or its
`material` parameter. A glow slab is always metal, also on a concrete enclosure, and carries
the glow name of the prop's `glow` parameter. A glow only adds slabs: the other slabs are the
same with and without it, so the outline never depends on `glow`.

## Named dimensions

The dimensions every kind shares:

- `PANEL`, 0.05 m: the thickness of every metal and wood panel, web and flange. The game's
  collision was measured on a 4 x 2 x 0.05 m panel, and a thicker panel only widens the dead
  edges.
- `CONCRETE_PANEL`, 0.10 m: the thickness of a concrete enclosure's panels, the thinnest
  partition the format admits, so a blast hole shows cast concrete, not sheet.
- `GLOW_DEPTH`, 0.03 m: the thickness of a glow slab and the depth of the eave that houses
  it. It keeps every face within 0.03 m of the outline the parameters state.
- `LEAST_HANG`, 2.5 m: the least underside height of a hanging part above the floor under
  `at`. It clears the 2.17 m that `support` reads over the hall's higher floor, 0.3241 m up.

The box kinds' dimensions:

- `CONVEYOR_STRIP_HEIGHT`, 0.08 m: the face height of a conveyor's light bar, a line about
  four pixels high at 10 m.
- `ENCLOSURE_BAND_BASE`, 1.2 m: chest height on the player. It clears the tallest conveyor
  deck, and bands of enclosures of any height form one line along an assembly line.
- `ENCLOSURE_BAND_HEIGHT`, 0.10 m: a band, not a window, on a machine 1.5 to 3.5 m tall.
- `LIGHT_STRIP_DEPTH`, 0.08 m: a batten housing. Down a long hall the player sees its edge
  more than its underside, so the edge is deeper than a panel.
- `CONTAINER_WIDTH` 2.44 m and `CONTAINER_HEIGHT` 2.59 m: the format's fixed cross section.

The robot arm's dimensions:

- `ARM_WIDTH`, 0.4 m: the pedestal's width and the thickness of the shoulder and every link, so
  the standing footprint is one straight-sided strip.
- `ARM_PEDESTAL_LENGTH` 0.8 m and `ARM_PEDESTAL_HEIGHT` 0.9 m: a footing about bench high, so
  the shoulder stands above a conveyor deck.
- `ARM_SHOULDER_LENGTH` 0.6 m and `ARM_SHOULDER_HEIGHT` 0.4 m: the block that carries the
  upper arm at every angle. The hinge stands 1.3 m up, so the largest arm's lowest head point,
  1.3 m less 0.325 of the reach, stays 0.16 m above the floor.
- `ARM_HINGE_OFFSET`, 0.1 m: the hinge sits ahead of the pedestal's centre, so an upright
  upper arm stays on the block.
- `ARM_SHARES` 0.45, 0.40 and 0.15 of `reach`, and `ARM_WIDTHS` 0.30, 0.25 and 0.35 m, for
  upper arm, forearm and head: a tapering arm with a wider tool head. The shares sum to 1.
- `ARM_ACCENT_SHARE` 0.6 of the head and `ARM_ACCENT_WIDTH` 0.1 m: a light on the tool,
  centred inside the head's face.

The bridge crane's dimensions:

- `BEAM_FLANGE_WIDTH`, 0.3 m: the bottom flange of every beam, girder and boom, an I-beam that
  reads from the floor at 10 m.
- `RUNWAY_WEB_HEIGHT`, 0.5 m: with its flange a runway 0.55 m deep, as on the overhead-crane
  reference.
- `END_TRUCK_WIDTH` 0.3 m, `END_TRUCK_HEIGHT` 0.4 m and `END_TRUCK_LENGTH` 3 m: a truck as wide
  as the flange it rides over, long enough to carry both girders and the trolley.
- `GIRDER_WEB_HEIGHT` 0.6 m and `GIRDER_SPACING` 1.5 m between the webs' centres: a deeper
  double-girder bridge, as on the reference.
- `TROLLEY_WIDTH` 1.2 m and `TROLLEY_HEIGHT` 0.5 m: a hoist housing that reads as a box. Its
  length spans the girder webs' outer faces, 1.55 m. The crane rises 1.7 m above `railHeight`.
- `HOOK_BLOCK`, 0.4 by 0.5 by 0.3 m: a block a player recognises under the trolley.

The jib crane's dimensions, with the flange of `BEAM_FLANGE_WIDTH`:

- `JIB_PLINTH_SIDE` 0.8 m and `JIB_PLINTH_HEIGHT` 0.6 m: a footing wider than the mast, above
  the 0.55 m least top.
- `JIB_MAST_SIDE` 0.5 m and `JIB_MAST_HEAD` 1.4 m: a column inside the plinth's outline that
  rises above the boom's underside far enough for the tie's anchor.
- `JIB_BOOM_WEB_HEIGHT`, 0.4 m: a boom shallower than a girder, for a lighter crane.
- `JIB_TIE`, 0.1 m wide, anchored 0.15 m under the mast top, its foot at 0.7 of the boom: a
  top brace, as on the jib references.
- `JIB_HOIST`, 0.3 m wide and 0.4 m long, 0.4 m under the boom and 0.1 m back from its tip: at
  `height` 3 the hoist hangs 2.6 m up.

## The hollow box layout

Conveyor, enclosure, container and crate share one layout. With outline W along X, L along
Z, height H, panel thickness T and eave E:

- the top spans x from -W/2 to W/2, y from H - T to H and the full length, facing `up`;
- the +X side spans x from W/2 - E - T to W/2 - E, y from 0 to H - T and the full length,
  facing `+X`; the -X side is its mirror, facing `-X`;
- the +Z end spans x between the sides' inner faces, y from 0 to H - T and z from L/2 - T to
  L/2, facing `+Z`; the -Z end is its mirror, facing `-Z`.

The top overhangs each side by E and is flush with the ends. E is `GLOW_DEPTH` on the two
kinds that take a glow, so a glow slab fits under the eave with its face in the plane
x = W/2 or -W/2, level with the top's edge. E is 0 on a container and a crate.

## The kinds

### conveyor

A metal deck on two skirts that stand from the floor to the deck's underside, open at both
ends. It reads as a bench-high line: a flat top at hip height on a closed frame.

- Slabs: the deck, the +X skirt and the -X skirt, from the hollow layout with T = `PANEL`,
  E = `GLOW_DEPTH` and no ends.
- A glow adds a +X and a -X strip, `GLOW_DEPTH` thick and `CONVEYOR_STRIP_HEIGHT` high,
  directly under the deck in the eave over the full length.
- Every slab ends flush at both ends, so conveyors chain end to end in contact.
- No slab splits: 3 slabs, 5 with a glow.

### enclosure

A closed box of four sides under a flat roof, `metal` or `concrete`. It reads as a machine
housing taller than a conveyor, with one light band at chest height.

- T is `PANEL` for metal and `CONCRETE_PANEL` for concrete; E is `GLOW_DEPTH`.
- Slabs: the roof, the +X and -X sides, then the +Z and -Z ends, from the hollow layout.
- The long sides are the +X and -X sides, along the length, whatever the ratio of width to
  length. An author who wants the bands on the wider faces makes them the length and yaws
  the prop.
- A glow adds a metal +X and -X band from `ENCLOSURE_BAND_BASE` up by
  `ENCLOSURE_BAND_HEIGHT`, over the full length in the eave. A band touches only its side.
- The roof splits in two when its face passes 25 m2, and each long side when its face does;
  at length 8 that is a height above 3.175 m for metal and 3.225 m for concrete. An end never
  splits. The count is 5 to 8 slabs, 7 to 10 with a glow.

### robot-arm

A hollow pedestal with an arm of three links on a shoulder block, in one layer as thick as the
pedestal is wide. `shoulder` (30 to 90 degrees) raises the upper arm above local +Z, `elbow`
(60 to 160) is the angle between upper arm and forearm, which bends down, and `reach` (1.5 to
3.5 m) is the stretched length of upper arm, forearm and head. Shoulder plus elbow is 90 or
more, so the forearm never points back.

- Slabs: the pedestal from the hollow layout (`ARM_WIDTH` by `ARM_PEDESTAL_LENGTH`, T =
  `PANEL`, E = 0) in `baseColor`; the shoulder, an upright `+X` block on the pedestal's top;
  then the upper arm, the forearm and the head, pitched.
- The upper arm hinges at `ARM_HINGE_OFFSET` on the shoulder's top. The forearm hinges at the
  upper arm's far lower corner. The head continues the forearm from its end face, centred.
- A glow adds a metal accent, `GLOW_DEPTH` thick, on the head's +X face.
- No slab splits: 9 slabs, 10 with a glow.

### container

A closed metal box `CONTAINER_WIDTH` wide and `CONTAINER_HEIGHT` high: four sides under a flat,
flush roof with no eave, door or corner post. It reads by its proportions: the 20 foot box at
the default length and the 40 foot box at 12.2 m.

- Slabs: the roof, the +X and -X sides, then the +Z and -Z ends, with T = `PANEL` and E = 0.
- The long sides split above a length of 9.8425 m and the roof above 10.2459 m, so a
  container has 5, 7 or 8 slabs.

### crate

A wood cube of side `size`: four sides under a flat lid flush with the sides, so crates stand
in rows in contact. Slabs: the lid, the +X and -X sides, then the +Z and -Z sides, with
T = `PANEL` and E = 0. No slab splits: 5 slabs.

### partition

One upright wall `width` by `height`, `thickness` thick, centred on the origin and facing
`+Z`, in any of the four materials. The parameters fix every dimension. It splits along X
into two runs above 25 m2, so it has 1 or 2 slabs.

### bridge-crane

Two runway beams along local Z, `span` apart and `travel` long, their undersides `railHeight`
above the floor; a bridge of two girders on two end trucks; a trolley on the girders; and a
hook block that hangs free under the trolley, its underside `hookDrop` below the runway beams'
undersides.

- Slabs: the +X runway's web and flange, the -X runway's web and flange, in `runwayColor`; the
  +X and -X end trucks on the runway webs; the +Z girder's web and flange, the -Z girder's web
  and flange, butting the trucks' inner faces; the trolley from the hollow layout on the girder
  webs' tops; the hook block.
- `bridgeAt` places the trucks along the runway from the -Z end, so at 0 and 1 they end flush
  with it. `trolleyAt` places the trolley between the trucks from the -X end.
- The hook block's top is at most `railHeight`, so it touches nothing.
- 16 slabs, 20 above a travel of 40 m.

### jib-crane

A four-panel mast on a plinth, with a boom along local +Z whose underside is `height` above
the floor and whose tip is `boom` from the mast's centre.

- Slabs: the plinth, facing up; the mast's +X and -X sides and its +Z and -Z ends, open at the
  top; the boom's web and flange from the mast's +Z face to the tip; the tie; the hoist.
- The tie is pitched down from its anchor on the mast's face to its foot on the web's top and
  lies on the upper side of that line.
- The hoist hangs from the flange's underside near the tip.
- No slab splits: 9 slabs.

### light-strip

One metal slab `width` by `length` and `LIGHT_STRIP_DEPTH` thick, facing `down`, whose
underside hangs `height` above the floor under `at`. It glows with its required `glow` and
reads as a thin bright line along or across the hall. 1 slab.

## Placement rules the kinds satisfy

- `support`: every standing kind touches its floor with its lowest slabs. A light strip, a
  bridge crane's hook and a jib crane's hoist keep their undersides `LEAST_HANG` or more above
  the floor.
- `low-top`: no slab tops out lower than 0.55 m above the floor. The lowest are a conveyor's
  skirt and strip at H - 0.05, from 0.55 m; an arm's head tops out at 0.58 m at reach 3.5,
  shoulder 30 and elbow 60; a jib's plinth tops out at 0.6 m.
- Every standing footprint is straight-sided to 0.03 m: the arm's links lie between its
  pedestal's side planes and only the accent steps out, a jib crane stands on its plinth alone,
  and a bridge crane has no standing footprint.
- A hollow kind closes its interior; a conveyor's open ends lead under a deck at most 1.15 m
  high, which the player's capsule cannot enter.

A roof that starts at 2.17 m or higher is no standing slab. That holds for every container,
whose roof starts at 2.54 m, for a metal enclosure from a height of 2.22 m and for a concrete
one from 2.27 m, the default 2.4 m included. The standing footprint of such a prop is its
ring of walls, not its outline.

Such an enclosure's long sides stand 0.03 m, the eave, inside the outline. Without a glow its
standing footprint is therefore 0.06 m narrower than `width`, and two of them typed 0.68 m
apart measure 0.74 m for `gap`. With a glow the bands bring the footprint back to `width`.

## Testing

The kit's tests run through the facade. One shared check expands a prop on a site, rounds the
slabs as the pipeline does and checks the slab count, the slab admission, a separating-axis
overlap of at most 1 mm, unit rotations, tops at 0.55 m or higher and the lowest point.

- The corner tests run it for every kind at every corner of its parameter ranges and at each
  split threshold, at the origin and on an off-grid site at an odd yaw, with the outward rule
  or each slab's stated side.
- The arm's ranges are proven at the corners, on a grid every 10 degrees at three reaches and
  on a seeded, edge-biased sample of reach, shoulder and elbow at random sites. Each pose also
  keeps its links above the floor and between the pedestal's side planes.
- The crane tests check the hook and the hoist at 2.5 m or higher, the 2.4 m rise, the hook at
  its limit and the runway's split.
- The layout test compares each kind's slabs with stated sizes, base centres, axes and colours,
  pins the pitch's sign and the tie's two contact edges, and places a stated conveyor.
- The parameter test covers every problem form, the `hookDrop` limit and the kind listing.

Its dependency document is the
[level-format knowledge](../../level-format/docs/KNOWLEDGE.md).
