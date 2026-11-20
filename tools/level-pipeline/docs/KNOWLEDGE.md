# level-pipeline knowledge

`@level-designer/level-pipeline` owns the build sequence from one level description to
one built level, and the validation of a built level into a report. `level-cli` and the
QA server are its consumers.

## The read

`readInputs` reads the description file at a given path and the base stage through
sec111-gateway's stage entry. A description file that cannot be read is an outcome with
its path and the reason, so the tool can name it. A missing base stage means a broken
sec-111 install and throws. `COMMITTED_DESCRIPTION` is the path of
`levels/dark-factory.json`, the default of every command.

## The build

`buildLevel` takes the description bytes and the base stage, and runs seven steps:

1. admit the description text with `level-format`;
2. assemble the static scene with `level-glb`: the base stage under the scaled root, the
   base look and the seals, a flat seal with its own look and a painted seal with its paint
   keys, the body of its finish path and the description's glows;
3. prepare the static scene with sec-111's `prepareLevel` and the empty wall list
   `{"walls":[]}`;
4. place and expand every prop with `prop-kit` on the floor under its `at`, read with
   `floorHeightAt` from the prepared static level, with the description's glows and
   finish table, so each slab carries its finish path, number, seed and wear; then round
   every slab once with `roundSlab` and admit all slabs with `admitSlabs`;
5. place every static object once, in description order, as "The placement" states;
6. mesh every rounded slab with `slab-model`, with its colour and pattern data per vertex;
7. append with `level-glb` one object per static object, then one per prop, each slab and
   box drawn with the material of its finish path and glow; then encode the level `.json`,
   finish table included, with `level-format`.

Step 2 gives `level-glb` the body of every finish path a painted seal names, and step 7 that of
every path a slab or a static object names, both read with `level-format`'s `recipeAt` by one
reader. The level scene learns a painted seal's material from the static scene. The pipeline
holds no finish default and no `extends` rule.

A given prepared static level replaces step 3; it must be the preparation of the same
static scene. The tests of one file share one preparation this way.

A built level holds the typed description and its hash, the first 12 hex digits of the
SHA-256 of the description bytes; the level GLB, the `.json` text and the typed level;
the base stage's image count; the prepared static level as sec-111 returns it, typed and as
its two files; and the placed static objects. The pipeline stores none of the hall facts it
reads.

## Game dressing

`buildDressing` takes the same inputs as `buildLevel` and follows steps 1 through 5.
The game consumes the rounded slabs and placed floor boxes directly. The two JSON files
share the level frame: metres, +Y up, positive yaw about +Y in degrees.

### Destructible props

`props.json` (`factory-props/1`) holds `props` in description order. Each record carries
its id, kind, plan point `at` as [x, z], floor height, yaw, authored parameters and slabs
in generator order. The [prop kit](../../../packages/prop-kit/docs/KNOWLEDGE.md)
describes each kind's generator, defaults and splitting rules.

Each slab carries size [width, height, thickness], destruction material, sRGB tint, world
base centre `position`, local-to-world quaternion `rotation` as [x, y, z, w], and the
finish path, number, seed and wear. The prop id and zero-based slab index identify a
slab. Apply each slab pose directly in the level frame. A prop's `params.glow` names
the emission colour and strength for the lit parts of its slabs.

### Floor decorations

`decorations.json` (`factory-decorations/1`) holds `objects` in placement order.
Each entry is a draw-only floor box with a world `center`, full `size`
[width, height, length], yaw, id, tint and paint keys. The centre includes the sampled
floor height and half the object's height.

### Shared finishes

The prop sheet owns the `finishes` dictionary keyed by paths used by either sheet.
Each value holds the resolved body, ordered layers, fallback light colour and cut
material. The layers are the painter's typed inputs, including defaults, inherited
layers and lengths in metres with optional face-relative shares. The `glows` dictionary
maps the names in use to linear RGB colours and strengths.

## The placement

The pipeline owns the one placement of the static objects. Each placed static object pairs
the description's record with its box, `level-format`'s `staticBox` at the height of its
underside, unrounded. `staticClass` of `level-format` names the class:

- floor litter and an overhead object stand over the floor under `at`, read with
  `floorHeightAt`, raised by the lift;
- litter on a prop stands on its support: the highest top of that prop's rounded slabs whose
  plan outline holds `at`.

A top is the level upper face of a slab: its four highest corners lie within the format's
length slack of the highest, so a pitched slab has none. Its plan outline holds `at` when the
offset from the slab's centre, along each of its two flat axes, stays within that half extent
plus the slack. A top replaces the one held only when it stands higher by more than the slack,
so a tie keeps the first in slab order.

The built level keeps the pairs for the validation. The support, the prop's id and the slab's
index, goes only to `level-glb`, which names the slab's mesh node in the static object's
`extras`.

## Build errors

The build stops at the first step with errors and returns all of them. Each error holds
its rule, its path and its message. The message starts with the path, except the slab
count cap's and `prepare`'s. The steps raise these rules:

