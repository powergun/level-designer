# snapshot-render

`@level-designer/snapshot-render` rasterises a level GLB on the CPU into plan, section and
perspective sheets, draws the finish sheet's page of a finish path, and encodes each as PNG,
without a browser or a GPU. It depends on `@level-designer/level-glb`,
`@level-designer/finish-paint` and `@level-designer/level-format`, and runs under Bun: it
compresses with the runtime's zlib.

The facade offers:

- `renderSheets`: the plan, section and view sheets of a GLB, and the custom sheet when
  the input names a custom view, as PNG bytes;
- `SnapshotInput`: the markers, the lens, the eye height and the figure height beside the
  GLB;
- `Sheets`: the PNG bytes of each sheet;
- `renderFinishSheet`: the finish sheet's page of one finish path, as PNG bytes;
- `FinishSwatch`, `SwatchSubject` and `HallClass`: one path's label, recipe, colour, and
  slab or hall.

```sh
mise exec -- bun test ./tools/snapshot-render
```

Read the [component knowledge](docs/KNOWLEDGE.md) next.
