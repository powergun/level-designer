# destruction-gateway

`@level-designer/destruction-gateway` is the only bridge to destruction lib. No other
component imports destruction lib or reads its files.

## Entry

`@level-designer/destruction-gateway` offers:

- for meshing slabs: `WallModel`, `createChunkGeometry`, `snapshotRetainedCuboids` and
  the types `MaterialId` and `MeshData`;
- for the destructibility proof: `CollisionScene`, `createPointContact`, `toWorldPoint`,
  `toLocalPoint`, `rotateVector`, `createDamageBudget`, `RapierBackend` and the type
  `RigidTransform`.

The gateway serves Bun-side code: no page imports it. Every name is destruction lib's
own, unchanged.

Read the [component knowledge](docs/KNOWLEDGE.md) next.
