# prop-kit rules

- Keep every secondary dimension of a kind as a named constant of the kind tables, with its
  reason in its docstring and in the knowledge document; a generator hard-codes no dimension.
- Take the slab type, the slab caps, the grid rounding, the surface colour form, the slab
  admission, the path rule and the value rendering from `@level-designer/level-format`;
  never copy them.
- Decide every split with `admitSlabs` on runs rounded with `roundSlab`.
- Admit a prop's `params` once, at the expansion; let the generators trust the typed value.
- Keep slab order stable: it names the mesh nodes.
- Return slabs only: no mesh, no GLB and no destruction lib model.
