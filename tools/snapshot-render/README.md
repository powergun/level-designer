# snapshot-render

`@level-designer/snapshot-render` rasterises a level GLB on the CPU into plan, section and
perspective sheets and encodes them as PNG, without a browser or a GPU. It depends on
`@level-designer/level-glb` and runs under Bun: it compresses with the runtime's zlib.

The facade offers:

- `renderSheets`: the plan, section and view sheets of a GLB, and the custom sheet when
  the input names a custom view, as PNG bytes;
- `SnapshotInput`: the markers, the lens, the eye height and the figure height beside the
  GLB;
- `Sheets`: the PNG bytes of each sheet.

```sh
mise exec -- bun test ./tools/snapshot-render
```

Read the [component knowledge](docs/KNOWLEDGE.md) next.
