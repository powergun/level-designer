# finish-paint knowledge

`@level-designer/finish-paint` holds the parts of a painter that do not depend on where it
runs. A layer kind is written once, over an arithmetic interface: filled with shader nodes
it becomes shader code, and filled with plain numbers it computes the same pattern on the
CPU. The component has five units: `arithmetic`, `kinds`, `frame`, `painter` and `swatch`.
It reads the finish table's types from `level-format`.

## The arithmetic

The interface is generic over one scalar type and holds fifteen operations: `constant`,
`add`, `sub`, `mul`, `div`, `min`, `max`, `abs`, `floor`, `fract`, `sqrt`, `mix`, `step`,
`smoothstep` and `hash`. `mix(a, b, t)`, `step(edge, x)` and `smoothstep(e0, e1, x)` take
the argument order of the shading languages. The interface has no vector, branch, loop,
derivative or texture. `CoreArithmetic` names the fourteen operations without `hash`, and
`Arithmetic` adds it.

`latticeHash` is the one source of the hash: Wall Lab's `hash31`, written over the
fourteen operations, scalar by scalar. It returns a value in 0 to 1 for a lattice cell of
three scalars, and the third carries the seed. Every back end builds its `hash` from it,
so the node back end can emit it once as a shader function.

The number back end, `numberArithmetic`, rounds the result of every operation to a 32-bit
float, so a pattern's geometry lies within one rounding of where a GPU draws it. A hashed
value can still differ in single cells, so a CPU picture and a frame agree in every
feature and in the statistics of their noise, never pixel for pixel.

## The layer kinds

Each kind returns a coverage in 0 to 1 and filters its edges over one footprint centred on
the point, the metres of pattern one pixel covers. Every parameter is a scalar: a length
may hold a share of the face, and a fitted period depends on the face's size, so the
painter resolves both and lifts true constants. `level-format` fills the defaults at
admission; the painter places a fitted pattern's origin at the face's low edge. The kinds
trust their parameters and a positive footprint.

### Fields

- `bands`: bands of one width, repeating at one period along one coordinate, with the
  band's centre at `phase` times the period plus `offset`. A box filter brings it to its
  mean, the width over the period, when a footprint spans many periods. It spends no hash.
- `dots`: discs of one radius on a lattice with a pitch, a phase and an offset along each
  coordinate. A disc's edge is a linear ramp of the distance over one footprint, and the
  pattern fades to the discs' share of the lattice, at most 1. Only the nearest lattice
  point counts, so a radius above half the shorter pitch clips the discs. It spends no
  hash.
- `noise`: value noise on the two coordinates, with a wavelength along each, smooth
  interpolation between four hashed corners and the seed in every hash. It fades to 0.5 by
  its shorter wavelength. It spends four hashes.

`cells` is a grid whose pitch along each coordinate is a cell plus its gap. A gap is
centred on every multiple of the pitch, so an unfitted grid has a gap on the origin, and
each row shifts by `shift` of the pitch across. The gaps are two box-filtered `bands`,
joined as `1 - (1 - gx)(1 - gy)`, so they reach their mean by themselves. One seeded hash
gives each cell a tone, faded to 0.5 by the shorter pitch. The cells whose tone lies below
`share` are covered whole, faded to `share`. The kind returns its coverage, the gaps alone
and the tone, and it spends one hash.

### Marks

- `rectangle`: one axis-aligned rectangle given by two corners in either order, box
  filtered on each axis: one half on an edge, one quarter on a corner.
- `disc`: one disc at a point, its edge a linear ramp of the distance over one footprint.
  An inner radius cuts a ring; `diamond` measures the distance as `|dx| + |dy|`.
- `border`: the outline inset by `inset`, less that rectangle inset again by the widths at
  the ends, the top and the base, both box filtered. Widths past half the face empty the
  inner rectangle, so the frame fills the inset outline; an inset past half the face empties
  the outline, so the frame covers nothing.
- `face`: no template; the painter's coverage of a `face` layer is the constant 1.

No mark spends a hash or takes a footprint fade, so a disc smaller than its footprint
leaves a faint halo; a recipe fades a small mark with `detail`.

### Fades and clamps

`footprintFade` removes a feature as the footprint grows from 0.22 to 0.5 of its
wavelength, after Wall Lab's `lodFade`. `dots`, `noise` and the tone of `cells` fade by
it. A layer's detail fades by it too, at a wavelength of twice the detail's end: 0.44 of
the end is 0.22 of that wavelength.

`bands`, `rectangle`, `disc`, `border` and the edge of `dots` clamp their coverage to 0 to
1, because a filter's difference at a long coordinate loses bits in 32-bit floats. Because
of that cancellation, a box filter of 1 mm holds about three decimal places a few metres
from the origin. `dots` also clamps its far share, because the format admits a radius past
half the pitch: both may be shares of a face. Its coverage then mixes two values in 0 to 1
and stays there.

