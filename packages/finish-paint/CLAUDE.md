# finish-paint rules

- Keep the source browser-safe TypeScript: no sibling import, no three.js, no Bun or Node
  module. Depend on `@level-designer/level-format` alone, for the recipe's types and
  `recipeAt` in tests; add no other dependency.
- Write each layer kind once, over the arithmetic interface, and use no operation outside
  its fifteen.
- Keep `latticeHash` the one source of the hash: every back end builds `hash` from it.
- Round every operation of the number back end to a 32-bit float.
- Let the kinds trust their parameters and a positive footprint; the painter owns both.
- Keep the painter generic over the interface and its recipe constant: no per-point read
  of the recipe, so one call on shader nodes builds one static graph.
- Take the recipe as `level-format`'s drawn recipe; never resolve `extends` or a default
  here.
- Keep the slab's and the hall's frame rules the one implementation of the finish
  format's frames; keep the hall's rule over the interface and without a branch.
- Keep the constant edges of every `smoothstep` rising: WGSL refuses any others.
- Keep the swatch a caller of the painter on the number back end; it adds no drawing rule.
