# Level format

The level designer has one authoring input, the level description, and one output, the
level pair: a `.glb` and a `.json`. This document defines both, the lighting rules a
renderer follows, the validator's checks, and what sec-111 changes to play the pair.

## Frame and units

- Lengths are scaled metres. The frame is right-handed with +Y up, and its origin is the
  base stage's origin. The back wall is at -Z and the sealed end at +Z.
- Angles in the description are degrees. Rotations in the pair are unit quaternions
  `[x, y, z, w]`, local to world; a unit quaternion or vector is within 0.000001 of 1 long.
- Surface colours are `#rrggbb` sRGB text. Light, glow and tint colours are linear RGB
  triples from 0 to 1.
- Light intensity is candela for points; haze density is per metre.

## The level description

The description is one JSON file that an agent edits by hand, `levels/dark-factory.json`.
A record takes exactly its listed keys; an unknown or missing key is an error at its path.
The file stores decisions; the build derives floor heights, slab poses, meshes and seeds.

The root keys are `schema`, `name`, `base`, `seals`, `finishes`, `glows`, `props` and
`lighting`. The schema id is `level-designer-description/1`; a breaking change replaces
the shape in place. `name` names the output files and is spelled like an id. An id is
lowercase letters, digits and hyphens, starts with a letter and holds at most 48
characters; ids are unique among seals and props.

### Base stage

`base` owns the scale and the look of the base stage. sec-111's view audit seeds the
look once; the art pass then retunes it for the dark factory.

- `scale` is the stage-to-world scale of the base stage, a positive number: 3.89956. The
  build scales the base by it, and the `scale` rule proves it: sec-111 must measure the
  static scene at exactly 1.
- `materials` maps a base material name to an override. An override may set `tint` (a
  factor on the base colour), `metalness` and `roughness` from 0 to 1, and `emissive`
  with a `color` and a `strength` from 0 to 100. An omitted key keeps the source value.
- `doubleSided` lists the base mesh names that stay double-sided, spelled as the base
  stage's GLB spells them. Every other base mesh renders front faces only.

A name the base stage does not hold is an error. The base stage's fixtures stay base
geometry; their `emissive` override dims or tints all of them together.

### Seals

`seals` lists at most 16 boxes that close the hall; the hall takes 13, which the build
plan lists. A seal is static, visible and indestructible.

- `id`, `min` and `max`: an axis-aligned box in the level frame, at least 0.05 m thick;
- `color`, and `metalness` and `roughness` from 0 to 1: its flat look.

### Finishes and glows

`finishes` gives `metalness` and `roughness`, each from 0 to 1, for each of the four
materials: `wood`, `brick`, `concrete` and `metal`. A slab's colour comes from its prop;
its surface response comes from its material's finish.

`glows` is an object keyed by glow name, with at most eight entries. Each entry has a
`color` and a `strength` from 0 to 100. A prop that takes a `glow` parameter names one.
A glowing slab keeps its finish and adds the glow as emissive colour and strength. New
light fixtures are glowing slabs.

### Props

`props` lists at most 512 props. Each prop has five keys:

