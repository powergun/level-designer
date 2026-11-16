# level-rules

`@level-designer/level-rules` owns the validator's checks. It judges a built level by every
rule of the level format that the build itself does not own, the destructibility proof of
every slab included, and returns the findings with the two measures the report shows. Its
consumer is `@level-designer/level-pipeline`.

It depends on `@level-designer/level-format`, `@level-designer/level-glb`,
`@level-designer/slab-model`, `@level-designer/sec111-gateway` and
`@level-designer/destruction-gateway`. It runs under Bun only: no page imports it. Its tests
also expand real prop kinds through `@level-designer/prop-kit`, a test-only dependency.

The facade offers:

- `judgeLevel`: the asynchronous judgement of the five facts of a built level into the
  findings, the ramp zone and each minion spawn's main lane;
- `namedSpawns`: the spawns of a prepared level by name, `player` then the minions in
  sec-111's order, each with its feet position, for the report's spawn lines;
- `HANG_HEIGHT`: the 2.17 m top of the standing band, which `level-cli` draws on the section
  sheets;
- `TRIANGLE_CAP`: the owner's cap of 300,000 triangles, which the report shows;
- the types `Finding`, `Lane`, `NamedSpawn` and `RampZone`.

```sh
mise exec -- bun test ./packages/level-rules
```

Read the [component knowledge](docs/KNOWLEDGE.md) next.