### A band's ramp

`ramp` is the width of each flank, and a flank is centred on the band's edge, so `width`
is the band's width at half coverage. The kind filters a box of `width` over the footprint
plus `ramp`. At a zero footprint that is a trapezoid: full coverage over `width - ramp`, a
linear flank `ramp` wide, and one half on each edge. The mean over many periods stays
`width / period`.

### A noise mask

`noise` takes an optional mask of `threshold` and `softness`. The mask is
`smoothstep(threshold - softness / 2, threshold + softness / 2, n)` of the faded noise, so
the fade to 0.5 comes first. The caller gives a positive `softness`.

Every kind keeps the constant edges of each `smoothstep` rising, because WGSL refuses a
`smoothstep` whose constant edges do not rise, and the drawing stops. The kinds call it in
`footprintFade` (0.22, 0.5), in `noise` (0, 1) and in the noise mask, which rises because
its softness lies above 0.

## The slab's frame rule

`slabFrame` gives a point of a slab its face's frame, by the finish format's "The frame of
a face". It takes the slab's size and a vertex's slab-local position and normal; the
normal's dominant axis picks the face. The slab frame is the level format's: width along
+X and centred, height along +Y from the base, thickness along +Z and centred.

- Outside (+Z, class 0) and inside (-Z, class 1): `x` is the slab's X, `y` its Y; the face
  measures width by height.
- Top (+Y, class 2) and bottom (-Y, class 3): `x` is the slab's X, and `y` is the slab's Z
  plus half the thickness, from the inside face toward the outside; the face measures
  width by thickness.
- The high end (+X, class 4) and the low end (-X, class 5): `x` is the slab's Z on both,
  unmirrored, as the inside face keeps the slab's X; `y` is the slab's Y; the face measures
  thickness by height.

The frame carries no low corner. On a slab and on a box it is always half the width below
0 in `x` and 0 in `y`, and the vertex data holds none. `slabFace` builds the painter's face
from one vertex's data by that rule, so the level view and the CPU picture share it.

## The hall's frame rule

`hallFace` gives a point of a hall surface the painter's face, by the finish format's
hall rule, over the interface. It takes the point's position and the mesh's unit normal in
the level frame, and the interior box's low corner and size. A normal with a Y of 0.7 or
more is `top`, and -0.7 or less `bottom`; a floor and a ceiling are painted in plan, the
level's X and Z. Any other surface is `outside`, painted in the level's Y and in its Z
where the normal's X outweighs its Z strictly, else in its X; a wall's `x` is not
mirrored by the side it faces. The face's low corner and size are the interior's along the
chosen coordinates. The face carries the hall's constants, seed 0 and wear 1.

The rule has no branch, so one graph serves every stage surface. `step` reads the 0.7
limit and the X-Z choice as weights of exactly 0 or 1, and `mix` by those weights picks
each coordinate, the low corner and the size. A mix by 0 or 1 returns its side unchanged,
so the number back end lands on the chosen coordinate exactly.

## The painter

`paintFace` evaluates a drawn recipe at one point of a face, by the finish format's
"Painting" rules. It is generic over the interface, so one function serves the number back
end and the node back end. The recipe is constant: on shader nodes one call builds one
static graph, and only the surface's scalars vary per point. The caller resolves the recipe
with `level-format`'s `recipeAt`, so `extends` and the defaults have one owner.

The inputs, each as scalars of the interface:

- the base shade: linear albedo, metalness, roughness and emission. `bodyShade` gives a
  slab's or a box's, the tint times the body's `shade`; a hall surface's is its stage
  material's own;
- the face: the pattern coordinates `x` and `y`, the low corner, the size, the class, the
  seed and the wear;
- the linear tint, and the linear colour that `"glow"` takes: the glow's colour when the
  material has a glow, otherwise the drawn recipe's `light`, which the caller decodes;
  the painter reads only the recipe's body and layers;
- the footprint.

The output is a shade of the same form. Its emission is a factor from 0 to 1, and the
caller multiplies it by the glow's colour and strength. `linearFromSrgbHex` decodes a
`#rrggbb` text of the table to linear RGB, for a layer's `color` and for the caller's
`light`.

### A layer's coverage

A layer's coverage is its kind's coverage, times its clip, a filtered rectangle, times its
detail's fade, the wear if it wears, its amount and its face gate. The gate compares the
class at half a step against the one contiguous range each face name covers: `sides` is 0
to 1, `ends` 4 to 5, `edges` 2 to 5, and `all` takes no gate.

