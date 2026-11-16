# snapshot-render knowledge

`@level-designer/snapshot-render` draws a level GLB as stored, without a browser or a GPU,
into three sheets: the plan sheet, the section sheet and the view sheet. On request it also
draws a custom sheet with one perspective view. Every sheet comes back as PNG bytes; the
component reads and writes no file.

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

## Units

- The raster unit owns the 8-bit sRGB picture: fills, lines, circles, the digit labels and
  the PNG encoding, which compresses with the runtime's zlib.
- The render unit draws world triangles into one tile: clipping, projection, shading, the
  depth test, the outlines and the cut trace.
- The sheets unit decides what each sheet holds: its tiles, where each tile looks, the
  markers and the composition of the tiles into one sheet.

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

Coverage is compared with a tolerance, never as bytes, and no test asserts a render time.

Its dependency document is the
[level-glb knowledge](../../../packages/level-glb/docs/KNOWLEDGE.md).
