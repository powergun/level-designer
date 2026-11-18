# Look and lighting

This document gives the art team the look of the hall in numbers: the stage's materials,
how the hall is lit, the bloom threshold, the tuning handles and the reference levels.

A sheet shows layout, scale and silhouette, never mood. No agent judges mood, shadow, haze
or glow; the owner does, in the browser. The figures below come from the renderer's
source and from measurements of the stage and of sec-111's models, not from a browser.

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

- The environment is the hall's light. It lights a surface by its albedo and its facing,
  tops most and undersides least: a side gets 0.55 and an underside 0.22 of what a top
  gets. It adds a mirror sheen that is half of what a floor shows, and casts no shadow.
- The key stays vertical: the roof shadows a tilted key. A layer of panels in the truss
  mesh, at y 17.08 and facing down, shadows it too. With the decks, the cranes and the
  props above the floor, the key reaches about a tenth of it, as thin lines 0.5 to 1 m
  wide along x -13.5, -4.3, 5.3 and 16 and three cross bands near z 8, -17 and -66.
  Without the truss mesh it would reach half. Its lines are the only light of the hall
  that casts a shadow.

A finish page prints each face's mean albedo as linear luminance. The environment returns
it times (1 - metalness) in full on a top, 0.55 of that on a side and 0.22 on an
underside, so a side of mean 0.20 shows what a top of mean 0.11 shows.

The glows and the points:

- A glow makes a lit slab emissive, which lights nothing. A strip that must light its
  surroundings needs a point light near it, above its top or a metre under it, never
  level with its underside, where the point skims it.
- A point casts no shadow. Its highlight in a glossy finish is far brighter than its
  diffuse light, most of all where its light skims a face.
- The distance a point needs from any surface grows with its candela: a dark glossy face
  blooms by its highlight. At the back wall, the stage's darkest material, a point of 45
  cd 2.27 m off the wall stays under the bloom threshold; one of 100 cd 1.57 m off it
  makes a patch that blooms.
- A point under a deck lights the deck far more than the slab. Under the front deck, 1.7 m
  below the deck and 4.1 m above the slab, it lights the deck 26 times as much, 11 with
  the deck's tint.
- The lamps are bars 7.3 m long along z between each pair of fixture rows, the stage's
  palest surface, so a point near a bar blooms it. `Material` keeps its emissive at 0.25.

## The bloom threshold

- The bloom takes every pixel whose luminance passes 0.75, in full from 1.10. Luminance is
  0.21 R + 0.72 G + 0.07 B of the lit colour plus the emissive, taken before exposure and
  before the haze. Distance does not save a patch: a far surface blooms like a near one.
- A glow blooms when its colour's luminance times its strength passes 0.75. With their
  colours, `strip` blooms by itself from strength 0.98, `gate` from 0.83, `line` from
  1.14, `alert` from 1.30 and `eye` from 1.90.
- Under the threshold, the halo, the haze glow and the lens dirt around a glow vanish
  together. `haze.glow` only scales a halo that exists. `haze.density` also fades every
  surface with distance: at 0.012, by 30 % at 30 m and 55 % at 67 m.
- Reflected light counts too: a point's highlight on a glossy face can pass the threshold
  where the glow does not.

## The tuning handles

- `lighting.environment.intensity` moves the whole hall: floors, walls, prop tops and
  sides.
- `lighting.key.intensity` moves only the key's lines and bands. At 0 they are gone.
- Each glow's `strength` sets its tubes and the lit marks of a finish, such as the status
  points and screens of the housings, the bars of the conveyors' beds and the points of
  the arms, and nothing else.
- A point's candela and its height set its pool and its highlights; a shorter range keeps
  it off far strips and props, which it would only skim.
- The minions glint under any point by their own metal: a regular's joints are near
  mirrors, and a mini-boss's panels pass the threshold under a point. No value of the
  level ends these glints short of removing the points. A mini-boss's shoulder in a key
  line passes the threshold from a key intensity of about 1.

A role's `body.roughness` trades its highlights against glare:

- The metal roles, `steel-stock` and both `luminaire` paths, stand at metalness 0.55 and
  roughness 0.7. Measured at metalness 0.55 with the committed points: at 0.6 a fifth of
  the standing places see a highlight of 0.75 or more; at 0.65, about one in a hundred;
  from 0.7, none.
- The paints stand at metalness 0: the housings at roughness 0.7 and their top at 0.8,
  the `corrugated` walls and doors at 0.6 and their roof at 0.8, and every role of
  `beam`, `bed` and `casting` at 0.5, a gloss paint. The glare of `corrugated`, `beam`,
  the bed and the arms is computed, not measured. Where one of them glares, the cure is
  its role's roughness, toward 0.7.
- Concrete, block and timber stand at metalness 0 and roughness 0.8 to 0.9.

## Reference levels

At environment intensity 7, away from the points, the front floor shows luminance 0.054
and the slab 0.041. A strip at strength 0.4 shows 0.31, 5.7 to 1 above the floor, and a
pool shows 1.5 times the floor beside it.
