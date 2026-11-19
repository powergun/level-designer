# Hall brief: the two floors and the side walls

This brief is the art team's input for the hall finishes of TASK-001.07: the recipes that draw
over the stage's own materials on the front floor, the raised slab and the side walls. It is
written in the words of `finish-format.md` of
`docs/researches/2026-11-17-dark-factory-look-dev/`, and its short names for the reference images
are those of `research-dark-factory-surfaces.md` beside it.

Every size is in metres, every position is a level coordinate and every luminance is linear.
Hall luminances are computed at the lights of the first art pass, an environment of intensity 7;
`docs/LOOK-AND-LIGHTING.md` gives the level's present levels. The art team reads a hall recipe on
its page of the finish sheet, which shows the marks on a grey ground; the owner's browser shows
them on the stage.

## 1. What a hall finish adds

A hall finish draws layers over a stage material's own look. Away from its marks a surface
keeps the stage's look: the texture keeps its tone and its stains.

"More interesting and detailed" means here what a texture of 1,024 px cannot hold on a surface
120 m long, and nothing else:

- on a floor, joints that stay sharp underfoot, bays that differ a little in tone, and paint
  lines with a clean edge;
- on a wall, one edge: the top of a darker base, a level line down the whole hall.

The brief holds seven marks, each one judged at a glance in the browser:

- the joints and the bays of both floors: look down at the player spawn;
- the two aisle lines: look down the aisle from the player spawn;
- the box around each assembly line: walk the outer side of a line;
- the band at the ramp's foot and the line on the slab's edge: stand at the ramp;
- the side lines of the yard's four slots: walk the court between the containers;
- the walls' darker base: walk along either side wall.

No recipe states a stain, a crack or a `noise` layer: the stage's textures carry the wear. The
ceiling, the trusses, the decks, the back wall, the pipes and the tanks keep the stage's look.

## 2. The roles and their stage materials

The finish is `hall`. Cut: concrete, `#7d7b76`; light: pale cyan `#7ccbd6`. The table's form
asks for both, and a hall surface uses neither. A base override names a role, and the role then
draws on every surface of that stage material. Faces and clips keep each mark in its place.

- `hall/front`, on `Material.001`: the front floor and the sloped upper panels. Every layer
  draws on `top`. The panels lean and face sideways, so they take no layer.
- `hall/slab`, on `Material.003`: the raised slab with the ramp, the back wall, the partitions
  under the decks, most pipes and tanks, and parts of the fixtures. Every layer draws on `top`:
  the slab and the ramp take the layers, and the walls and the partitions take none.
- `hall/wall`, on `Material.002`: the side walls with their piers and corbels, the door and
  window frames, the deck columns and the back tower. Its one layer draws on `outside` and ends
  at a height, so the corbels and the window frames lie above it.

A layer on `top` has no height. It draws on every up-facing surface of its material inside its
plan rectangle:

- On `Material.003` the bays' tones also land on the tops of pipes, tanks, the duct near z -67
  and fixture parts: 325 m2, of which 17 m2 lie low enough to be looked down on. A tone step
  there is a tenth on a material of albedo 0.049.
- The joints at a z miss every such top but the fixtures' under the ceiling: the bays' length
  is chosen for it. The joints at x 3.33 and 10.0 cross the duct's top above y 6, and the joint
  at x -10.0 clips the east edge of two tanks.
- The line on the slab's edge leaves out the stretch of the two pipe stacks that stand on the
  ramp, so no pipe and no platform takes yellow paint.
- The side lines of `yard-box-north` end 0.25 short of the container's east end. A ceiling
  fixture of the same material spans x 0.31 to 0.75 above their run, at y 17.1, and no line
  passes under it.
- Measured on the built level: under each floor line its material has one up-facing surface,
  the floor itself.

The wall's layer ends at one level, y 1.4. The feet of the door frame, of the deck columns and
of the back tower take the darker base with the walls. The low wall panels are `Material.004`
and keep their own value in front of it.

## 3. The recipes

A layer reads as in the painter briefs: kind, its keys, the common keys, then `->` and its
effects. Worn yellow is `#9c7618` (0.20).

`hall/floor`, the base of both floors, which no override names. 1 layer.

