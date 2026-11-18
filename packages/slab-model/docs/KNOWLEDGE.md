# slab-model knowledge

`@level-designer/slab-model` turns a slab of the level format into destruction lib
objects. It owns the one shared builder that constructs a slab's destruction lib model and
the derivation of the slab's intact mesh from that model, with the vertex data a painter
reads.

## The shared builder

`buildSlabModel` constructs the `WallModel` of a slab at core's default configuration,
with the slab's size, material and colour. It sets the model's inner colour to the slab's
colour, so a slab's edges never show destruction lib's default tan. It passes no seed, so
every model takes destruction lib's default seed.

The model lives in the slab's own frame, which is the level format's slab frame: width
along local +X and centred, height along local +Y from 0 at the base, thickness along
local +Z and centred. The slab's pose places the model; the model itself carries no pose.

## The intact mesh

`meshSlab` runs destruction lib's wall mesher over every chunk of the shared builder's
model and joins the chunks in chunk order. The chunk width is core's default, so the
triangle count equals what the game builds for the undamaged slab.

- Positions move by the slab's pose through destruction lib's own rigid transform, the
  one its collision scene uses, so the mesh stands where the model collides.
- Normals turn by the same rotation and stay unit vectors along the slab's axes, wound
  counter-clockwise seen from outside.
- The mesh is indexed: each triangle keeps the three vertices the mesher emits, and its
  indices count up from 0. No corner is shared.

Every vertex carries one colour: the slab's own, the inside face included, because the
finish's recipe paints the inside. The colour is the model's base colour, destruction
lib's linear decode of the slab's `#rrggbb` sRGB text, so the component decodes no colour
itself.

Every vertex also carries its face's finish data, the slab's frame by `finish-paint`'s
`slabFrame`. The component hands it the mesher's slab-local position and normal before
the pose moves them, so the pattern is fixed to the slab and not to the level.

- `pattern`: two numbers per vertex, the pattern coordinates `x` and `y` in metres.
- `faceSize`: two numbers per vertex, the face's width and height in metres.
- `slab`: four numbers per vertex, the slab's number, seed and wear and the face's class.

The number, the seed and the wear are the slab's finish keys from the level format. The
three arrays are 32-bit floats; a number up to 999,999 and a seed up to 4,095 stay exact.
The mesh holds every vertex field of level-glb's slab mesh input; a caller adds the finish
and the optional glow before it hands the mesh on.

## Boundaries

- destruction lib arrives through `@level-designer/destruction-gateway`; the slab type and
  the slab's oriented box arrive through `@level-designer/level-format`, which owns them;
  the face's frame arrives through `@level-designer/finish-paint`, which owns the rule.
- The mesh is intact: the component applies no damage and judges no rule.
- The component runs under Bun only. Its source uses no Node or Bun module, but it reaches
  destruction lib's Rapier copy, so no page imports it and `just lint` does not bundle it
  for the browser.

## What the tests prove

- The material test: the shared builder gives the model of a wood, brick, concrete and
  metal slab that slab's material, which the intact mesh alone cannot show.
- The count test: slabs of 1 x 1, 2 x 1.2, 4 x 2.4 and 7 x 3.2 m mesh to 12, 20, 44 and 92
  triangles, destruction lib's measured counts.
- The pose test, on rotated, lifted slabs at the format's size limits: the mesh is
  indexed, every array holds its count per vertex, every triangle winds along its unit
  normal, which points out of the slab, and the vertices stay inside the slab's box from
  `slabBox` and reach each of its six faces.
- The finish data test, on the same slabs, with numbers, seeds and wears at their limits:
  every vertex carries the frame of its own position, recovered through `slabBox`, all six
  classes are met, every vertex carries the slab's colour decoded by the sRGB transfer
  curve, and every vertex carries the slab's number, seed and wear.

Its dependency documents are the
[destruction-gateway knowledge](../../destruction-gateway/docs/KNOWLEDGE.md), the
[level-format knowledge](../../level-format/docs/KNOWLEDGE.md) and the
[finish-paint knowledge](../../finish-paint/docs/KNOWLEDGE.md).
