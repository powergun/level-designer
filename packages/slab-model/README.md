# slab-model

`@level-designer/slab-model` is the only place where a slab becomes a destruction lib
model. One shared builder constructs the model of a slab, and the component derives the
slab's intact indexed mesh in world space from that model. It depends on
`@level-designer/destruction-gateway` and `@level-designer/level-format`, and it runs
under Bun only: no page imports it.

The facade offers:

- `buildSlabModel`: the shared builder, the destruction lib `WallModel` of a slab;
- `meshSlab`: the slab's intact mesh in level coordinates, with positions, unit normals,
  linear RGB vertex colours and triangle indices.

```sh
mise exec -- bun test ./packages/slab-model
```

Read the [component knowledge](docs/KNOWLEDGE.md) next.