- `id`: the prop's stable name;
- `kind`: one of the nine kinds below;
- `at`: `[x, z]`, the plan position of the prop's origin;
- `yaw`: degrees about +Y; at 0 the length runs along +Z; a positive yaw turns it to +X;
- `params`: the kind's parameters by name, such as `{ "length": 8, "color": "#3b4046",
  "glow": "cyan" }` for a conveyor.

A prop's frame has +Y up, its length along local +Z and its width along local +X. A
bridge crane's origin is the centre of the rectangle between its runway beams. A robot
arm's is the centre of its pedestal and a jib crane's the centre of its mast; both
reach along local +Z. Every other kind's origin is the centre of its plan outline. The
build drops the origin onto the floor under `at`, and a hanging kind measures its height
from that floor. Every kind takes `color`. In the lists below a value in brackets is the
default; a parameter without one is required. A missing required parameter, an unknown
parameter and a value outside its range are errors that name the range.

The lists fix each kind's parameters and slab count. The kind tables in `prop-kit` own
every secondary dimension, such as a panel's thickness or a beam's depth, and a reviewer
judges them against the references. Any slab face above 25 m2 or side above 40 m is
split into the fewest equal runs that the slab admission accepts once they are rounded
to the grid. Every panel turns its +Z face outward, because destruction lib's mesher
tints the -Z face: a deck, a roof, a lid and a plinth face up, a hanging slab and a
flange face down, a side of a hollow part faces away from that part's vertical axis, and
a partition faces local +Z. A kind names the side of its other two-faced slabs.

Three rules keep every parameter corner inside the placement rules. No slab tops out
lower than 0.55 m above the floor, clear of `low-top`. A hanging part keeps its underside
2.5 m or more above the floor under `at`; the hall's floors differ by 0.3241 m, so it
clears the 2.17 m of `support` over both. An arm's links and a jib's tie are pitched:
each keeps the facing `+X` and turns about local X. Slabs that meet at an angle touch
along one edge, and neither enters the other.

Assembly line kinds, all metal unless stated:

- `conveyor`: `length` 1 to 12, `width` 0.6 to 1.6 (0.8), `height` 0.6 to 1.2 (0.9),
  optional `glow`. A deck on two skirts that stand from the floor to the deck; a glow
  adds one strip under each deck edge. 3 or 5 slabs.
- `enclosure`: `width` 1 to 6, `length` 1 to 8, `height` 1.5 to 3.5 (2.4), `material`
  `metal` or `concrete` (`metal`), optional `glow`. Four sides and a roof; a glow adds
  one band on each long side, the two sides along the length. 5 or 7 slabs before
  splitting; the roof and each long side split in two above 25 m2, so 5 to 10 slabs.
- `robot-arm`: `reach` 1.5 to 3.5 (2.5), `shoulder` 30 to 90 degrees (55), `elbow` 60 to
  160 degrees (100), optional `baseColor` for the pedestal, optional `glow`. A hollow
  pedestal, then shoulder, upper arm, forearm and head: four thick slabs that face local
  +X, as thick as the pedestal is wide and between its side planes. The upper arm rises
  `shoulder` degrees above local +Z, `elbow` is the angle between it and the forearm,
  which the head continues, and `reach` is the length of the three from the shoulder to
  the head's tip; within these ranges the forearm never points back and no link meets
  the floor. A glow adds an accent block on the head's +X face. 9 or 10 slabs.

Storage and cover kinds:

- `container`: `length` 3 to 12.2 (6.06). Metal, 2.44 m wide and 2.59 m high: four sides
  and a roof. 5 to 8 slabs.
- `crate`: `size` 0.6 to 1.8 (1.2). Wood: four sides and a lid. 5 slabs.
- `partition`: `width` 1 to 8, `height` 1 to 4, `thickness` 0.1 to 0.6 (0.3), `material`
  any of the four (`concrete`). One thick slab, or two above 25 m2.

Overhead and light kinds, all metal:

- `bridge-crane`: `span` 10 to 30, `travel` 10 to 60, `railHeight` 6 to 15.5, `bridgeAt`
  and `trolleyAt` 0 to 1 (0.5), `hookDrop` 0.5 to 8 (2), optional `runwayColor` for the
  runway beams. Two runway beams along local Z, `span` apart and `travel` long, with
  their undersides `railHeight` above the floor. Two girders on two end trucks cross
  them at `bridgeAt` of the travel, from the -Z end; a trolley rides the girders at
  `trolleyAt` of the span, from the -X end; a hook block hangs free under the trolley,
  its underside `hookDrop` below the runway beams' undersides. Beams and girders are a
  web over a bottom flange. A runway web and an end truck face the crane's centre line,
  a girder web faces away from the other girder, and the hook block faces local +Z. The
  crane rises at most 2.4 m above `railHeight`. 16 slabs before splitting.
- `jib-crane`: `height` 3 to 8 (5), `boom` 2 to 8 (4). A four-panel mast on a plinth; a
  boom as web and flange, its underside `height` above the floor and its tip `boom`
  from the mast's centre; a tie from the mast down to the boom; and a hoist that hangs
  at most 0.5 m below the boom. The web, the tie and the hoist face local +X. 9 slabs.
- `light-strip`: `length` 0.5 to 12, `width` 0.1 to 0.6 (0.2), `height` 2.5 to 17,
  required `glow`. One horizontal slab whose underside hangs `height` above the floor.

### Lighting

`lighting` has the same shape in the description and in the level `.json`. It holds
exactly the values the renderer consumes.

- `environment`: `intensity`, and the colours `ambient` and `overhead`;
- `key`, optional: `color`, `intensity`, `direction` (a unit vector from the hall toward
  the light, with positive Y) and `shadow`;
- `shadow`: `mapSize` (1024, 2048 or 4096), `bias` from -0.01 to 0.01, `normalBias` from
  0 to 1 and `radius` from 0 to 16;
- `points`: 0 to 8 entries with `position`, `color`, `intensity` and `range`;
- `haze`: `density`, `color` and `glow`;
- `exposure`: a positive number.

Intensities, ranges, the haze density and the haze glow are not negative. Bloom, grade,
lens and x-ray stay game-owned and have no field.

## The level pair

### The GLB

`level-glb` owns this contract and asserts every sentence of it on the files it writes.
The file must pass the reader of today's sec-111 level preparation; a pipeline test
hands that reader a whole file.

Container and scene:

- The file is a glTF 2.0 binary with one JSON chunk, one BIN chunk and one buffer. It
  requires no extension and uses no Draco, meshopt, KTX2 or `KHR_lights_punctual`.
  `KHR_materials_emissive_strength` may be used.
- The default scene's first root is the node `stage`. Its matrix is the uniform scale
  `base.scale`, and its children are the base stage's roots. The base nodes, accessors,
  images and buffer bytes are verbatim, so the four survey planes are untouched.
- Every other scene root is an object node: one per seal, then one per prop, in
  description order. Its `extras` carry `role`: `seal`, or `destructible` with `prop`,
  the prop id. Its name repeats the id for people. Base nodes carry no role.
- An object node's children are mesh nodes named `<id>/<index>`, counted from 0: one for
  a seal, and one per slab in slab order for a prop. A slab keeps its own node because
  sec-111 hides one slab at that slab's first damage.
- A node transform is a `matrix` or absent. New geometry is stored in level coordinates
  and has no transform, so every reader sees it where it stands.

Meshes and materials:

- Each mesh of an object has one primitive. Every primitive of the file is an indexed
  triangle list with a FLOAT VEC3 `POSITION` and a material, and the whole file holds at
  most 300,000 triangles.
- A seal is a box of 12 triangles with normals. A slab primitive carries `NORMAL` and a
  linear `COLOR_0`, and no texture coordinate.
- Base materials keep their indices, take the description's overrides and become
  single-sided. A base mesh listed as double-sided points to a double-sided twin of its
  material. The other appended materials are one per seal, one per finish in use, and
  one per pair of finish and glow in use.

The intact mesh of a slab comes from destruction lib's wall mesher at core's default
chunk width, moved by the slab's pose, so its triangle count equals what the game builds
for the undamaged slab. The mesher paints the +Z face with the slab's colour, the -Z face
with a light tint of it, and the four edge faces with the model's inner colour, which the
shared builder sets to the slab's colour.

### The level `.json`

`level-format` owns this shape and its one canonical text. The schema id is
`level-designer-level/1`. The root keys are `schema`, `props` and `lighting`. `props`
holds the props in description order; a prop has an `id` and `slabs`, a list of at least
one slab. `lighting` is the section above, copied from the description.

A slab is one destruction lib wall model: a box, one material, one rigid pose, five keys:

- `size`: `[width, height, thickness]` in metres. Each side is 0.02 to 40 m, and the
  face, width by height, is at most 25 m2.
- `material`: `wood`, `brick`, `concrete` or `metal`.
- `color`: the colour of the slab's faces and, in destruction lib, of its metal debris.
- `position`: the world position of the slab's local origin, its base centre: X and Z
  centred, Y at the base.
- `rotation`: the unit quaternion from the slab's frame to the level frame.

The file holds at most 1,024 slabs. That cap and the size caps follow destruction lib's
measured costs. `level-format` holds them in one slab admission, which the decoder and
the build both call; no other component checks them.

Slab values lie on a grid: lengths at 0.1 mm, quaternion components at nine decimals.
`level-format` owns the grid and the rounding to it. The pipeline rounds every slab
once, right after expansion, and the mesh, the rules and the proof read the rounded
slabs. The encoder only formats: it fixes the key order and ends the text with a
newline. Decoding an encoded level therefore returns the same level, and equal
descriptions give equal bytes on one host.

### Stored and derived facts

Each fact has one stored home. The description stores every authoring decision, the base
stage's scale among them. The GLB stores geometry, the intact look and the roles. The
`.json` stores the slab descriptions, their grouping into props, and the lighting.
Everything else is derived:

- `prop-kit` derives slab sizes and poses from kind parameters and the prepared floor;
- `level-format` reads a slab as an oriented box, and `slab-model` derives the model
  and the intact mesh;
- a consumer of the pair derives the link between a slab and its mesh node from the
  prop id and the slab order;
- sec-111 derives the model seed and tuning, chunk layout, blockers, footprints and
  ragdoll statics from the slabs;
- sec-111 derives interior, floors, both collision worlds, spawns, the navmesh and the
  acoustic faces from the GLB. The level designer reads them from the prepared static
  level and stores none.

## Lighting mapping rules

Both renderers, `level-view` now and sec-111's view at adoption, follow these rules.

- Environment: a back-faced sphere of radius 10, coloured over the unit direction's `y`
  as `ambient * (0.4 + 0.6 * smoothstep(-0.7, 0.05, y)) + overhead *
  smoothstep(-0.1, 0.9, y)`, baked by the PMREM generator with blur 0.04.
  `environment.intensity` scales it.
- Key: one directional light of the given colour and intensity, placed along `direction`
  and aimed at the centre of the interior box. Its orthographic shadow volume fits the
  interior box in the light's frame, with no pad. Only a vertical key keeps the casters
  above the interior out of that volume; the roof shadows a tilted key. The shadow is
  static PCF with the stored map size, biases and radius; it renders once.
- Point: a point light of the given colour, candela intensity and range, decay 2, no shadow.
- Haze and exposure overwrite the same fields of the game's post configuration.
- The clear colour is the game's constant (0.004, 0.005, 0.007), copied in `GAME_VALUES`.
- Every level mesh casts and receives the key's shadow with two-sided shadow faces,
  filters textures at anisotropy 8, and freezes its matrix. Sidedness and emissive
  strength come from the GLB materials.
- The light set is complete before the first compile and never changes afterwards.

An emissive surface lights nothing by itself. A strip that must light its surroundings
needs a point light beside it, within the cap of eight.

## Validator checks

The validator judges a built level. The build errors and `prepare` block the build, and
`level-pipeline` collects them. Every other rule is a check of `level-rules` over five
facts of a built level: the typed description, the typed level, the inspection of the
level GLB, the base stage's image count and the prepared static level. From the
description the checks read only `base.scale`, the seals and each prop's `at`.

A finding names its rule, its subject and a message, and every finding fails the level.
The subject names what the author changes: the prop id, and the first prop's for a pair
of props; the seal id; the mesh name; `lighting.points[<i>]`; `base.scale` for `scale`;
the spawn name for `lane`; and `level` for `triangles`, `texture` and `proxies`. Findings
come in the order of the rules below, and within a rule in description order.

Every limit below compares with a slack of 0.05 mm, or 0.00005 m2 for an area, so a
value typed at its limit passes. `level-format` owns the slack as `LENGTH_SLACK` and the
one rendering of a length in a message, `formatLength`: the length on the 0.1 mm grid of
the slab rounding, printed as `String` prints it, with no unit. Every message below shows
its lengths and coordinates through it, and a count with thousands separators.

A slab index `<k>` counts from 0. The spawns are named `player` and, for the minions in
sec-111's order, `+x+z`, `-x+z`, `+x-z` and `-x-z`. The measurements quoted below, on the
player capsule and on the base stage's lanes, are repeated by the tests of `level-rules`.

### Build errors

These block the build. A build error holds its rule, its path and its message, and each
message starts with the path of the offending value. A path names a record key after a
dot, a list item by its index in brackets, and a base material or a glow by its name,
quoted in brackets: `props[3].params.length`, `glows["cyan"].strength` and
`base.materials["Material.003"].tint`. The build stops at the first step with errors and
returns all of them. The steps are the description's admission (`shape`, `id`), the
static scene (`base`), the preparation (`prepare`), the props (`place`, `kind`, `param`)
and the slab admission (`slab`).

- `shape`, owned by `level-format`: `<path>: expected <requirement>, got <value>`. It
  covers keys, types, ranges, the description caps and the lighting caps.
- `id`, owned by `level-format`: `<path>: id "<id>" is already used at <other path>`.
- `kind`, owned by `prop-kit`: `<path>: unknown kind "<kind>"; the kinds are <list>`.
- `param`, owned by `prop-kit`: `<path>: <kind> takes <range or type>, got <value>`. It
  also rejects a `glow` that `glows` does not name, and a `hookDrop` above `railHeight`
  less 2.5 m, as `hookDrop 0.5 to <limit> at railHeight <r>`. That limit is reached by
  arithmetic, so it compares with the length slack and prints through `formatLength`. It
  is judged only when every parameter of the prop passes on its own.
- `base`, owned by `level-glb`: `<path>: the base stage has no material (or mesh) named
  "<name>"`. The path is `base.materials["<name>"]` or `base.doubleSided[<i>]`.
- `place`, owned by `level-pipeline`: `<path>: (<x>, <z>) lies outside the interior`. The
  path is `props[<i>].at`, and the build does not expand that prop.
- `slab`, owned by `level-format`: `<path> slab <k>: <w> x <h> x <t> m breaks <limit>`,
  or `the level has <n> slabs; the format admits 1,024`.

### Outcome rules

sec-111 owns these rules, so the validator judges its outcome and copies none of its
numbers. A failed preparation also blocks the build, because props stand on its floors.

- `prepare`: `sec-111 level preparation failed: <sec-111's message>`. It covers the
  survey of the four planes, the body box limit, the spawn search and the flood seed.
  `level-pipeline` reports the error that sec-111 throws as a build error at the path `$`.
