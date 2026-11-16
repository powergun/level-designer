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
the finishes and glows. It keeps every record of the static scene and appends:

- one object node per prop, in input order, after the seals; it is named by the prop id
  and carries `extras.role` `destructible` and `extras.prop`, the prop id;
- one mesh node per slab, in slab order, named `<id>/<index>` from 0, each with a mesh of
  one primitive; a slab keeps its own node because sec-111 hides one slab at that slab's
  first damage;
- per slab primitive: `POSITION` with its bounds, `NORMAL` and `COLOR_0`, all FLOAT VEC3,
  and UNSIGNED_INT indices, with no texture coordinate.

The slab meshes arrive intact, in level coordinates, with linear vertex colours; the
assembly stores them unchanged. No new node carries a transform, so every reader sees new
geometry where it stands. Each appended accessor has its own buffer view, aligned to four
bytes. Typed arrays are written in host byte order, which is little-endian on every
supported host.

## Materials

Every primitive of a written file has a material. The base materials keep their indices.
Each takes its override, if any, and becomes single-sided:

- `tint` multiplies the base colour factor, white when absent, and keeps its alpha;
- `metalness` and `roughness` replace the metallic and roughness factors;
- `emissive` replaces the emissive factor and sets the emissive strength extension.

A base mesh in the double-sided list points to a double-sided twin of its material. A
twin copies the overridden material, keeps its name and differs only in sidedness. One
twin exists per base material that a double-sided mesh uses.

Appended materials follow in this order:

- the twins, in base mesh order of first need;
- one per seal, named `seal/<id>`, its colour decoded from `#rrggbb` sRGB to linear;
- one per finish used by a slab without a glow, named `finish/<material>`, in order of
  first use;
- one per pair of finish and glow, named `finish/<material>/glow/<glow>`, in order of
  first use.

A slab material has a white base colour, so the slab's vertex colours show unchanged; a
glow adds its colour as the emissive factor and its strength through
`KHR_materials_emissive_strength`. The file lists that extension as used whenever a
material carries it.

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
  are maps, the finishes a record by slab material, and the seal colour the description's
  `#rrggbb` text.
- A slab names a finish and a glow that the prop expansion has admitted; a missing one is
  a programming error and throws.
- The written files stay inside the glTF subset that sec-111's level preparation admits:
  one buffer, no required extension, matrices only, indexed triangle lists, every accessor
  dense on a buffer view of buffer 0 and inside it, and every index below its vertex
  count.

## What the tests prove

- The static scene test, on the real base stage through sec111-gateway's stage entry: the
  container, the reader subset, the verbatim base, the `stage` root, the seal objects, the
  seal boxes with outward unit normals, the primitives, the materials and twins, the
  inspection counts and the `base` errors.
- The level scene test, on the static scene of the real base stage: the container, the
  reader subset, the verbatim static scene, the object roots and mesh node names, the slab
  attributes, the slab materials, with a finish that appears only with a glow, and the
  inspection count.
- The reader subset check reads the index values from the BIN chunk on its own. It proves
  that every accessor ends inside its buffer view, every buffer view inside the buffer,
  every attribute has the `POSITION` count, and every index lies below it.
- The inspection test, on a hand-built file: a primitive without a material is reported by
  its mesh name, a file with two buffers is refused, world triangles compose the stage
  scale over the base matrices, a seal's triangles sit on its box wound outward, slab and
  glow colours reach their triangles, and an emissive material at strength 0 keeps its
  base colour.

No test of this component runs sec-111's level preparation.
