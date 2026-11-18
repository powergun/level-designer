# snapshot-render knowledge

`@level-designer/snapshot-render` draws a level GLB as stored, without a browser or a GPU,
into three sheets: the plan sheet, the section sheet and the view sheet. On request it also
draws a custom sheet with one perspective view. Beside them it draws the finish sheet, one
page per finish path. Every sheet and page comes back as PNG bytes; the component reads and
writes no file.

## Surface

- `renderSheets` takes the GLB bytes and one `SnapshotInput` and returns `Sheets`: the PNG
  bytes of `plan`, `section` and `view`, and `custom` when the input names a custom view.
- `SnapshotInput` carries everything beside the GLB: the interior box, the floor heights,
  the clearances above a floor, the player spawn, the minion spawns, one plan point per
  prop in description order, the lens, the eye height and the figure height. The optional
  custom view holds an eye and a look-at point.
- The caller fills the input from the prepared static level, the game values and the
  description. The component imports no game value and knows no level format.
- Two renders of the same bytes and input give byte-identical sheets.
- A perspective view whose look-at point equals its eye throws an `Error`.

The finish sheet's surface:

- `renderFinishSheet` takes one `FinishSwatch` and returns the PNG bytes of that finish
  path's page. The caller calls it once per finish path in use.
- `FinishSwatch` carries the label the page prints, the path's drawn recipe, the ground
  colour as `#rrggbb`, and the subject. The ground is a slab's colour as the level states
  it, or the hall's plain grey.
- `SwatchSubject` is a slab or a hall. A slab gives its width, height and thickness, its
  seed and its wear. A hall gives the interior box and the classes (`HallClass`:
  `outside`, `top`, `bottom`) that the hall finish draws on, in order.

## Units

- The raster unit owns the 8-bit sRGB picture: fills, lines, circles, the labels and the
  PNG encoding, which compresses with the runtime's zlib. Its font of 3 x 5 glyphs holds
  the digits, the lowercase letters, the space and the signs `-`, `+`, `.` and `/`.
- The render unit draws world triangles into one tile: clipping, projection, shading, the
  depth test, the outlines and the cut trace.
- The sheets unit decides what each sheet holds: its tiles, where each tile looks, the
  markers and the composition of the tiles into one sheet.
- The finish unit draws the finish sheet's pages on `finish-paint`'s swatch and composes
  them like the sheets.

## How a tile is drawn

The triangles come from `readWorldTriangles` of `@level-designer/level-glb`, in world space
with one linear colour each. Dressing therefore shows its vertex colours, seals their
colour, emissive materials their emissive colour, and the base stage its base colour
factors, which are mostly white: the base stage reads as flat greys.

- Each triangle is clipped to the tile's kept half-spaces and drawn in one flat colour.
- Both sides of a surface are drawn; the side toward the viewer counts for shading.
- One fixed light shades every surface: it comes from the upper left of the tile and from
  behind the viewer. A surface keeps 45 % of its colour unlit and gains up to 55 % from the
  light. Nothing else lights a tile: no shadow, haze, bloom or exposure.
- The nearest surface wins each pixel; its pixel centre must lie inside the triangle.
- Where depth jumps between neighbouring pixels, the nearer pixel darkens to an outline.
  On an orthographic tile the jump must exceed 0.25 m, so a plan outlines no step of
  0.25 m or less; through a lens it must exceed 2 % of the depth. A plane seen at a
  grazing angle keeps its slope and draws no outline.
- An orthographic tile looks from a cut plane. A black line traces where a surface crosses
  that plane, so cut walls show as lines.

The background is loud magenta, so an opening in the hall shows on the plan tiles, the
elevations and the perspective tiles. A cross-section tile shows the background wherever
nothing stands in its window, inside a closed hall too, so there magenta marks no opening.
Dark grey gutters of 8 px surround and separate the tiles.

## Orthographic tiles

The plan and section tiles draw at 20 pixels per metre. A tile's window is the interior box
grown by 2 m on each side and widened to whole metres, so the window's edges and every
whole-metre line fall on pixel edges. A world point at distance `d` metres from the
window's left edge falls in pixel column `floor(20 d)`; rows count the same way from the
top edge.

## The plan sheet

Two top-down tiles stand side by side: the floor plan of everything below 5.9 m, under the
gantry decks, then the overhead plan of everything below 16.2 m, under the trusses. +X runs
to the right and the back wall (-Z) is on top.