1. cells: on top; width 6.64, height 6.455, gap 0.025, fit across -> shade 0.55, jitter low
   0.9, high 1.1. Joints and bays. The fit gives five bays of 6.67 across the hall, with joints
   at x -10.0, -3.33, 3.33 and 10.0 and none down the aisle; along the hall a joint lies on
   every multiple of 6.48 from z 0. Each bay takes one tone, a tenth lighter or darker at most.

`hall/front`, extends `floor`. 7 layers. Layers 4 to 6 draw the box around each assembly line,
0.1 wide. Their `across: "out"` measures from x 0, so one layer draws its line on both sides
of the aisle, where the two lines mirror each other.

1. rectangle: on top; from [-2.65, -27.94] to [-2.55, 26.8] -> color worn yellow. Aisle line,
   west.
2. rectangle: on top; from [2.55, -27.94] to [2.65, 26.8] -> color worn yellow. Aisle line, east.
3. rectangle: on top; from [-12.6, -28.14] to [12.0, -27.94] -> color worn yellow. The band at
   the ramp's foot, 0.2 wide.
4. rectangle: on top; across out; from [7.3, -14.95] to [7.4, 19.95] -> color worn yellow. The
   boxes' outer sides.
5. rectangle: on top; across out; from [2.55, -14.95] to [7.4, -14.85] -> color worn yellow.
   Their north ends, from the aisle line outward.
6. rectangle: on top; across out; from [2.55, 19.85] to [7.4, 19.95] -> color worn yellow.
   Their south ends.

`hall/slab`, extends `floor`. 7 layers. Layers 1 and 2 draw the line on the slab's edge, 0.1
wide, in two parts. Layers 3 to 6 draw the side lines of the yard's four slots, 0.1 wide: one
`bands` layer of period 2.94 draws both side lines of a slot, and its clip ends them.

1. rectangle: on top; from [-13.3, -29.5] to [5.2, -29.4] -> color worn yellow.
2. rectangle: on top; from [12.5, -29.5] to [15.0, -29.4] -> color worn yellow.
3. bands: on top; along across, period 2.94, width 0.1, phase 0, offset -5.97; clip [-6.1,
   -56.83] to [-2.9, -50.17] -> color worn yellow. The slot of `yard-box-west`.
4. bands: on top; along across, period 2.94, width 0.1, phase 0, offset 5.03; clip [4.9,
   -61.83] to [8.1, -55.17] -> color worn yellow. The slot of `yard-box-east`.
5. bands: on top; along up, period 2.94, width 0.1, phase 0, offset -62.27; clip [-5.83, -62.4]
   to [0.28, -59.2] -> color worn yellow. The slot of `yard-box-north`.
6. bands: on top; along up, period 2.94, width 0.1, phase 0, offset -52.67; clip [0.17, -52.8]
   to [6.83, -49.6] -> color worn yellow. The slot of `yard-box-south`.

`hall/wall`. 1 layer.

1. rectangle: from [-90, 0] to [31, 1.4] -> shade 0.55. The darker base. Its first coordinate is
   the level's Z on a wall that faces along X and the level's X elsewhere, so the box spans
   both; its top stands 1.4 above the front floor and 1.08 above the raised slab.

No layer takes a `detail`: `cells` filters its joints to their mean by itself, and a line 0.1
wide needs none.

## 4. Where the floor lines stand

The points follow the committed level and the hall in numbers of `docs/AUTHORING-GUIDE.md`.
A prop that moves near a line takes the line with it.

The aisle, the ramp and the joints:

- The aisle lines run from the band at the ramp's foot to 0.58 before the dock box. The arms'
  pedestals stand 0.2 outside them, and the player spawn lies between them.
- The band lies on the front floor against the ramp's foot, z -28.14. The two apron fences
  stand 0.04 beyond its other edge.
- The line on the slab's edge lies 0.17 behind the ramp's top, z -29.23. Its gap, x 5.2 to 12.5,
  clears the two pipe stacks on the ramp by 0.2 or more, as the plan sheet draws their outlines,
  from x 5.4 to 9.05 and from x 10.6; the posts at the ramp's top stand 0.38 behind it. No prop
  stands within 0.45 of it.
