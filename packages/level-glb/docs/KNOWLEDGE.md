# level-glb knowledge

`@level-designer/level-glb` owns the GLB half of the level pair and its contract. It turns
the base stage GLB into the static scene, appends the props to make the level scene, and
reads back the facts a validator and a snapshot renderer need. It takes and returns bytes,
reads no file, depends on no workspace package and holds no description type. Its source
is browser-safe.

## Units

- The container unit reads a GLB into its JSON document and its binary chunk, and writes a
  document and one buffer back as GLB bytes. It also holds the glTF fields the component
  touches.
- The assembly unit builds the static scene and the level scene, and owns their input
  types.
- The inspection unit returns the three inspection facts and the world triangles.

## The container

A read GLB must be a glTF 2.0 binary of its own length, with one JSON chunk followed by
one BIN chunk, asset version 2.0 and exactly one buffer. Anything else throws. The base
stage is persisted input, so this is its one admission; the records inside are trusted
afterwards, because sec-111's level preparation judges the whole file. A written GLB pads
the JSON chunk with spaces and the BIN chunk with zeros to four bytes; its one buffer has
no URI.

A written file requires no extension. It uses no Draco, meshopt, KTX2 or
`KHR_lights_punctual`; `KHR_materials_emissive_strength` is the one extension it may use.

The assembly copies records instead of rebuilding them, so every key it does not touch
travels through unchanged. Values travel as JSON values: the base stage's `-0` matrix
entries are written as `0`.

## The static scene

`assembleStaticScene` takes the base stage bytes, the base look and the seals:

- the base nodes, accessors, buffer views, images, textures and samplers keep their
  indices and values, and the base buffer bytes open the new buffer unchanged, so the
  planes that sec-111 surveys stay untouched;
- a new node `stage` carries the uniform scale matrix of the look's scale, and its
  children are the base stage's own scene roots;
- the default scene's roots are `stage`, then one object node per seal in input order;
- a seal's object node is named by its id, carries `extras.role` `seal`, has no
  transform and has one child, the mesh node `<id>/0`;
- base nodes carry no role.

A seal is a box of 24 vertices and 12 triangles in level coordinates: four vertices per
face with the face's outward unit normal, wound counter-clockwise seen from outside. Seals
are single-sided, and a player inside the hall sees their outer faces.

A base material or mesh name that the base stage does not hold blocks the assembly with
the `base` build error. Every such name returns an error with its path and a message, in
input order: material overrides first, then the double-sided list. A material's path is
`base.materials["<name>"]`, the name always JSON-quoted in brackets; a mesh's path is
`base.doubleSided[<i>]`, its index in the list. The message is the path, then `: the base
stage has no material named "<name>"`, or `mesh` for a mesh. The base mesh names are
spelled as the base stage's GLB spells them.

## The level scene

`assembleLevelScene` takes the static scene bytes, the props with their slab meshes, and
the looks: one body per finish path in use and the glows. It keeps every record of the
static scene and appends:

- one object node per prop, in input order, after the seals; it is named by the prop id
  and carries `extras.role` `destructible` and `extras.prop`, the prop id;
- one mesh node per slab, in slab order, named `<id>/<index>` from 0, each with a mesh of
  one primitive; a slab keeps its own node because sec-111 hides one slab at that slab's
  first damage;
- per slab primitive, six FLOAT attributes and UNSIGNED_INT indices.

The six attributes of a slab primitive:

- `POSITION` with its bounds and `NORMAL`, VEC3: the mesher's vertices;
- `COLOR_0`, VEC3: the slab's linear colour on every vertex;
- `TEXCOORD_0`, VEC2: the pattern coordinates `x` and `y` in metres;
- `TEXCOORD_1`, VEC2: the face's width and height in metres;
- `_SLAB`, VEC4: the slab's number, seed and wear, and the face's class: 0 outside, 1
  inside, 2 top, 3 bottom, 4 the high end, 5 the low end.

The slab meshes arrive intact, in level coordinates, with their colours and pattern data
per vertex; the assembly stores them unchanged. `slab-model` computes them by the slab's
frame rule. A renderer reads the face's size and the four constants as flat values. No new
node carries a transform, so every reader sees new geometry where it stands. Each appended accessor has its own buffer view, aligned to four
bytes. Typed arrays are written in host byte order, which is little-endian on every
supported host.

## Materials

Every primitive of a written file has a material. The base materials keep their indices.
Each takes its override, if any, and becomes single-sided:

- `tint` multiplies the base colour factor, white when absent, and keeps its alpha;
- `metalness` and `roughness` replace the metallic and roughness factors;
- `emissive` replaces the emissive factor and sets the emissive strength extension;
- `finish`, a hall finish's path, joins the material's `extras` as `finish`, the key a
  slab's material uses, so a renderer joins the stage material to its recipe. A material
  without a finish gains no `extras`.

A base mesh in the double-sided list points to a double-sided twin of its material. A
twin copies the overridden material, its `extras` included, keeps its name and differs
only in sidedness. One twin exists per base material that a double-sided mesh uses.

