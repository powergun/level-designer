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
  its type, its range or its choices, and its default. It is a listing of every kind for
  authors.

## Units

- `admit`: the admission of a prop's kind and parameters, the parameter specs, and the
  `kind` and `param` problems.
- `frame`: slab roles in the prop frame, the six facings, the split of a role into runs and
  the placement of a slab on its site.
- `kinds`: the kind tables, their named dimensions and the shared hollow box layout.

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

Ranges compare exactly, with no slack: a parameter typed at its limit parses to the limit's
own number and passes. The format's length slack serves limits that a value reaches by
arithmetic, which a typed parameter never does. A glow passes when `glows` names it, and
every kind requires `color`. Paths follow `keyPath` and every "got" part follows
`describeValue`, both from `@level-designer/level-format`, so the kit's messages share the
format's path rule and value rendering.

## Frame and origin

The prop frame is right-handed: +Y up, the length along local +Z and the width along local +X.
Its origin lies on the floor under `at`, at the centre of the prop's plan outline. A prop
spans x from -width/2 to +width/2 and z from -length/2 to +length/2; a partition spans z from
-thickness/2 to +thickness/2, and a crate uses `size` for width, length and height. A standing
kind has its lowest slabs at y = 0. A light strip has its underside at y = `height`.

Placement turns the prop frame by the yaw about +Y and moves it onto the floor under `at`. A
yaw `a` turns a frame vector (x, y, z) into (x cos a + z sin a, y, -x sin a + z cos a), so a
yaw of 90 degrees turns local +Z to world +X and local +X to world -Z. A slab's world rotation
is the yaw quaternion `[0, sin(a/2), 0, cos(a/2)]` times the slab's facing quaternion, yaw on
the left.

## Slab roles and facings

A kind states each slab as a role: a box of the prop frame, a facing, a material and, for a
glow slab, the glow name. A slab's own frame has its width along +X, its height along +Y from
its base and its thickness along +Z, toward the painted +Z face. Its origin is its base
centre. The facing names where the slab's +X, +Y and +Z axes point in the prop frame:

- `+Z`: +X, +Y, +Z; the identity quaternion.
- `+X`: -Z, +Y, +X; a yaw of 90 degrees.
- `-Z`: -X, +Y, -Z; a yaw of 180 degrees.
- `-X`: +Z, +Y, -X; a yaw of 270 degrees.
- `up`: -X, +Z, +Y; the +Z face looks up.
- `down`: +X, +Z, -Y; the +Z face looks down.

The slab's size is the box's extent along those three axes. Its base centre is the middle of
the box with the height axis at its minimum, so a lying slab has its base at its -Z end.

## The outward rule

destruction lib's mesher tints a slab's -Z face 20% toward a light grey, so every slab turns
its +Z face to where a player sees and shoots it:

- a side panel of a hollow kind faces away from the prop's vertical centre axis;
- a deck, a roof and a lid face up, with the tinted face inside the prop;
- a hanging slab faces down, toward the floor it is seen from;
- a glow slab faces away from the panel it is mounted on;
- a partition has no inside: its +Z face looks along local +Z, and the author turns it to the
  main lane with `yaw`. Adding 180 degrees swaps its faces, and the back face reads clearly
  lighter on a dark colour.

## The joint rule

- Slabs meet in butt joints at zero distance: their contact planes coincide. No slab enters
  another, and no joint has a mitre or a gap.
- A top runs through over everything below it. Sides and ends butt its underside.
- At a vertical corner the +X and -X sides run through over the full length, and each end
  butts between their inner faces.
- The runs of a split slab butt end to end on the cut plane.
- A glow slab butts the outer face of its panel with its back.

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
- Only an enclosure's and a container's roof and long sides, and a partition, can split, and
  never into more than two runs.

## Slab order

Slab order names the mesh nodes, so it is part of the contract. Roles come in the order each
kind lists them below; +X comes before -X and +Z before -Z; the runs of one role ascend along
the run axis; glow slabs come last.

## Colour, material and glow

Every slab takes the prop's `color`. A slab's material is its kind's fixed material or its
`material` parameter. A glow slab is always metal, also on a concrete enclosure, and carries
the glow name of the prop's `glow` parameter. A glow only adds slabs: the other slabs are the
same with and without it, so the outline never depends on `glow`.

## Named dimensions

- `PANEL`, 0.05 m: the thickness of every metal and wood panel. The game's collision was
  measured on a 4 x 2 x 0.05 m panel, and a thicker panel only widens the dead edges.
- `CONCRETE_PANEL`, 0.10 m: the thickness of a concrete enclosure's panels, the thinnest
  partition the format admits, so a blast hole shows cast concrete, not sheet.
- `GLOW_DEPTH`, 0.03 m: the thickness of a glow slab and the depth of the eave that houses
  it. It keeps every face within 0.03 m of the outline the parameters state.
- `CONVEYOR_STRIP_HEIGHT`, 0.08 m: the face height of a conveyor's light bar, a line about
  four pixels high at 10 m.
- `ENCLOSURE_BAND_BASE`, 1.2 m: chest height on the player. It clears the tallest conveyor
  deck, and bands of enclosures of any height form one line along an assembly line.
- `ENCLOSURE_BAND_HEIGHT`, 0.10 m: a band, not a window, on a machine 1.5 to 3.5 m tall.
- `LIGHT_STRIP_DEPTH`, 0.08 m: a batten housing. Down a long hall the player sees its edge
  more than its underside, so the edge is deeper than a panel.
- `CONTAINER_WIDTH` 2.44 m and `CONTAINER_HEIGHT` 2.59 m: the format's fixed cross section.

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

### light-strip

One metal slab `width` by `length` and `LIGHT_STRIP_DEPTH` thick, facing `down`, whose
underside hangs `height` above the floor under `at`. It glows with its required `glow` and
reads as a thin bright line along or across the hall. 1 slab.

## Placement rules the kinds satisfy

- `support`: every standing kind touches its floor with its lowest slabs. A light strip hangs
  2.5 m or more above its floor.
- `low-top`: every standing slab tops out 0.5 m or higher. The lowest is a conveyor's skirt
  and strip at H - 0.05, from 0.55 m.
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

The kit's tests run through the facade. The corner test expands every kind at every corner
of its parameter ranges and at each split threshold, at the origin and on an off-grid site at
an odd yaw. It rounds the slabs as the pipeline does and checks the slab count, the slab
admission, a separating-axis overlap of at most 1 mm, the outward rule and the floor contact.
The layout test compares each kind's slabs with stated sizes, base centres and facing axes,
and places the conveyor of a stated example. The parameter test covers every problem form
and the kind listing.

Its dependency document is the
[level-format knowledge](../../level-format/docs/KNOWLEDGE.md).
