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

`buildLevel` takes the description bytes and the base stage, and runs six steps:

1. admit the description text with `level-format`;
2. assemble the static scene with `level-glb`: the base stage under the scaled root, the
   base look and the seals;
3. prepare the static scene with sec-111's `prepareLevel` and the empty wall list
   `{"walls":[]}`;
4. place and expand every prop with `prop-kit` on the floor under its `at`, read with
   `floorHeightAt` from the prepared static level, then round every slab once with
   `roundSlab` and admit all slabs with `admitSlabs`;
5. mesh every rounded slab with `slab-model`;
6. append one object per prop with `level-glb` and encode the level `.json` with
   `level-format`.

A given prepared static level replaces step 3; it must be the preparation of the same
static scene. The tests of one file share one preparation this way.

A built level holds the typed description and its hash, the first 12 hex digits of the
SHA-256 of the description bytes; the level GLB, the `.json` text and the typed level;
the base stage's image count; and the prepared static level as sec-111 returns it, typed
and as its two files. The pipeline stores none of the hall facts it reads.

## Build errors

The build stops at the first step with errors and returns all of them. Each error holds
its rule, its path and its message. The message starts with the path, except the slab
count cap's and `prepare`'s. The steps raise these rules:

- the admission: `shape` and `id`, from `level-format`;
- the static scene: `base`, from `level-glb`'s base name errors;
- the preparation: `prepare` at the path `$`, with the message `sec-111 level preparation
  failed: ` followed by the message of the error sec-111 throws;
- the props: `place`, `kind` and `param`, in description order;
- the slab admission: `slab`, from `level-format`.

The pipeline owns `place`: a prop whose `at` lies outside the interior's plan, with the
format's length slack, yields `props[<i>].at: (<x>, <z>) lies outside the interior`, and
that prop is not expanded. The message shows each length with `level-format`'s
`formatLength`. sec-111 cannot reject the empty wall list, so a rejected preparation is a
defect and throws.

## The validation

`validateLevel` inspects the level GLB with `level-glb`, passes the five facts to
`level-rules`' judgement and shapes the report as a value of four parts:

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

- The fixture, one crate on each floor level, builds: the preparation measures scale 1,
  the crates stand at 0 and 0.3241 m, every slab lies on the grid, the `.json` decodes to
  the same level, and today's `prepareLevel` admits the whole level GLB.
- A description error and an unknown base name block the build before any preparation.
- A hand-built GLB with an empty scene, which sec-111's survey refuses at once, blocks
  with `prepare`.
- The props step reports `place`, `kind` and `param` in description order, and `place`
  passes at the interior's edge and blocks 0.1 mm beyond.
- 205 crates block with the slab count cap.
- The fixture is accepted, and its report holds the hall facts and the body boxes beside
  sec-111's limit. A point light moved under the floor is rejected with `light-floor`
  alone. 201 light strips beside the crates exceed the prop budget, and the level is still
  accepted with its counts beside the budget.

The read test writes a description into a temporary folder, reads it back, names a
missing file and removes the folder.

Its dependency documents:

- [level-format knowledge](../../../packages/level-format/docs/KNOWLEDGE.md);
- [level-glb knowledge](../../../packages/level-glb/docs/KNOWLEDGE.md);
- [prop-kit knowledge](../../../packages/prop-kit/docs/KNOWLEDGE.md);
- [slab-model knowledge](../../../packages/slab-model/docs/KNOWLEDGE.md);
- [level-rules knowledge](../../../packages/level-rules/docs/KNOWLEDGE.md);
- [sec111-gateway knowledge](../../../packages/sec111-gateway/docs/KNOWLEDGE.md).