Appended materials follow in this order:

- the twins, in base mesh order of first need;
- one per seal, named `seal/<id>`, its colour decoded from `#rrggbb` sRGB to linear;
- one per finish path used by a slab without a glow, named `finish/<path>`, in order of
  first use;
- one per pair of finish path and glow, named `finish/<path>/glow/<glow>`, in order of
  first use.

Every slab of a path and glow shares that one material, across props. Its `extras` carry
`finish`, the path, and with a glow `glow`, the glow's name, and `glowStrength`, its
strength as the description states it: a painter joins a mesh to its recipe by them and
emits the glow's colour at that strength times its emission. The name is a label for
people. The unscaled strength sits beside the glow's colour, which the emissive factor
already holds, so a painter reads the whole glow from the material and joins no other file. The material is the flat fallback
that the snapshot sheets and a viewer without painters draw:

- a white base colour, so the slab's vertex colours show unchanged;
- the body's metalness and roughness;
- with a glow, the glow's colour as the emissive factor, at the glow's strength times the
  body's `lit` through `KHR_materials_emissive_strength`, also at a strength of 0. A lit
  body therefore emits at the glow's strength, and an unlit one shows its colour.

A material without a glow has no emission, whatever its body's `lit`. The file lists the extension as used
whenever a material carries it, and holds no image beyond the base stage's.

## Inspection

`inspectGlb` returns three facts:

- `triangles`: the index count over three, summed over every primitive of every mesh in
  the file; the level pair holds at most 300,000 triangles, and a validator judges that
  cap against this count;
- `primitivesWithoutMaterial`: the mesh name of each primitive without a material, one
  entry per primitive;
- `images`: the number of images, which a validator compares with the base stage's count.

On the base stage it counts 113,697 triangles and 11 images; each seal adds 12 triangles.

## World triangles

Inspection and the triangle reader serve indexed triangle lists only: a primitive without
indices fails both. The triangle reader also fails on an accessor whose component or
element type it does not read, instead of guessing its layout.

`readWorldTriangles` returns every triangle the default scene draws, in world space after
composing the node matrices from the roots down, in traversal order: roots, then children
in document order. Each triangle carries a linear RGB colour, the mean of its three
corners' colours. A corner's colour is:

- the material's emissive factor when the material glows: a non-black emissive factor at
  a positive strength;
- otherwise the base colour factor, white when absent, times `COLOR_0` when present.

Textures are not read, so the base stage shows its base colour factors, mostly white. A
primitive without a material takes glTF's default white.

## Ownership and invariants

- The component owns the GLB contract above and the `base` build error.
- The assembly inputs match the level description's shapes: the base look and the glows
  are maps, and the seal colour is the description's `#rrggbb` text. The bodies are a map
  by finish path, each the drawn body of its recipe, which `level-pipeline` resolves.
- A slab names a finish path and a glow that the build has admitted; a missing body or
  glow is a programming error and throws. A base override's finish path is admitted by
  `level-format` too; the assembly writes it and judges nothing.
- The written files stay inside the glTF subset that sec-111's level preparation admits:
  one buffer, no required extension, matrices only, indexed triangle lists, every accessor
  dense on a buffer view of buffer 0 and inside it, and every index below its vertex
  count.

## What the tests prove

No test of this component runs sec-111's level preparation.

### The static scene test

It runs on the real base stage through sec111-gateway's stage entry and proves the
container, the reader subset, the verbatim base, the `stage` root, the seal objects, the
seal boxes with outward unit normals, the primitives, the materials and twins, a finish
path in the `extras` of a stage material and its twin and in no other base material, the
inspection counts and the `base` errors.

### The level scene test

It runs on the static scene of the real base stage. It proves the file's form:

- the container, the reader subset, and the verbatim static scene with its images;
- the object roots and the mesh node names;
- the six slab attributes, their stored values at the ends of their ranges, the bounds of
  `POSITION` and the UNSIGNED_INT indices;
- the inspection count.

It proves the materials:

- the shared materials, with a path that appears only with a glow;
- the fallback with its `extras` and its emission at a `lit` of 0, one half and 1;
- the throw on a missing body or glow.

### The reader subset check

It reads the index values from the BIN chunk on its own. It proves that every accessor ends
inside its buffer view, every buffer view inside the buffer, every attribute has the
`POSITION` count, and every index lies below it.

### The appended views check

The static scene test and the level scene test each run it on the accessors that their
assembly appends: the seals' over the base stage, the slabs' over the static scene. It
proves that each appended accessor has a buffer view of its own, starting on four bytes.

### The inspection test

It runs on hand-built files and proves:

- a primitive without a material is reported by its mesh name;
- a file with two buffers is refused;
- world triangles compose the stage scale over the base matrices;
- a seal's triangles sit on its box, wound outward;
- a slab's colour and a lit glow's colour reach their triangles, and an unlit glowing slab
  shows its colour;
- an emissive material at strength 0 keeps its base colour.