- A 10 m grid in translucent black covers each tile. Each x line carries its coordinate at
  the top edge, each z line at the left edge.
- The player spawn shows as a cyan dot with a cyan circle of 6 m radius; each minion spawn
  as an orange dot and circle.
- Each prop's number, counted from 1 in description order, sits in a white plate on its
  plan point.
- A plan shows no height: a top face and the floor share one shade, and only an outline
  separates them.

## The section sheet

All section tiles share one height window, from the interior's floor less 2 m to its
ceiling plus 2 m, with up on top.

- Row one: the long elevation from the interior's centre plane toward the +X wall. It
  shows everything at or beyond the centre plane, with the back wall on the left.
- Row two: the elevation from the centre plane toward the -X wall, with the sealed end on
  the left.
- Rows three and four: six cross sections that look toward the back wall, three per row,
  from the back, with +X on the right. Their stations stand 10 m in front of the
  interior's back and then every 20 m. Each shows the 10 m behind its station; the first
  reaches back to its tile window's back edge, at least 2 m behind the interior, so it
  shows the back wall.
- Height lines cross every section tile: white at each floor height, yellow at each
  clearance above each floor.

## The view sheet

Eight perspective tiles of 640 x 360 pixels, four per row, use the input lens: its field of
view is vertical. A tile keeps world up on screen; a view straight up or down keeps the
back wall on top. The tiles, in order:

- the player spawn at eye height looking toward the back wall, then toward the sealed end;
- each minion spawn at eye height looking at the player's eye;
- the two overviews from 12 m above the interior's floor, at the hall's centre line and
  0.5 m inside the back end and the sealed end, looking at the centre of the floor.

A figure of the figure height and 0.5 m square stands at each spawn: cyan-blue for the
player, orange for a minion. A figure that holds the eye is left out of that view. The
custom sheet holds one such tile from the custom eye toward its look-at point.

## The finish sheet

The finish sheet shows a finish path as the art team's author and reviewer judge it. Each
page holds one path's slab or hall, drawn by the path's recipe through `finish-paint`'s
swatch on the number back end. On a slab's page each face's class, low corner and size
come from `finish-paint`'s slab frame rule.

- The near scale is 5 mm per pixel, or 20 mm when the outside face is wider or higher than
  8 m. Every near face of a page shares it. The far scale is 40 mm, what survives 20 m.
- Each face is a tile: the swatch's linear albedo in sRGB, with row 0 at the face's top.
  Under the face a ruler ticks and numbers every whole metre of the face's `x`, from its low
  edge. Under the ruler a caption prints the face's format name, the scale in millimetres
  and the mean albedo as linear luminance (Rec. 709) to three decimals, such as
  `outside 5mm 0.142`.
- A tile is as wide as the widest of its face, its ruler and its caption, on a grey ground.

A page is laid out for an image reader that scales a picture to about 1,568 px on its long
edge, so the outside face keeps the near scale wherever the faces allow:

- The title row prints the swatch's label, the finish path.
- The tiles then fill rows in a fixed order. First comes the unfold: the low end (`end-`),
  the outside face and the high end (`end+`), side by side at the near scale. The inside
  face, the top and bottom edges at the near scale and the outside face at 40 mm follow.
- A tile joins a row while the row's tiles stay within 1,520 px, or within the unfold's
  width when that is wider. Narrow faces, such as a tall slab's, share a row; wide faces
  stack.
- Gutters of 8 px surround and separate the tiles, as on the level sheets.

A page shows albedo only: no light, no emission and no glow. It draws a `"glow"` mark in
the finish's `light`, whatever glow a prop names.

### A hall finish's page

A hall finish's page holds one tile per class it draws on, in the subject's order, over
the caller's grey ground. A role with no layer gets the title alone. Each class's face (its
low corner, size, class, seed 0 and wear 1) comes from `finish-paint`'s hall frame rule,
on the normal (1, 0, 0), (0, 1, 0) or (0, -1, 0).

- A wall (`outside`) is a side wall, whose `x` is level Z. It shows a window of 16 x 8 m
  from the interior's low Z end at floor height, at 20 mm per pixel by the near scale's
  8 m limit: 800 x 400 px.
