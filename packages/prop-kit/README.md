# prop-kit

`@level-designer/prop-kit` owns the nine prop kinds of the level designer: `conveyor`,
`enclosure`, `robot-arm`, `container`, `crate`, `partition`, `bridge-crane`, `jib-crane` and
`light-strip`. Each kind has a parameter table and a generator that returns slabs in the prop's
own frame: upright, lying or pitched about local X. The kit admits a prop's kind and parameters,
places the prop by its plan position, its yaw and the floor height it is given, splits long runs
to the slab caps, turns each panel's +Z face outward and tags the slabs of a glowing prop. It
names every slab's finish path and gives it its number, its seed and its wear. Two kinds take an
optional second colour: the arm's `baseColor` for its pedestal and the bridge crane's
`runwayColor` for its runway beams. Three parameters choose a role: a container's `door`, a
crate's `stencil` and a partition's `finish`. Every kind takes `wear` and `seed`. The kit depends on
`@level-designer/level-format`, and its source is browser-safe.

The facade offers:

- `expandProp`: expands one prop into its unrounded slabs in the level frame and in slab
  order, each with its four finish keys and the prop's glow name where it has one, or returns
  its `kind`, `param` and `finish` problems;
- `listKinds`: every kind with its parameters, ranges, choices, defaults and, for a colour or
  a glow, whether it is required;
- the types of an expansion, its context, an expanded slab, a problem and the kind listing.

Read the [component knowledge](docs/KNOWLEDGE.md) next.
