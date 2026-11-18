# finish-paint

`@level-designer/finish-paint` owns the generic parts of the dark factory's procedural
materials: the arithmetic interface that the layer kinds are written over, the lattice
hash, the number back end, the layer kinds, the slab's and the hall's frame rules, the
painter and the swatch. Its source is browser-safe, and it depends on `@level-designer/level-format` for
the finish table's types.

- `level-view` builds its node back end from the interface and `latticeHash`, and draws a
  finish with `paintFace`. Its stage wrap gives a hall surface its face by `hallFace`.
- `slab-model` gives every vertex of a slab its face's frame by `slabFrame`.
- `snapshot-render` draws the finish sheet from `paintSwatch`, a recipe rendered on the
  number back end as pixels of a face with their mean albedo.
- The number back end also evaluates a recipe on the CPU for tests and for the art team's
  reviewer.

Read the [component knowledge](docs/KNOWLEDGE.md) next.
