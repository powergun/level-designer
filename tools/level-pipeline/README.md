# level-pipeline

`@level-designer/level-pipeline` owns the one build sequence of the level designer. It
reads the description file and the base stage, builds a level with its finish data or
returns the build errors that block it, and validates a built level into a report. The command-line tool,
the QA server and the tests all build through it, so they cannot disagree about what a
description builds.

It depends on `@level-designer/level-format`, `@level-designer/level-glb`,
`@level-designer/prop-kit`, `@level-designer/slab-model`, `@level-designer/level-rules`
and `@level-designer/sec111-gateway`, and it runs under Bun.

The facade offers:

- `readInputs`: the description file's bytes and the base stage, or the path of a
  description file it cannot read with the reason;
- `COMMITTED_DESCRIPTION`: the path of the committed description, the default input;
- `buildLevel`: the built level, or every build error of the first step that has errors;
  an optional prepared static level replaces the preparation;
- `validateLevel`: the validator's report of a built level, from `level-rules`' checks;
- the types of the inputs, the outcomes, a build error, a built level, the prepared static
  level and the report.

```sh
mise exec -- bun test ./tools/level-pipeline
```

Read the [component knowledge](docs/KNOWLEDGE.md) next.