- `scale`: `sec-111 measures scale <s> on the static scene; set base.scale to <value>`.
  It is a finding of `level-rules`. The value is `base.scale` times `<s>`, to the six
  decimals that sec-111 keeps of a scale.

### The owner's checks

- `triangles`: `the level has <n> triangles; the cap is 300,000`.
- `light-inside`: `lighting.points[<i>] at (<x>, <y>, <z>) lies outside the interior`. It
  judges the point's plan position and the ceiling.
- `light-floor`: `lighting.points[<i>] sits <d> m under the floor at (<x>, <z>)`. It
  judges the height against the floor under the point, so a sunk light yields one finding.
- `material`: `mesh "<name>" has a primitive without a material`.
- `texture`: `the GLB holds <n> images beyond the base stage's; add the 1024 px check
  with the first texture owner`. The rule compares the level's image count with the
  base stage's, which the pipeline holds. The first pass creates no texture.

### Placement rules

The level designer owns these rules; their numbers come from sec-111's preparation. The
floor under a plan point is sec-111's `floorHeightAt` on the prepared static level. A
slab's plan outline is the outline of its box seen from above. The floors under a slab
are the floors under its corners, each read 0.05 mm toward the slab's centre, so a slab
that only touches a higher floor's edge stays on its own level.

A prop stands when its lowest point is within 0.01 m of the floor under `at`. It hangs
when its lowest point is 2.17 m or more above the highest floor under its slabs. A
standing slab is a slab of a standing prop whose lowest point is less than 2.17 m above
the floor under `at`. The prop's standing footprint is the union of its standing slabs'
plan outlines. A roof that starts at 2.17 m or higher is no standing slab, so a tall
hollow prop, such as a container, has its ring of walls for a footprint. The ramp zone
is the z extent of the step floors, the floors of the prepared body world after the base
floor and the raised slab; a hall without step floors has none.

