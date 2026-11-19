# level-glb

`@level-designer/level-glb` owns the GLB contract of the level designer. It assembles the
static scene and the level scene as one-buffer GLB bytes, inspects a GLB and reads its
world-space triangles. It depends on no workspace package, holds no description type, and
its source is browser-safe. Its tests read the base stage through sec111-gateway's stage
entry, `@level-designer/sec111-gateway/stage`, a test-only dependency.

The facade offers:

- `assembleStaticScene`: the base stage under the scaled root `stage`, with the base look,
  a hall finish's path on its stage material, and one seal object per seal, or every
  `base` build error;
- `assembleLevelScene`: the static scene with one static object per placed box, one
  destructible object per prop, one mesh node per slab with its pattern data, and one
  fallback material per finish path and glow;
- `inspectGlb`: the triangle count, the primitives without a material and the image count;
- `readWorldTriangles`: every drawn triangle in world space with its linear colour;
- the types of their inputs and results: `BaseLook`, `SealBox`, `PlacedBox`, `BoxPaint`,
  `StaticBox`, `PropMeshes`, `SlabMesh`, `SlabLooks`, `StaticScene`, `BaseNameError`,
  `GlbInspection` and `WorldTriangles`.

```sh
mise exec -- bun test ./packages/level-glb
```

Read the [component knowledge](docs/KNOWLEDGE.md) next.
