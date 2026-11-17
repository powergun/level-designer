# prop-kit

`@level-designer/prop-kit` owns the nine prop kinds of the level designer: `conveyor`,
`enclosure`, `robot-arm`, `container`, `crate`, `partition`, `bridge-crane`, `jib-crane` and
`light-strip`. Each kind has a parameter table and a generator that returns slabs in the prop's
own frame: upright, lying or pitched about local X. The kit admits a prop's kind and parameters,
places the prop by its plan position, its yaw and the floor height it is given, splits long runs
to the slab caps, turns each panel's +Z face outward and tags glowing slabs. Two kinds take an
optional second colour: the arm's `baseColor` for its pedestal and the bridge crane's
`runwayColor` for its runway beams. The kit depends on `@level-designer/level-format`, and its
source is browser-safe.

The facade offers:

- `expandProp`: expands one prop into its unrounded slabs in the level frame and in slab
  order, each with its glow name where it glows, or returns its `kind` and `param` problems;
- `listKinds`: every kind with its parameters, ranges, choices, defaults and, for a colour or
  a glow, whether it is required;
- the types of an expansion, an expanded slab, a problem and the kind listing.

Read the [component knowledge](docs/KNOWLEDGE.md) next.
