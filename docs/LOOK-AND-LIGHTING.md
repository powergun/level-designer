# Look and lighting

This document gives the art team the look of the hall in numbers: the mood, the stage's
materials, how the hall is lit, the display's black point, the bloom threshold, the tuning
handles, how to add an emergency wall light and the reference levels.

A sheet shows layout, scale and silhouette, never mood. No agent judges mood, shadow, haze
or glow; the owner does, in the browser. The figures below come from the renderer's
source and from measurements of the stage and of sec-111's models, and every level is
computed from them: none comes from a browser.

## The mood

The mood is the owner's, and the lighting stands as the owner passed it by eye on the QA
page:

- The hall is a dark factory, like the set of Alien:
  `docs/art-direction/references/mood/alien.jpg`.
- Fill light gives the silhouettes of the objects and never lights the entire interior. A
  fill has a falloff and a limited reach.
- The LEDs are emissive lights of a limited radius, there so that the interior is not
  pitch black. They read like wolf eyes in a dark cave:
  `docs/art-direction/references/mood/jin-roh.jpg`.
- A subtle ambient lights the entire interior slightly.
- Emergency wall lights give the passways just enough light to navigate, as in a
  submarine or in a plant that handles hazardous materials. Their light is a cold blue.

Measured on the two images, as display luminance:

- Alien: the dark ground and the floor stand at 0.0020, and the ribbed wall behind them
  at 0.0040. Only 2.3 % of the frame passes 0.05. Forms read by thin edges, not by lit
  faces, and the one lamp is a few pixels at 0.51.
- Jin-Roh: an eye's core is 0.9 % of the frame's width. It reaches 0.38 inside a figure
  at 0.0055, 68 to 1, and lights nothing.

On that scale the level's front floor shows 0.0024 away from the points.

## The stage's materials

The base overrides in `base.materials` take the stage's material names. An override tints
or retunes every surface that uses the name. Each material below gives its surfaces and
`a`, the mean linear luminance of its base colour texture on those surfaces:

- `Material`: the lamps of the ceiling fixtures, untextured at 0.8, the stage's only
  emissive material.
- `Material.001`: the front floor and the sloped upper panels, 0.21.
- `Material.002`: the side walls with their piers and corbels, the door and window frames,
  the deck columns and the back tower, 0.29.
- `Material.003`: the raised slab with the ramp, the back wall, the partitions under the
  decks, most pipes and tanks, and parts of the fixtures, 0.049.
- `Material.004`: the low wall panels on +X and one on -X, 0.22.
- `Material.005`: the ceiling, the three tall tubes and the -X pipe run, 0.054.
- `Material.006`: the trusses, the three pipe columns and parts of the fixtures, 0.10.
- `Material.007`: the three decks, 0.22.
- `Material.008`, `Material.009` and `Material.010`: the crate stacks on the slab
  islands, 0.17, 0.19 and 0.09.

Three materials carry a hall finish, which draws over their own look on every surface of
the material: `Material.001` takes `hall/front`, `Material.003` `hall/slab` and
`Material.002` `hall/wall`. Beyond the floors, the floors' layers on `top` also reach every
up-facing surface of their material, on `Material.003` the tops of pipes, tanks and fixture
parts and the band of a curved part that faces up; the sloped panels of `Material.001` face
sideways and take none. The walls' darker base reaches every sideways face of
`Material.002` below y 1.4: the piers, the pilasters and the feet of the door frame, the
deck columns and the back tower.

An override tints the texture but never replaces it. A surface returns diffuse light by
its `a` times its tint times (1 - metalness). A tint therefore serves the pale materials:
it lowers them toward the dark ones, so that the lights can rise for the dark ones. On a
dark material it turns near black into black. A floor tint moves a floor about half as
much as its number says: the other half is the environment's sheen, which the roughness
0.55 of `Material.001` and `Material.003` sets, not the texture or the tint. The minions
are about half metal: a regular's surface averages an albedo of 0.23 and a mini-boss's
0.34.

## How the hall is lit

The level states an environment, 25 point lights and six glows. It states no key, so no
light of the level casts a shadow.