- `interior`: `prop <id> slab <k> leaves the interior by <d> m at (<x>, <y>, <z>)`, the
  slab's corner farthest outside.
- `support`: `prop <id> neither stands nor hangs: its lowest point is <h> m above the
  floor; stand it on the floor or hang it at 2.17 m or higher`. `<h>` counts from the
  highest floor under its slabs, the floor that the hang test reads.
- `floor`: `prop <id> spans the floor levels <a> and <b>; keep a standing prop on one
  level`, the lowest and the highest floor under its standing slabs.
- `ramp`: `prop <id> stands on the ramp, z <z0> to <z1>`, the ramp zone that its
  standing footprint reaches into.
- `low-top`: `prop <id> slab <k> tops out <h> m above the floor; a standing slab reaches
  0.5 m or higher`. The player capsule climbs tops up to 0.30 m.
- `overlap`: `props <a> and <b> intersect: slab <i> enters slab <j> by <d> m`. Contact
  up to 1 mm passes.
- `seal`: `seal <id> reaches less than 0.02 m into the interior, so sec-111 cannot see it`.

`floor` and `ramp` judge standing props only; a hanging prop may cross the slab edge and
the ramp. `low-top` reads the floor under `at`. `overlap` names the deepest pair of
slabs of the two props; the depth is the least overlap of the two boxes along a
separating axis. `seal` fails when the part of the seal inside the interior box is
thinner than 0.02 m on an axis.

