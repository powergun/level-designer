# slab-model knowledge

`@level-designer/slab-model` turns a slab of the level format into destruction lib
objects. It owns the one shared builder that constructs a slab's destruction lib model and
the derivation of the slab's intact mesh from that model.

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
- Colours are the mesher's vertex colours unchanged. The mesher decodes the slab's
  `#rrggbb` sRGB text to linear RGB, so the colours are linear.
- The +Z face carries the slab's colour, the -Z face a light tint of it, and the four edge
  faces the inner colour, which is the slab's colour.
- The mesh is indexed: each triangle keeps the three vertices the mesher emits, and its
  indices count up from 0.

The mesh holds positions, normals, colours and indices, the four geometry fields of
level-glb's slab mesh input, so a caller adds the finish and the optional glow and hands
it on.

## Boundaries

- destruction lib arrives through `@level-designer/destruction-gateway`; the slab type and
  the slab's oriented box arrive through `@level-designer/level-format`, which owns them.
- The mesh is intact: the component applies no damage and judges no rule.
- The component runs under Bun only. Its source uses no Node or Bun module, but it reaches
  destruction lib's Rapier copy, so no page imports it and `just lint` does not bundle it
  for the browser.

## What the tests prove

- The material test: the shared builder gives the model of a wood, brick, concrete and
  metal slab that slab's material, which the intact mesh alone cannot show.
- The count test: slabs of 1 x 1, 2 x 1.2, 4 x 2.4 and 7 x 3.2 m mesh to 12, 20, 44 and 92
  triangles, destruction lib's measured counts.
- The colour test, on a dark, rotated slab: the +Z face and the four edge faces carry the
  slab's colour, decoded by the sRGB transfer curve; the -Z face carries one colour,
  lighter than the slab's; no vertex faces another direction.
- The pose test, on rotated, lifted slabs at the format's size limits: the mesh is
  indexed, every triangle winds along its unit normal, which points out of the slab, and
  the vertices stay inside the slab's box from `slabBox` and reach each of its six faces.

Its dependency documents are the
[destruction-gateway knowledge](../../destruction-gateway/docs/KNOWLEDGE.md) and the
[level-format knowledge](../../level-format/docs/KNOWLEDGE.md).
