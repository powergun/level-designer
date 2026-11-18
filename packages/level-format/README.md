# level-format

`@level-designer/level-format` owns the two persisted shapes of the level designer: the
level description, the one authoring input, and the level `.json`, the gameplay and
lighting half of the level pair. It depends on no workspace package, and its source is
browser-safe.

## Admission and encoding

- `parseDescription`: admits the description text into a typed description, or returns
  every problem with its path;
- `decodeLevel` and `encodeLevel`: read and write the level `.json` in its one canonical
  text;
- `admitSlabs`: the one slab admission with the format caps, which the decoder runs on
  every level it reads;
- `keyPath` and `describeValue`: the record-key path rule and the found-value rendering of
  the `shape` messages, for any component that writes messages in the same form.

## Slabs, lengths and limits

- `roundSlab`: puts a slab on the format's grid, 0.1 mm for lengths and nine decimals for
  rotation components;
- `formatLength`: prints a length on the 0.1 mm grid, the one way a message shows a
  length;
- `isSurfaceColor`: the one check of the `#rrggbb` surface colour form;
- `slabBox`: reads a slab's stored size and pose as an oriented box with eight world
  corners;
- `LENGTH_SLACK` and `MAX_POINT_LIGHTS`: the slack of every length limit and the cap of
  point lights, for components that judge or report against the same limits.

## Finishes

- `recipeAt`: the drawn recipe of a finish path: its body and its layers, with `extends`
  and the default body applied, and its finish's `light`; or nothing when the table lacks
  the path;
- a base override's `finish`: the path of its stage material's hall finish, a role that
  states no body, no `lit` effect and no layer on a face other than `top`, `bottom` and
  `outside`;
- `seedOfId` and `MAX_SEED`: the hash of an id into a seed from 0 to 4,095, and the
  range's top, for every default seed of a prop or a box.

## Types

The facade exports the types of the description, the level, the slab, the lighting
section and the finish table: the table, a finish, a recipe, a layer with its pattern and
effects, a length, and a slab's four finish keys.

Read the [component knowledge](docs/KNOWLEDGE.md) next.