### Clearance rules

These rules read plan distances between standing footprints, static standing obstacles
and the spawns. A static standing obstacle is an obstacle or enclosure box of the
prepared body world that starts less than 2.17 m above the floor under its centre.

- `gap`: `props <a> and <b> stand <d> m apart; keep a gap under 0.7 m or at least
  1.5 m`. A gap of 0.7 m fails, one of 1.5 m passes, and touching is allowed. The player
  enters a gap of 0.76 m, and the navmesh needs 1.5 m.
- `gap` also holds between a prop and each static obstacle: `prop <a> stands <d> m from
  the static obstacle at (<x>, <z>); keep a gap under 0.7 m or at least 1.5 m`.
- `spawn`: `prop <id> stands <d> m from the <name> spawn; keep 6 m`.
- `lane`: `the main lane from the <name> minion spawn narrows to <w> m near (<x>, <z>);
  it needs <limit> m`.

`gap` judges a pair whose distance is 0.7 m or more and under 1.5 m, and only where a
player fits between the two. A crossing is the shortest segment between the two
footprints, or a segment from one that meets an edge of the other at a right angle; its
lane is the rectangle 0.7 m wide along it. The pair fails when a crossing in that range
has a free lane, one that overlaps no other standing footprint or static obstacle. `<d>`
is the shortest such crossing, and the point is its end on the obstacle. Crates in a
row, chained conveyors and a prop against a wall of several body boxes therefore pass.