- The environment is the ambient, at intensity 3.3. It lights a surface by its albedo and
  its facing, tops most and undersides least: a side gets 0.55 and an underside 0.22 of
  what a top gets. It adds a mirror sheen that is half of what a floor shows.
- A glow makes a lit slab or a lit box emissive, which lights nothing. A strip that must
  light its surroundings needs a point light near it, above its top or a metre under it,
  never level with its underside, where the point skims it.
- The LEDs are the level's glows: 21 light strips in `strip`, `gate` and `alert`, the lit
  marks of the 7 enclosures and the 6 conveyors in `line`, those of the 16 arms and the
  lamp pairs of the 3 hanging signs in `eye`, and the 17 emergency lamps in `emergency`.
  The boards on the piers, the sign on the front deck, the pipe runs and the seals carry
  no lit part.

A finish page prints each face's mean albedo as linear luminance. The environment returns
it times (1 - metalness) in full on a top, 0.55 of that on a side and 0.22 on an
underside, so a side of mean 0.20 shows what a top of mean 0.11 shows. As luminance at
intensity 3.3, a top shows 0.21 of its albedo, a side 0.11 and an underside 0.046.

### The three kinds of point

- An LED point lights the surroundings of the strips beside it, 1.0 to 2.5 m away. Five
  stand: at the ramp's lip, 12 cd with a range of 8 m; over the fall lane, 10 cd and 8 m;
  at the back wall, in amber, 45 cd and 10 m; at the gate, 24 cd and 10 m; and over the
  yard's court, 65 cd and 14 m.
- A fill lights a face, so that a body or a prop before it reads as a shape. Three stand,
  in a cool blue, `[0.5, 0.72, 1]`: one of 14 cd with a range of 7 m, 2.0 m before the
  stage's crate stacks behind the ramp, and two of 12 cd and 6 m, each 2.3 m before the
  north end of an enclosure, `line-e-enc-1` and `line-w-enc-2`.
- An emergency point lights a passway's floor before its lamp. Seventeen stand along the
  lanes beside both side walls, on both floors, and at the back wall: at y 3.45, with 18
  to 59 cd and a range of 12 m, in the colour of the glow `emergency`, `[0.15, 0.3, 1]`.

A fill serves faces. It hangs 3.1 m over its floor, the lowest place where no body comes
nearer than 1 m. By itself it gives its enclosure's end face a mean of 0.029 to 0.036,
and 0.080 to 0.085 at the upper corner on the aisle. On the floor it adds 0.019 under
it, 0.004 at 3 m and nothing from 4.5 m on.

What holds for every point:

- A point casts no shadow. Its highlight in a glossy finish is far brighter than its
  diffuse light, most of all where its light skims a face.
- The distance a point needs from any surface grows with its candela: a dark glossy face
  blooms by its highlight. At the back wall, the stage's darkest material, a point of 45
  cd 2.27 m off the wall stays under the bloom threshold; one of 100 cd 1.57 m off it
  makes a patch that blooms.
- A point under a deck lights the deck far more than the slab. Under the front deck, 1.7 m
  below the deck and 4.1 m above the slab, it lights the deck 26 times as much, 11 with
  the deck's tint.
- The stage's lamps are bars 7.3 m long along z between each pair of fixture rows, the
  stage's palest surface, so a point near a bar blooms it. `Material` keeps its emissive
  at 0.25.

### A key in this hall

The level states no key. A level that states one gains the hall's only light with a
shadow, and every lit pixel then evaluates one more light, also at intensity 0:

- A key stays vertical: the roof shadows a tilted key. A layer of panels in the truss
  mesh, at y 17.08 and facing down, shadows it too. With the decks, the cranes and the
  props above the floor, a vertical key reaches about a tenth of the floor, as thin lines
  0.5 to 1 m wide along x -13.5, -4.3, 5.3 and 16 and three cross bands near z 8, -17 and
  -66. Without the truss mesh it would reach half.
- `lighting.key.intensity` moves only those lines and bands.
- A mini-boss's shoulder in a key line passes the bloom threshold from a key intensity of
  about 1.

## The display's black point

The page shows a scene luminance through the game's grade and tone curve, which press
the low end into black. For the environment's cool grey, as sRGB codes R, G, B:

- Under about 0.014 the page shows black: 0.012 shows (0,0,8).
- Above it, 0.02 shows (0,4,20), 0.03 (0,11,34) and 0.054 (4,30,66).

The black point decides every low value, because light under 0.014 is spent on black.
The ambient stands where the largest surfaces have left black. A fill and an emergency
point lift their faces and floors clear of it. Whatever stays under it reads as a
silhouette alone: at the level's ambient the walls' darker base, a container's side and
an arm. The codes are computed: they leave out the vignette, the grain and the monitor.

## The bloom threshold

- The bloom takes every pixel whose luminance passes 0.75, in full from 1.10. Luminance is
  0.21 R + 0.72 G + 0.07 B of the lit colour plus the emissive, taken before exposure and
  before the haze. Distance does not save a patch: a far surface blooms like a near one.
- A glow blooms when its colour's luminance times its strength passes 0.75. With their
  colours, `strip` blooms by itself from strength 0.98, `gate` from 0.83, `line` from
  1.14, `alert` from 1.30, `eye` from 1.90 and `emergency` from 2.35. At their strengths
  the six stand at 0.38 to 0.54 of the threshold, so no glow of the level blooms.
- Under the threshold, the halo, the haze glow and the lens dirt around a glow vanish
  together. `haze.glow` only scales a halo that exists. `haze.density` also fades every
  surface with distance: at 0.012, by 30 % at 30 m and 55 % at 67 m.
- Reflected light counts too: a point's highlight on a glossy face can pass the threshold
  where the glow does not.

## The tuning handles

The ambient and the glows:

- `lighting.environment.intensity` moves the whole hall: floors, walls, prop tops and
  sides. A unit adds 0.0077 to the front floor, 0.0058 to the raised slab and 0.0057 to
  a side wall.
- Its steps of 0.5 follow the black point. At 1.5 the floors and the walls show black,
  and only tops, floor lines and papers show. 2 is the lowest step at which the front
  floor leaves the display's black, at 0.0154. At 2.5 the slab and the walls leave it
  too, at 0.0145 and 0.0143. The level's value is 3.3.
- Each glow's `strength` sets its tubes and the lit marks of a finish, such as the status
  points and screens of the housings, the bars of the conveyors' beds and the points of
  the arms, and nothing else.
- `glows.eye.strength` is the handle for a halo. At the level's 0.75 an arm's accent is
  an orange point without a halo. At 6 it stands 3.2 times over the threshold: its halo
  adds 0.09 to 0.14 at 0.1 m beside the accent and ends by 0.5 m, and the grade clips its
  core to a warm white.

The points:

- A point's candela and its height set its pool and its highlights; a shorter range keeps
  it off far strips and props, which it would only skim.
- A fill's two steps are its candela times 0.6 and times 1.5. By the fill alone, they
  take the mean of its enclosure's end face to 0.017 to 0.022 and to 0.044 to 0.054. At
  times 1.5 the highlight on the head of `line-e-arm-4`, 1.54 m from its fill, reaches
  0.76 and passes the bloom threshold.
- An emergency point's two steps are the same factors, and its part of every level
  follows its candela. The worst highlight of the seventeen stands at 0.42, on a tank
  2.45 m from a point of 59 cd. It falls to 0.25 at times 0.6 and rises to 0.63 at times
  1.5.

Every lit pixel evaluates every point. If the frame rate drops, points go and their lamps
stay: first those of `emergency-10` and `emergency-11`, where the amber strips and their
point mark the back wall, then those of `emergency-3` and `emergency-4`, where the gate's
strips mark the sealed end. 21 points remain.

The minions glint under any point by their own metal: a regular's joints are near
mirrors, and a mini-boss's panels pass the threshold under a point. No value of the level
ends these glints short of removing the points. Right under an emergency point of 59 cd
a large minion's top takes about 0.9 while it stands there.

A role's `body.roughness` trades its highlights against glare:

- The metal roles, `steel-stock` and both `luminaire` paths, stand at metalness 0.55 and
  roughness 0.7. Measured at metalness 0.55 under the eight points of the first art pass,
  five of which stand: at 0.6 a fifth of the standing places see a highlight of 0.75 or
  more; at 0.65, about one in a hundred; from 0.7, none.