- the admission: `shape` and `id`, from `level-format`;
- the static scene: `base`, from `level-glb`'s base name errors;
- the preparation: `prepare` at the path `$`, with the message `sec-111 level preparation
  failed: ` followed by the message of the error sec-111 throws;
- the props: `place` from the pipeline and `kind`, `param` and `finish` from `prop-kit`,
  all in description order;
- the slab admission: `slab`, from `level-format`;
- the placement: `place` from the pipeline, in description order.

The pipeline owns `place`: a prop whose `at` lies outside the interior's plan, with the
format's length slack, yields `props[<i>].at: (<x>, <z>) lies outside the interior`, and
that prop is not expanded. The message shows each length with `level-format`'s
`formatLength`. A static object takes the same interior test first,
`statics[<i>].at: (<x>, <z>) lies outside the interior`, and a litter on a prop with no top
under its `at` yields `statics[<i>].at: (<x>, <z>) lies over no top of prop <id>`.

sec-111 cannot reject the empty wall list, so a rejected preparation is a defect and throws.

## The validation

`validateLevel` inspects the level GLB with `level-glb`, passes the six facts, the placed
static objects among them, to `level-rules`' judgement and shapes the report as a value of
four parts:

- the hall facts: the interior and the floor heights of the prepared static level, the ramp
  zone of the judgement, and the spawns by name from `level-rules`;
- the findings of the judgement, in its order;
- the summary: triangles beside `level-rules`' triangle cap, point lights beside
  `level-format`'s point-light cap, the boxes of the body world's floors, obstacles and
  enclosure beside sec-111's body box limit, each minion lane's width beside the width it
  keeps, and slabs and props beside the first-pass budget;
- the verdict: accepted when the report holds no finding.

The pipeline owns the first-pass budget, 800 slabs in 200 props. The report prints it, and
it never rejects a level. `level-cli` prints the report as text.

## What the tests prove

One test file holds every case that builds, on the real base stage. It makes two full
preparations, the fixture's static scene and the fixture's level GLB handed whole to
`prepareLevel`, plus one call that sec-111 refuses at once. A spy on the stage entry
counts the calls, and each step that calls the preparation asserts its own count, so no
test order changes the proof. Every other build passes the fixture's prepared static
level, and each such build asserts that the count did not change.

### The fixture build

- The fixture builds: a flat end-wall seal and a painted, glowing door seal, one crate on
  each floor level, a floor litter, a hung sign and a litter over the raised slab's crate's
  side. sec-111 prepares its static scene with the painted seal, the preparation measures
  scale 1, the crates stand at 0 and 0.3241 m, every slab lies on the grid, the `.json`
  decodes to the same level, and today's `prepareLevel` admits the whole level GLB, static
  nodes included.
- The painted seal draws with the body that its path's role extends, read through the table,
  and emits its glow at the glow's strength times the body's `lit`.
- The static objects stand between the two seals and the props. The crate's litter lies on
  the lid, the higher of the two tops under it, and names the lid's mesh node; the others carry
  no support. The floor litter and the sign stand over the floor under `at` plus the lift.

### Blocked builds

- A description error and an unknown base name block the build before any preparation.
- A hand-built GLB with an empty scene, which sec-111's survey refuses at once, blocks
  with `prepare`.
- The props step reports `place`, `kind` and `param` in description order, and `place`
  passes at the interior's edge and blocks 0.1 mm beyond.
- 205 crates block with the slab count cap.
- A static object outside the interior blocks with `place`. A litter on the lid's edge
  builds, and 0.1 mm beyond it blocks with `place`.

### The validation

- The fixture is accepted, and its report holds the hall facts and the body boxes beside
  sec-111's limit.
- A point light moved under the floor is rejected with `light-floor` alone, and a floor
  litter 0.16 m high with `static` alone.
- 201 light strips beside the crates exceed the prop budget, and the level is still
  accepted with its counts beside the budget.

### Fixtures and the other tests

The fixture's finish table holds the paths of a crate, a light strip, the litter and the
door seal, and its glows the one glow that the strips and the seal name. A test
that replaces the props also clears the static objects.

The top rule's unit test reads hand-built slabs: a level face of any facing, none on a
pitched slab, the edge and the slack of the outline on a turned slab, the highest top, and a
tie that keeps the first.

The committed test builds `levels/dark-factory.json` with one preparation. The level is
accepted, and every material of a `luminaire/` path names a glow and emits its colour at
its strength. The glows that the written materials carry, on any path, are those the seals,
the props and the static objects name.

The read test writes a description into a temporary folder, reads it back, names a
missing file and removes the folder.

Its dependency documents:

- [level-format knowledge](../../../packages/level-format/docs/KNOWLEDGE.md);
- [level-glb knowledge](../../../packages/level-glb/docs/KNOWLEDGE.md);
- [prop-kit knowledge](../../../packages/prop-kit/docs/KNOWLEDGE.md);
- [slab-model knowledge](../../../packages/slab-model/docs/KNOWLEDGE.md);
- [level-rules knowledge](../../../packages/level-rules/docs/KNOWLEDGE.md);
- [sec111-gateway knowledge](../../../packages/sec111-gateway/docs/KNOWLEDGE.md).