The coordinates are the face's `x` and `y`, raw: centred on a slab and a box, level
coordinates on the hall, where the low corner states the face. `across: "ends"` measures
in from the nearer end, `across: "out"` out from the centre line, and `up: "top"` down from
the top. A length is its metres plus at most one share, of the face's width or of its
height. The painter and the kinds trust that a size (`period`, `width`, `height`, `pitch`,
`radius`, `wavelength`) is positive on every face, that `ramp`, `gap`, `inner` and `inset`
are at least 0, and guard nothing. `level-format`'s admission owns that promise, and it
refuses `across` and `up` on a border, so a border's outline is the face's.

A kind's places come from the layer's coordinates. A cell's pitch is its `width` or
`height` plus its `gap`, and its `fit` names the fitted coordinates, as on `dots`. A disc
takes no hole when its `inner` is exactly 0 m. A border's outline is each coordinate's
span: its low end and its extent.

A fitted period is the span of the layer's coordinate on the face over its rounded count
of periods, at least one, and the pattern starts at the span's low end. A plain coordinate
spans the face from its low edge. Under `ends` or `out` the coordinate spans half the
width from 0, so a fitted band under `ends` fits half the face from each end. Under `top`
it spans the height from the top. A diagonal band runs along the sum of the two
coordinates over the square root of two, so its period and width measure across the band.

### The effects

Each layer mixes its effects in by its coverage, in the order the format lists them:
`shade`, then `paint`, then `color`, then `metalness`, `roughness` and `lit`. A layer that
states both `shade` and `paint` therefore darkens first and paints over the darkened
albedo. `jitter` comes last and mixes by its own weight: the cells' interior, one less the
gaps, times the layer's clip, detail, wear, amount and gate. It moves the albedo toward
itself times `mix(low, high, tone)`, so a far cell's tone of 0.5 gives the mean factor.
The albedo is clamped to 0 to 1 after the last layer.

## The swatch

`paintSwatch` renders a drawn recipe on the number back end for the finish sheet. It takes
a face (low corner, size, class, seed and wear), an optional window of it in the face's
pattern coordinates (the whole face by default), the metres per pixel, the linear tint
and the linear colour that `"glow"` takes. The scale is also the footprint, so every edge
is filtered over one pixel. The base shade is the recipe's body on the tint.

Each side has its window's length over the scale, rounded, and at least one pixel. A pixel
samples its centre. The result holds linear RGB albedo, clamped, three numbers per pixel,
row-major with row 0 at the window's top and column 0 at its low end, and the mean albedo
of all pixels. Luminance, encoding and the sheet's layout belong to `snapshot-render`.

## What the tests prove

### The arithmetic, the kinds and the frame

- The number back end: every operation returns a 32-bit float equal to the rounding of
  its exact meaning; `mix`, `step`, `smoothstep`, `floor` and `fract` follow the shading
  languages; `hash` equals `latticeHash` over the other fourteen.
- The hash: hand-computed values of `hash31` at stated cells, and 4,096 different rows of
  eight cells for the seeds 0 to 4,095.
- Each kind at its limits and one footprint beside them, and the fade at both ends: a
  cell's gap, shift, tone, share and mean; a disc's edge, ring and diamond; a border's
  edges, widths, inset, widths past half the face and an inset past half a thin face.
- The frame rule on each of a slab's six faces, against hand-computed frames.
- The hall's rule at hand-computed points: a floor, a ceiling, walls facing along X and
  along Z, slopes at a normal Y of 0.7 and -0.7 and one step inside them, and the X-Z
  choice on each side of its tie.

### The painter

- Through the package facade: the body's base shade, an uncovered face left unchanged,
  each effect at a coverage of 0, one half and 1, the order of layers, the clamp, and the
  extended layers drawn first through `recipeAt`.
- Where a layer draws: every face name on the six classes, the clip, the detail's fade and
  the wear. `ends`, `out`, `top`, shares and fitted periods land on hand-computed places on
  a centred face and on a hall wall.
- One seeded, edge-biased sample of random recipes of the eight kinds, `jitter` among the
  effects, keeps every coverage and every shade in 0 to 1.

### The wires and the swatch

Each key's wire lands at a hand-computed place or value:

- the diagonal band, and a band's `phase`, `offset` and `ramp`;
- the `phase`, `offset` and shared `radius` of `dots`, and their fit on both coordinates;
- the seed and the mask of `noise`;
- the pitch, `fit`, `shift` and `share` of `cells`, and its `jitter` by the interior weight
  and after the other effects;
- `face` on the whole face; a disc's shares, `inner` and `diamond`; a border's widths,
  `inset` and outline on a centred face and on a hall wall;
- `shade` before `paint` in one layer, and the low corner from `slabFace`.

The swatch's mean of bands equals the mix of the two shades, a band lands on its
hand-computed pixel columns, row 0 is the top, and a window draws only its part.