- The paints stand at metalness 0: the housings at roughness 0.7 and their top at 0.8,
  the `corrugated` walls and doors at 0.6 and their roof at 0.8, and every role of
  `beam`, `bed` and `casting` at 0.5, a gloss paint. The seals stand at 0.9, the flat ones
  by their own keys and the painted ones by the bodies of `corrugated/cladding` and
  `corrugated/slats`, so a point's highlight on a seal is the same either way. The signs'
  boards stand at 0.8, their rods and the pipe runs at 0.7. The glare of `corrugated`, `beam`,
  the bed and the arms is computed, not measured. Where one of them glares, the cure is
  its role's roughness, toward 0.7.
- Concrete, block and timber stand at metalness 0 and roughness 0.8 to 0.9.

## Adding an emergency wall light

An emergency wall light is a pair: a lamp, which a player sees, and a point, which lights
the passway. The owner marks the place on the QA page, and the mark logs where the owner
stood and where the owner looked.

- The face: cast the mark's view, level at y 3.45, against the stage of the built level.
  The lamp hangs where the view meets a flat face of a wall or a pier. Where it meets a
  curved part, a tank or a tube, the lamp hangs on the nearest flat face beside the mark.
- The lamp: an overhead static object with its back on the face. Its `size` is
  `[0.1, 0.16, 0.4]`, with the 0.4 along the wall, so `[0.4, 0.16, 0.1]` on the back
  wall. Its `lift` is 3.37 on the front floor and 3.0459 on the raised slab: every lamp's
  centre stands at y 3.45, and its underside 3.05 m over the slab, above the hang height
  of 2.17 m. It takes `color` `#1a1c1f`, `finish` `luminaire/band` and `glow`
  `emergency`.
- The point: at y 3.45, on the line from the lamp through the mark and near the mark,
  1.85 to 4.5 m off the lamp's face and 1.27 m or more from every prop slab and stage
  part. It takes the glow's colour and a range of 12 m.

The candela is the value by which the point adds 0.012 to the floor at the mark on the
front floor, or 0.016 on the raised slab. That floor then shows 0.038 or 0.035 at the
level's ambient; the seventeen were solved for 0.0275 at an environment of 2.

The method has limits:

- Every level of it is computed and none is seen: the owner's test on the QA page
  decides.
- A neighbour can move a point off its line or hold its candela under that value: the
  floor under the point itself, a wall beside a narrow lane, a pale prop in the pool or
  the highlight on a glossy part. The floors at six of the seventeen marks stand lower
  for it.
- A point casts no shadow, so it also lights a deck's underside above it and every pale
  thing in its reach.
- A lamp shows from its front. `emergency-15` hangs behind a row of tubes and shows
  through a gap of 0.64 m, within about 18 degrees of square-on.

## Reference levels

Away from the points, at the environment's 3.3, as scene luminance with its display code:

- the front floor 0.0255 (0,7,28) and the raised slab 0.0192 (0,3,19);
- a side wall 0.0189 (0,3,19) above its base, and its darker base 0.0104, black;
- a housing's top 0.0375 (0,17,45) and its side 0.0206 (0,4,21);
- a floor line 0.051 (3,28,62), 2.0 times the front floor, and a paper on a top 0.067
  (9,40,81);
- a container's side 0.007 to 0.012 and an arm 0.0015, both black.

The LEDs keep their levels at any ambient. A strip at strength 0.4 shows 0.31, 12 to 1
above the front floor; an emergency lamp shows 0.29 and the stage's lamp bars 0.21.

Under an LED point the floor shows 1.28 to 1.80 times the floor away from it, under a
fill 1.74 to 1.77 times and under an emergency point 1.47 to 2.55 times. On an open floor
an emergency point adds a quarter of the floor's level out to 2.4 to 4.6 m and a tenth
out to 4.4 to 6.4 m.

The art team's notes state their hall luminances at the first art pass's lights, an
environment of 7 with the front floor at 0.054 and the slab at 0.041. Away from the
points a level follows the environment's intensity, so the level shows 0.47 of such a
figure.
