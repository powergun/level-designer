# level-format

`@level-designer/level-format` owns the two persisted shapes of the level designer: the
level description, the one authoring input, and the level `.json`, the gameplay and
lighting half of the level pair. It depends on no workspace package, and its source is
browser-safe.

The facade offers:

- `parseDescription`: admits the description text into a typed description, or returns
  every problem with its path;
- `decodeLevel` and `encodeLevel`: read and write the level `.json` in its one canonical
  text;
- `admitSlabs`: the one slab admission with the format caps, which the decoder runs on
  every level it reads;
- `roundSlab`: puts a slab on the format's grid, 0.1 mm for lengths and nine decimals for
  rotation components;
- `formatLength`: prints a length on the 0.1 mm grid, the one way a message shows a
  length;
- `isSurfaceColor`: the one check of the `#rrggbb` surface colour form;
- `keyPath` and `describeValue`: the record-key path rule and the found-value rendering of
  the `shape` messages, for any component that writes messages in the same form;
- `slabBox`: reads a slab's stored size and pose as an oriented box with eight world
  corners;
- `LENGTH_SLACK` and `MAX_POINT_LIGHTS`: the slack of every length limit and the cap of
  point lights, for components that judge or report against the same limits;
- the types of the description, the level, the slab and the lighting section.

Read the [component knowledge](docs/KNOWLEDGE.md) next.