The rule has limits. A pair nearer than 0.7 m is not judged, so touching props that open
into a wedge get no finding. A wall of flush body boxes can report one gap once per box.
A pocket only 0.36 m deep still fails: a notch beside a shorter crate, a corridor mouth.

The rules measure footprints, not the outlines that the parameters state. A tall
enclosure's long sides stand inside its roof's edge by the eave, so without a glow each
such side adds the eave to the gap that the typed outlines suggest. `gap` judges a pair
by its nearest parts and never counts the pair's own parts as filling, so a footprint
whose side steps back could hide a pocket beside the step or report a filled gap past
its own part. The kinds keep every standing footprint straight-sided to 0.03 m, which
leaves a slot of at most 0.73 m, too narrow for the capsule: an arm's links lie between
its pedestal's side planes, a jib crane stands on its plinth alone, and a bridge crane
has no standing footprint.

A main lane is the widest route from a minion spawn's cell to the player spawn's cell,
on a plan grid of 0.1 m cells that starts at the interior's lowest x and z:

- a cell is blocked when a static standing obstacle or a standing slab's plan outline
  overlaps it by more than the slack, so a wall thinner than a cell blocks every cell it
  crosses; a cell that reaches outside the interior is blocked;
- a free cell's clearance runs from its centre to the edge of the nearest blocked cell;
- a route steps between free cells that share a side, and its width is twice the least
  clearance along it plus one cell; a spawn without a route has a lane of width 0.

