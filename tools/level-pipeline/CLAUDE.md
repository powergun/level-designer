# level-pipeline rules

## The sequence

- Keep the build sequence here and only here: the command-line tool, the QA server and
  the tests call this one pipeline.
- Read the base stage and run sec-111's preparation only through
  `@level-designer/sec111-gateway`'s stage entry.
- Round every slab once, right after expansion, with `@level-designer/level-format`'s
  rounding; every later step reads the rounded slabs.
- Place every static object once, after the slab admission; `level-glb` and the
  validation read that one placement, and no other step computes one.
- Judge nothing in the build; the validation runs `@level-designer/level-rules`.
- Read files and write none; `level-cli` owns the file writes.

## Owned facts

- Hold no copy of a cap, grid or tolerance that another component owns; read the slack
  from `@level-designer/level-format`.
- Read the interior, floors and spawns from the prepared static level and store none of
  them.
- Read a finish path's body only with `@level-designer/level-format`'s `recipeAt`; hold
  no finish default.

## Tests

- Keep this the only test home that prepares a level. The builds of one test file share
  one prepared static level, and the root test recipe runs at most three preparations.
- Tests remove every file and folder they create.