- A ceiling (`bottom`) shows the same window from the interior's low X and Z corner.
- A floor (`top`) shows whole at the plan sheet's scale of 20 px per metre (50 mm).
- A floor and a ceiling draw in the plan's orientation: +X to the right and -Z (the back
  wall) on top. A wall draws with its top up.

A tall tile splits, and the rulers read the level:

- A tile taller than 1,496 px splits along its height into the fewest equal parts of at
  most 1,496 px, from the back on. The row rule then sets the parts side by side. 1,496 px
  is the reader's 1,568 px less the title row, the rulers, the caption and the gutters
  (72 px), so a part reaches the reader at full scale. The hall's floor of 33 x 120.2 m
  gives two halves of 660 x 1,202 px, on a page of about 1,400 x 1,274 px.
- Both rulers of a hall tile number level coordinates. The `x` ruler runs under the face
  and the `y` ruler on its right: level Y on a wall, level Z on a floor or a ceiling. A
  ruler ticks and numbers every whole metre, or every 10 m at the plan scale, as the
  plan's grid.
- The caption reads as on a slab's page. Over the grey ground the mean tells the marks'
  share, not the surface's value.

A floor line 0.1 m wide covers 2 px at 50 mm, placed to one pixel against the ruler. A
joint 15 mm wide covers 0.3 px at 50 mm and 0.75 px at 20 mm, so its filter fades it to
its mean. A floor's joints show as an even, darker tone, and a wall's as faint lines at
best. Their spacing and crispness show only in the QA app.

## What a sheet can and cannot show

An agent can judge layout, spacing, alignment with the base structure, scale, silhouette
and what an eye-level view hides. A sheet cannot show lighting, shadow, haze, bloom,
exposure, glow, texture, material response or single-sidedness. The human alone judges
mood.

## What the tests prove

The sheet test renders one box scene once. Known boxes cover their expected plan and
section pixels within one pixel. Thin boxes on each side of both plan cuts, a block on each
side of the centre plane, boxes in the second and sixth cross-section windows and just
behind the second, and a wall just behind the back in the first window pin the windows.
The spawn colours and circle, the prop numbers in order, the grid and its labels, and the
height lines above each floor land on their pixels. In the view sheet, known points land on
their pixels in each player tile, the minion tile and both overviews, and no player tile is
blocked by its own figure.

The perspective test shows known points on their pixels within one pixel, a near surface
hiding a far one, a figure at the spawn up to the figure height, the background through
the hole of a box room, and byte-identical sheets from two renders in one run.

The render unit test shows a triangle covering only its own pixels, the whole cut trace,
the outline at a depth step and none on a grazing floor, the light from the upper left, a
view straight down, and the refused view.

The finish test draws a page of black bands on a white slab of 1.2 x 0.6 x 0.05 m, with one
mark each on the high end, the top and the bottom. Each band lands on its hand-computed
columns at 5 mm, and the 40 mm view holds the bands' mean in every pixel. Each mark lands
on its own edge, from that face's low corner, with the top row first, and a `"glow"` mark
takes the finish's light. The rulers tick and number whole metres at both scales. The
captions print each face's name, scale and mean, a tinted slab's luminance among them. The
six faces stand in their order at their sizes. A square face fills a row at 1,520 px, and
one a step wider opens the next row. A face of 8 m draws at 5 mm, and a face 9 m wide or
high draws at 20 mm. Two renders give equal bytes.

The hall test draws black marks on a white ground over an interior of 20 x 9 x 70 m, and
its floor over one as long as the hall's, 120.2 m. A wall's and a ceiling's marks land on
their pixels in windows of 800 x 400 px from the low corner. A floor's marks land in the
plan's orientation, in two parts side by side, and a floor line covers its 2 rows. A floor
of 1,496 rows stays whole, one a step longer splits in two, and one of 2,992 rows splits in
three only a step beyond. The rulers tick and number level coordinates, every 10 m at 50 mm
and every metre at 20 mm, and a role without a class gets its title alone.

Coverage is compared with a tolerance, never as bytes, and no test asserts a render time.

Its dependency documents are the
[level-glb knowledge](../../../packages/level-glb/docs/KNOWLEDGE.md), the
[finish-paint knowledge](../../../packages/finish-paint/docs/KNOWLEDGE.md) and the
[level-format knowledge](../../../packages/level-format/docs/KNOWLEDGE.md).