Each lane is measured on the static scene alone and again with the standing footprints.
With them it keeps 3 m, or its width on the static scene alone where that is narrower.
The message gives the measured width and the centre of the route's narrowest cell. On
the base stage three lanes are wider than 7 m and the lane of the +x-z spawn measures
1.8 m, so that lane keeps 1.8 m. The lanes are measured, never authored.

### Destructibility

Destruction lib owns admission and damage, so the validator runs its code on every slab.

- `destructible`: `prop <id> slab <k>: <step> failed`. The proof runs two independent
  trials, each on a fresh model from the shared builder, alone in a collision scene at
  the slab's pose. Each trial casts from 0.2 m outside the +Z face at its centre and
  must hit this slab. The rail must then leave the material gone at the hit; the blast
  must leave it gone and the retained cuboids changed. The message names the first
  failing step of admit, register, aim, rail and blast.
- `proxies`: `destruction lib could not build the level's debris proxies: <message>`,
  from one Rapier sync of all slabs together.

### Report

`level-pipeline` shapes the report as a value of four parts, and `level-cli` prints it:

- the hall facts of the prepared static level: the interior, the floor heights, the ramp
  zone and the spawns by name;
- the findings;
- the summary: triangles against the cap of `level-rules`, point lights against
  `MAX_POINT_LIGHTS` of `level-format`, the boxes of the body world's three groups
  against sec-111's limit, each lane's width beside the width it keeps, and slabs and
  props against the first-pass budget of 800 slabs in 200 props, which the pipeline owns;
- the verdict: accepted when it holds no finding. The budget never rejects.

The printed report has one tab-separated line per hall fact, finding and summary count,
each under its name or rule; the last line is `accepted` or `rejected: <n> findings`. A
blocked build has no report: the tool prints one line per build error, with its rule,
path and message, then `blocked: <n> errors`. Both last lines take the singular for one.

## What sec-111 changes at adoption

Adoption is a later sec-111 task. The pair carries every fact these changes read.

Data and preparation:

- Level contract and codec: props with slabs replace wall placements; the lighting
  section is admitted with its caps; the rendered end-wall role goes.
- Level preparation: it reads the pair, treats `seal` nodes as structure, skips
  `destructible` nodes, applies slab placement rules, and bakes navigation obstacles
  from rotated slab boxes. The walls file is deleted, and the scale becomes 1.
- Assets and tests: the pair joins the assets under its own name; the prepared pair is
  regenerated; tests pinned to the six walls get new fixtures, and the level designer's
  tests pinned to sec-111's committed prepared level are re-pinned.

Runtime and presentation:

- Walls engine: one slab is one single-layer assembly with a full rotation and its own
  material and thickness, metal included; the debris source cap rises to the slab count.
- Wall view: it draws an intact slab from its GLB mesh node, found by prop id and slab
  order, and its own layer view, with a finish per material, from the first damage.
- View: the material audit, the end wall and the hardcoded lighting are deleted. Looks,
  sidedness and emissive strength come from the GLB; lights, haze and exposure come from
  the lighting section by the mapping rules; the stage is no longer scaled.
- Characters and recording: ragdoll statics come from rotated slabs, one per prop; the
  wall codec takes a variable slab count and the slab description.