- The joints pass under every prop. The joints at x -3.33 and 3.33 run under the arms'
  pedestals.

The boxes around the assembly lines and the slots of the yard:

- Each assembly line stands in a closed box of 4.85 by 34.9, whose inner side is its aisle
  line. The outer side, |x| 7.3 to 7.4, runs 0.3 outside `line-w-cab` and `line-e-cab`, 0.45
  outside the plinths of `jib-line-w` and `jib-line-e` and 1.15 outside the arms' pedestals.
- The boxes' ends lie 0.85 beyond the lines' last props: `line-w-enc-1` and `line-e-conv-1`
  end at z -14, `line-w-conv-3` and `line-e-conv-3` at z 19. The south ends lie 0.4 beyond
  the joint at z 19.44.
- A slot's two side lines lie 0.2 off its container's long sides and run 0.3 past its ends.
  The court's four containers have them: `yard-box-west`, `yard-box-east`, `yard-box-north`
  and `yard-box-south`. The lines of `yard-box-north` stop 0.25 before its east end, and
  `yard-box-wall`, against the east wall, has none.

## 5. Values

Computed at the first art pass's lights, as albedo with the luminance in the hall in brackets; a
floor's luminance holds its sheen, 0.019:

- Front floor: 0.079 (0.054). Joints 0.043 (0.038); bays 0.071 to 0.087 (0.050 to 0.057).
- Raised slab: 0.049 (0.041). Joints 0.027 (0.031); bays 0.044 to 0.054 (0.038 to 0.043).
- A line: 0.20 (0.107), 2.0 times the front floor and 2.6 times the slab, far under the bloom
  threshold.
- Side walls: 0.165 (0.040). The darker base: 0.091 (0.022), the value of the block walls' dado
  and close to the front floor's albedo.

From:

- joints: Known, saw-cut bays of 4 to 6 m; teal aisle and assembly hall, dark joints across a
  sealed floor;
- bays: crane shop, floor slabs of unequal tone;
- lines: crane shop, yellow lines 0.1 wide along a walkway; assembly hall, one yellow lane line;
- boxes and slots: Known, yellow lines 0.1 wide around every cell and beside a set-down place;
  machine bay, a yellow line on the floor beside the machine;
- band and edge line: Known, paint at a change of level;
- darker base: double girder, the end wall's lowest band; crane shop, the base wall under the
  cladding, grimy at its foot; pillar jib for the pale wall above.

## 6. Cost

The hall covers most of every frame, so each role holds few layers, all arithmetic:

- `hall/front`: 7 layers, 1 hash, on a third or more of the frame: the cells and six
  rectangles.
- `hall/slab`: 7 layers, 1 hash: the cells, two rectangles and four clipped bands, each band
  about a rectangle and a half. They run on every pixel of `Material.003`, the back wall and
  the pipes among them.
- `hall/wall`: 1 layer, no hash.
- No role holds a `noise` or a legend; the caps are 24 layers and two `noise` layers.

If the frame rate drops under milestone 2's, the layers go in this order:

1. the slots of `yard-box-north` and `yard-box-south`, whose lines lie across the hall;
2. the slots of `yard-box-west` and `yard-box-east`;
3. the ends of the boxes around the assembly lines, then their outer sides;
4. the slab's edge line, two layers;
5. the bays' `jitter`, then the joints.

## 7. Not checked

- The stage's textures. Whether the joints and the darker base sit well on them shows in the
  owner's browser alone.
- Which pixels of a smooth curved part take a layer on `top`. A page draws a recipe on the
  interior's face, not on the stage's mesh. The figures of section 2 are measured on the built
  level by each triangle's own normal, where the view takes the mesh's shading normal.
- How far the joints carry. Computed: 0.025 is about a pixel across at 12 m, and at eye height
  the footprint along the view passes it from about 5 m.
- How far a line across the hall carries. Computed: seen edge-on from the eye, 1.72 above the
  floor, a line 0.1 wide drops under a pixel beyond about 9 m, so the lines of `yard-box-north`
  and `yard-box-south` read only inside the court.
- The sheen of a line and of a joint: the stage's roughness stays 0.55 under both.
