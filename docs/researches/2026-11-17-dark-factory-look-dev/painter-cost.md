# Painter cost

The look development makes a painter's cost a property of the design. This document
states how cost is judged, what the reference painters of Wall Lab pay, what keeps a
painter of the level cheap, and what follows if the owner finds painters too dear. Its
terms are those of the look development design, `design.md`. The
[finish format](finish-format.md) defines the caps and the rules of drawing.

## How cost is judged

The QA page shows the frame rate on its heads-up display in every normal run, as
`<n> fps`, capped by the display's refresh rate. The owner reads it while walking the
level, at the test that ends each milestone. Painters are designed to hold it, as Wall
Lab holds 60 frames a second on the owner's machine with painters that are heavy and
unoptimised.

## What the references pay

A painter of Wall Lab is heavy by design. A hash, one evaluation of the lattice hash, is
a painter's dearest operation. Counted in the source, per pixel and per branch taken:
formed concrete spends 24 hashes, brick 32, the metal sphere 44 and fractured concrete
56. One value-noise lookup in three axes is eight hashes. Each painter adds a bump from
screen derivatives and specular anti-aliasing. sec-111 pays this on six walls of about 7
by 3.2 m under one key and four points. The level has one key and eight points, and every
lit pixel evaluates every light.

On the committed level, at the game's lens, from the five spawns and the centre aisle:
the props cover 0 to 14 % of the frame, the seals up to 8 % and the floor 31 to 44 %. One
metre from a tall prop the prop covers the whole frame. Painters on props are therefore
cheap at a spawn and dear at cover, and a painter on the floor touches a third or more of
every frame.

## What keeps a painter cheap

In a recipe:

- Nothing is interpreted per pixel. A recipe's numbers are constants in the text of its
  shader, not data that the shader reads while it runs.
- Factory finishes are arithmetic: bands, cells, dots and rectangles cost a few
  operations and at most one hash each. Noise serves wear alone. Value noise runs on the
  two pattern coordinates and costs four hashes, half of a lookup of the references.
- A painter draws no relief: no bump from screen derivatives and no specular
  anti-aliasing. Its only derivative is the footprint.
- A recipe is small by its caps: at most 24 layers, of them at most two `noise` layers
  and at most three `glyphs` layers. The recipes of the art direction's briefs spend at
  most 9 hashes, against 24 in the cheapest reference painter.
- The hall covers most of every frame, and its textures already carry its wear. A hall
  finish may hold noise under the same caps; the art direction reaches for it last there.

In the scene:

- The graph has no branch, so a layer costs its arithmetic on every pixel of its slab,
  also outside its mark. A mark that few slabs carry is therefore a role of its own and
  never a layer of a shared recipe.
- One material serves each finish path and glow. A box and a slab of one path share it.
- What is static is computed once. Each graph reads static inputs only, so no draw is
  refreshed per frame, and the key's shadow renders once.
- Every edge is filtered over the footprint, and fine layers fade with it. A painter
  needs no supersampling to stay calm in motion.
- Only a stage material that names a finish is wrapped. `level-view` paints no interior:
  the QA app shows no damage.

The caps are plain numbers that an author reads off a recipe: few layers, noise for wear
alone, few legends. `level-format` refuses a recipe over a cap where it admits the
table.

three.js refreshes every draw of a node material in full each frame. The references avoid
that with a static material class, whose observer reports no node to refresh unless the
build injects one of four per-draw nodes: the model-view matrix, the model-normal-view
matrix, ambient occlusion or the shadow. The class is a file of Wall Lab's demo, not of a
library, and sec-111 holds its own copy. `level-view` holds its own too, in its unit
`paint`, because the level draws 608 slab meshes.

## If the owner finds painters too dear

Lighter recipes come first: fewer layers, no noise, fewer floor lines. The bake is the
second remedy, and the owner chooses it by eye.

Nothing is built for a bake. If the owner chooses one, the number back end becomes a
baker: it evaluates a recipe per texel, and `level-glb` writes the result as textures of
at most 1,024 px with the pattern coordinates as texture coordinates. The switch keeps
everything except the node back end.

A tile carries what repeats and what is anchored at one end of a face: a field, a band at
the floor, a fitted bay. It cannot carry what depends on a slab's size at both ends or on
its number: corner posts, chevrons at both girder ends, a code. Under a bake such a mark
moves onto a cut piece of its slab or is dropped. Floor lines and the hall's other marks
have no bake: a tile of 1,024 px over a floor 120 m long holds 12 cm per texel, wider
than a line. A bake therefore costs marks as well as megabytes, which the owner's choice
weighs.
