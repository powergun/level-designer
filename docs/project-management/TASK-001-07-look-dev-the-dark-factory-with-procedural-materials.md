# TASK-001.07: look-dev the dark factory with procedural materials

Part of TASK-001. The first art pass placed and lit the dressed objects but left them
plain: each carries a flat colour and a finish, and no surface detail. This subtask does
the look development. The dressed objects get procedural materials, and the level is
designed to align fully with the art direction. TASK-001 is not complete until this
subtask completes.

## The owner's requirement

The owner wrote this on 2026-11-17, after the QA of the first art pass. It is the
requirement.

```text
You can mark TASK-001.05 done and commit but TASK-001 is **NOT COMPLETE UNTIL THE
LOOK-DEV COMPLETES**. It is your responsibility to lead your team to deliver this
promise. The look-dev is expected as part of the delivery, if you didn't see it, I'm
telling you now and you write it down clearly. Use project management duty to create
TASK-001.07 for the look-dev task. Your team does not need to start from scratch, you
already have a fully working demo showing an art-directed scene:
"""D:\w\vico\fps\destruction-poc""" . The destruction lib project exists as both a
library that offers high-performance destruction simulation, and a demo showing how to
build a scene using the destructible objects efficiently **AND HOW TO DO LOOK-DEV**. DO
UNDERSTAND that destruction lib aims to be generic and not theme-aligned. Its demo is
called "HongKong Warehouse" which is a mixture of many genres and art styles. WHAT WE
WANT is a dark factory that highly resembles the real world ones shown in the reference
images. Your team must do focused study and understand how to express the destructible
objects using procedural materials and then, design the level to fully align to the art
direction. Confirm you understand this requirement clearly and precisely. IT IS YOUR
RESPONSIBILITY.
```

The demo the requirement calls "HongKong Warehouse" is destruction lib's "Wall Lab". The
owner confirmed it: only the original level design team used the earlier name, and the
demo is "Wall Lab" from here on.

## Outcome

- A focused study states how destruction lib's demo, "Wall Lab", builds a scene from
  destructible objects efficiently and how it does look development.
- The team knows how to express each kind of dressed object with procedural materials
  while the object stays destructible.
- The dressed objects of `levels/dark-factory.json` carry procedural materials, and the
  level closely resembles the real dark factories of the reference images.
- The non-destructible objects carry procedural materials too, more interesting and
  detailed than the props', because players see them close up and they never break.
- The level pair still meets the brief's constraints: new procedural textures of at most
  1K, at most 300,000 triangles, every dressed object destructible, no object without a
  material, and no light sunk in the floor or outside the interior.
- The root gates pass, and the owner's QA accepts the look.

## Task genesis

Components: the design step of this subtask names them. The work likely reaches the level
format and its GLB writer, the prop kit, the level view, the validator's rules, the
snapshot renderer and the destruction gateway, then `levels/dark-factory.json` and the
authoring guide.

Read first:

- `TASK-001-deliver-the-dark-factory-level.md`, for the brief, the owner's decisions and
  the rules. Its look development decisions bind this subtask.
- `../destruction-poc/README.md`, the knowledge documents it links, and the documents and
  source of its demo, "Wall Lab". The repository is read-only.
- Every image in `docs/art-direction/references/layout` and
  `docs/art-direction/references/mood`. They show the look to reach.
- In `docs/researches/2026-11-16-level-designer-foundation/`: `architecture.md`,
  `level-format.md` with "What sec-111 changes at adoption", `research-destructibles.md`
  and `research-rendering-lighting.md`.
- `docs/AUTHORING-GUIDE.md`, with "Look and lighting" in full: how the hall is lit, the
  measured brightness of its surfaces and the bloom threshold.
- `TASK-001-05-dress-and-light-the-hall-in-the-first-art-pass.md`, for the state of the
  first art pass.
- The three retros in `../skin-designer/docs/retros/`.

Research subjects:

- How the demo builds a scene from destructible objects efficiently.
- How the demo does look development: how it makes a procedural material, how it puts
  the material on a destructible object, and how the object looks once it is damaged.
- What the real dark factories of the reference images look like, object by object and
  surface by surface.

Rules:

- Study first, then design, then build. The level's design follows the study.
- Take the demo's method, not its look. Destruction lib is generic and not aligned to a
  theme, and its demo mixes many genres and art styles. The target is a real dark factory
  as the reference images show it.
- Do not start from scratch. Reuse what destruction lib and its demo already provide.
- From "Wall Lab", only the walls, the pillars and the spheres are references, for the
  destruction simulation and for the look development. Its statues are not: inherit and
  borrow nothing from them.
- Build no tool to measure rendering cost. The QA page shows the frame rate, and the human
  measures. "Wall Lab" holds 60 frames a second on the owner's machine unoptimised, so
  painters designed for performance with optimised shaders must run faster.
- New procedural textures are capped at 1K.
- The rules for everyone on TASK-001 apply: the sibling repositories are read-only and
  only the gateways reach them, the human alone launches the QA server and judges the
  look in a browser, and the owner commits.

Rules from the owner's annotations of the design, written on 2026-11-18:

- Keep the dressed destructible objects, which are for gameplay, clearly apart from
  static indestructible objects, which are for mood and for filling gaps.
- Give non-destructible objects the same look development, with more interesting and
  detailed materials.
- Deliver the art first, on a good-enough technical direction. Write no code that is
  obviously slow, and make no obvious performance mistake. Performance tuning is a
  separate task.
- Justify every datum added to the `.glb`: no better place holds it.
- Pause at the end of each milestone for the owner's test of art direction and overall
  performance.
- Use no headless browser, in the foreground or in the background.

Rules from the owner's rulings on static objects, given on 2026-11-18:

- A static object is floor litter or an overhead object on a wall or the ceiling. It
  only fills gaps for realism.
- A static object has no collision and takes no part in any simulation, so it never
  blocks the player.
- Floor litter is thin and small. No static object blocks or interferes with the
  player's vision.

Rule from the owner's direction of 2026-11-18, given during the build of milestone 1:

- The task is additive. The level is proved for layout: keep it and add to it. Do not
  throw away or redo what the owner has passed, and do not overcomplicate.

Rules from the owner's direction of 2026-11-18, given at the start of milestone 5:

- Milestone 5 spends effort on the static objects, the space fillers.
- Dress the factory as a place in total chaos, which the rebel robots have messed up.
  Floor litter lies everywhere: papers, metal sheets and broken tools. All sorts of
  litter and broken tools lie on the production lines and on the table tops.
- Litter therefore lies on the floor and on the tops of the lines and the tables, which
  widens the ruling on static objects above.
- Keep the static objects cheap, and add little geometry with them.

Rules from the owner's QA of milestone 5, given on 2026-11-19:

- The layout and the litter are approved. Change neither.
- Focus on the lighting. The wanted mood is a dark factory like the set of Alien:
  `docs/art-direction/references/mood/alien.jpg`.
- Reduce the lighting to fill light, which gives the silhouettes only.
- The LEDs are emissive lights with a limited radius, there so that the interior is not
  pitch black. They read like wolf eyes in a dark cave:
  `docs/art-direction/references/mood/jin-roh.jpg`.
- Work by subtraction, then by addition. First remove all the ambient lighting, which
  destroys the mood, and leave only the LED lights. Then turn the LED lights down
  aggressively, to almost pitch black. Then add lighting back selectively, and compare it
  with the references.
- No agent sees the lighting: the team derives the mood from the parameters. It may stop
  after the first step, and after any later one, for a quick test by the owner.

Rules from the owner's quick test of the subtraction, given on 2026-11-19:

- The subtraction is right: the interior is close to pitch black, and sparks of LED light
  give orientation. Keep that base.
- Add fill light carefully. It lights the silhouettes of the objects and never the entire
  interior.
- A fill light has a falloff and a limited reach.

Rules from the owner's quick test of the first fill, given on 2026-11-19:

- The fills are good progress and aligned with the art direction.
- Stop the subtraction. From here the work is additive alone.
- Add a subtle ambient light that lights the entire interior slightly. Choose a
  conservative value; the owner's QA iterates it.

Rules from the owner's quick test of the ambient, given on 2026-11-19:

- Fourteen places are too dark, and the owner marked each: the lanes along both side
  walls, on the front floor and on the raised slab, and the back of the hall.
- Light these passways with emergency wall lights, as a submarine has them, or a plant
  that handles hazardous materials: dim lights that give a passway or a tunnel just enough
  light in a total power outage.
- Their light may be blue or cold in place of red, to follow the level's theme.
- The point is to light the passways so that the player can navigate through them.

Rules from the owner's quick test of the emergency wall lights, given on 2026-11-19:

- The emergency wall lights are much better.
- Three more places need a wall light, and the owner marked each.
- Find the precise wall surface for each lamp from the owner's logged location: where
  the owner stood and where the owner looked.

Rule from the owner's approval of milestone 5, given on 2026-11-19:

- The ambient stands at 3.3, the owner's own value. Leave it there.

## Status update

(2026-11-17 19:46:54)
Created at the owner's instruction after the QA of TASK-001.05. Status WIP. The work
starts with the focused study of destruction lib's demo and of the reference images.
Remaining: the study, the design, the build, the look development of the level, the
reviews and the owner's QA.

(2026-11-17 20:11:24)
The technical study of destruction lib is written as a research report beside the design
documents; the study of the reference images is in progress. The owner confirmed that
"Wall Lab" is the demo meant. The lead decided, from the brief's texture cap and its
data-only contract, that the demo's painters are baked into texture sets of at most 1K in
the level's `.glb`. Remaining: the art study, the design, the build, the look development
of the level, the reviews and the owner's QA.

(2026-11-17 20:23:05)
Both studies are written as research reports. The owner ruled twice. Only the walls, the
pillars and the spheres of "Wall Lab" are references; its statues are not. And a
procedural material is a shader, to keep the `.glb` small; the materials are baked into
the `.glb` only if the shaders add significant rendering cost. That replaces the lead's
earlier decision to bake. The design starts with an outline whose first milestone is a
proof of the rendering cost on the owner's two machines. Remaining: the design, the
build, the look development of the level, the reviews and the owner's QA.

(2026-11-17 22:05:00)
The design is written beside the two research reports and passed two rounds of
adversarial review; three engineers hold plans and have built nothing. The owner asked to
assess the plan before development and then gave a technical direction: build no tool to
measure rendering cost, show the frame rate and let the human measure, and design the
painters for performance. The cost proof the design had as its first milestone is
cancelled, and the architect is reworking the design to that. Remaining: the reworked
design and the owner's assessment of it, the build, the look development of the level,
the reviews and the owner's QA.

(2026-11-18 08:26:02)
The owner approved the reworked plan: finishes are data-driven recipes, each layer kind
is a shader template, and the owner reads the frame rate on the QA page. The owner
confirmed the finish sheets for agents and the three plain caps on a recipe, allowed
sec-111 a copy of the generic painter files at adoption, and annotated the design and
the build plan; the rules above and the decisions of TASK-001 now hold those
annotations. Two of them widen the scope: static objects are allowed apart from the
destructible ones, and non-destructible objects get the same look development. No
development has started. The lead wrote a handoff note for the next team lead.
Remaining: fold the annotations into the design, then the build of milestones 1 to 4
with the owner's test after each, the reviews and the owner's QA.

(2026-11-18 10:25:00)
A new team lead took over; the handoff note is consumed and removed from the repository
root. The owner's annotations are folded into the design, which now holds four documents
and seven milestones, each ending in the owner's test on both machines: the first finish
on the housings; the finish sheet with the containers and the cranes; the hall's
surfaces; the other prop finishes; the level; the seals and the static objects; the
legends and the hand-off. One adversarial review found no blocker, and the architect
fixed its findings. The owner ruled on static objects; the rules above and the decisions
of TASK-001 hold the ruling. No source is built yet. Remaining: milestones 1 to 7 with
the owner's test after each, the reviews and the owner's QA.

(2026-11-18 12:12:00)
Milestone 1, the first finish, is built, reviewed and accepted, and waits for the owner's
test. It adds the painter in `finish-paint`, the finish table in the description and the
level pair, the kit's finish paths, the pattern data in the `.glb`, painted materials in
the QA view, and the housing finish on the machines, cabinets, conveyor skirts, arm
pedestals and crane hoists. Each subtask passed its own review and a fresh acceptance
review, and the root gates pass. The level keeps its 127 props, 608 slabs and its lights;
its finish table and 23 colours changed. The owner directed during the build that the
task is additive and must not be overcomplicated; the rule above and the decisions of
TASK-001 hold it. Nobody has seen the housing finish: it is computed, and the owner's
GPUs are the first to compile the painters. Status stays WIP. Remaining: the owner's
test of milestone 1, then milestones 2 to 7 with the owner's test after each, and the
owner's QA.

(2026-11-18 14:07:03)
The owner's QA of milestone 1 passed, and the owner approved in writing marking the
milestone done and successful: the owner likes the new details, sees no performance
degradation, and the QA app holds 144 frames a second, the cap of the monitor's refresh
rate. The owner asked for none of the optional changes of the art review. The lead wrote
a handoff note for the next team lead. Status stays WIP. Remaining: milestones 2 to 7
with the owner's test after each, and the owner's QA of the look.

(2026-11-18 15:53:49)
A new team lead took over; the handoff note is consumed and removed from the repository
root. Milestone 2, the finish sheet with the containers and the cranes, is built, reviewed
and accepted, and waits for the owner's test. It adds four layer kinds and the effect
`jitter` to the format and the painter, the role parameters of a container, a crate and a
partition to the kit, girder webs of 1.25 m on the bridge cranes, the finish pages of the
snapshot command, and the `corrugated` and `beam` finishes with one door end on each
container. Each subtask passed its own review, a fresh acceptance review found no blocker,
and the root gates pass. The level keeps its 127 props in place and its lights. It now
holds 616 slabs, because a girder web of that depth splits in two above a span of 20.3 m.
The lead departed from the build plan in three places: one finish page per finish path in
place of one sheet, no chevrons on the split girders, and no change to the housings the
owner passed. The owner directed that the team's art review stays short, because the owner
does the real art review in the human test. Nobody has seen the new finishes under the
level's lights: the recipes are computed, and the owner's GPUs are the first to compile
the new kinds. Status stays WIP. Remaining: the owner's test of milestone 2, then
milestones 3 to 7 with the owner's test after each, and the owner's QA of the look.

(2026-11-18 16:01:06)
The owner's QA of milestone 2 passed, and the owner approved in writing marking the
milestone done: the art is directionally aligned, and the owner sees no performance issue.
The owner repeated two directions for the milestones ahead: the team's art review stays
light and quick, and the acceptance review adds no overcomplication. Status stays WIP.
Remaining: milestones 3 to 7 with the owner's test after each, and the owner's QA of the
look.

(2026-11-18 16:40:24)
Milestone 3, the hall's surfaces, is built, reviewed and accepted, and waits for the
owner's test. It adds a finish on a base override, with the limits of a hall finish, to
the format; the finish path on a stage material to the `.glb`; the hall's frame rule to
the painter; the stage wrap to the QA view; the hall pages to the snapshot command; and
the finish `hall` to the level: joints on both floors, two aisle lines and a band at the
ramp's foot on the front floor, an edge line on the raised slab and a darker base on the
side walls. Each engineering subtask passed its own review. The art work got one light
pass on rules only and the acceptance review one short pass, as the owner directed, and
neither found a blocker. The root gates pass. The level keeps its 127 props, its 616 slabs
and its lights. Nobody has seen the hall finishes on the stage's textures or a wrapped
program on a GPU, and the floors cover a third or more of every frame, so the owner's test
is the frame rate's hardest so far. Status stays WIP. Remaining: the owner's test of
milestone 3, then milestones 4 to 7 with the owner's test after each, and the owner's QA
of the look.

(2026-11-18 17:24:42)
The owner's QA of milestone 3 passed, and the owner approved in writing marking the
milestone done: the art is directionally aligned, and the owner sees no performance drop
with the floors and the walls painted. Status stays WIP. Remaining: milestones 4 to 7 with
the owner's test after each, and the owner's QA of the look.

(2026-11-18 18:11:32)
Milestone 4, the other prop finishes, is typed, reviewed and accepted, and waits for the
owner's test. The art team typed the seven finishes `cast-concrete`, `bed`, `casting`,
`timber`, `steel-stock`, `luminaire` and `block` into the level, with their lit parts and
without legends: the two brick fences are painted block, five partitions are barriers and
three steel stacks carry posts. No component changed. The level keeps its 127 props in
place, its 616 slabs and its lights; the crates, the timber stacks, the concrete and the
fences rise in value onto the ladder's mid step. The lead ruled that the beds' rails stay
paint, where the brief asked for bare metal. The art work got one light pass on rules only
and the acceptance review one short pass, and the root gates pass. Nobody has seen the
seven finishes or their lit marks under the level's lights, and the view compiles 17 more
programs at its start. Status stays WIP. Remaining: the owner's test of milestone 4, then
milestones 5 to 7 with the owner's test after each, and the owner's QA of the look.

(2026-11-18 18:29:00)
The owner's QA of milestone 4 passed, and the owner approved in writing marking the
milestone done: the art is aligned, and the owner sees no performance drop with every prop
painted. The owner asked for a handoff note for the next team lead. Status stays WIP.
Remaining: milestones 5 to 7 with the owner's test after each, and the owner's QA of the
look. Milestone 5 adds a prop only where the owner asks for it.

(2026-11-18 18:52:00)
A new team lead took over; the handoff note is consumed and removed from the repository
root. The owner opened milestone 5 with a direction: spend effort on the static objects,
the space fillers, as the litter of a factory in chaos, on the floor and on the tops of
the lines and the tables, cheap and with little geometry. The rules above and the
decisions of TASK-001 hold it. The lead ruled on the scope: milestone 5 builds the static
objects that the design held for milestone 6, beside its floor lines, and the seals'
finishes and the overhead objects stay in milestone 6. The lead reads the table tops as
the bench-high tops of the level's props, because the level holds no table. The art
study's two offers, cabinets beside the housings and stock in the yard, stay out without
the owner's word. No source is built yet. Status stays WIP. Remaining: milestone 5 with
the owner's test, then milestones 6 and 7 with the owner's test after each, and the
owner's QA of the look.

(2026-11-18 20:52:46)
Milestone 5, the floor lines and the litter, is built, reviewed and accepted, and waits
for the owner's test. The owner confirmed in writing the lead's reading of the table
tops. The milestone adds static objects to the format, the `.glb`, the validator, the
build and the finish sheet, in five components; the view and the QA page did not change.
The level gains seven floor lines, a box around each assembly line and side lines at four
slots of the yard, and 200 static objects in five new finish paths: papers, cartons, metal
sheets, pallets, broken tools and trays, 146 on the floors and 54 on the conveyors' decks,
crate lids and stack tops. It keeps its 127 props in place, its 616 slabs and its lights,
and holds 136,289 triangles. Litter on a prop is a third place for a static object: the
`.glb` names the slab it lies on, so that sec-111 hides the litter with that slab at
adoption. Each engineering subtask passed its own review, the art work one light pass on
rules and the acceptance review one short pass, and the root gates pass. Nobody has seen
the litter or the new lines under the level's lights, and the view compiles five more
programs at its start. Status stays WIP. Remaining: the owner's test of milestone 5, then
milestones 6 and 7 with the owner's test after each, and the owner's QA of the look.

(2026-11-19 08:57:00)
The owner committed milestone 5 and tested it: the layout and the litter are good and
approved. The owner found a mismatch of mood in the lighting, added two reference images,
the set of Alien and the wolf eyes of Jin-Roh, and directed a darker factory: fill light
for the silhouettes alone, and LEDs of a limited radius that read like wolf eyes in a
cave. The rules above and the decisions of TASK-001 hold the direction. The team adjusts
the lighting alone, and the owner tests again. Status stays WIP. Remaining: the lighting
pass with the owner's test, then milestones 6 and 7 with the owner's test after each, and
the owner's QA of the look.

(2026-11-19 09:07:40)
The owner confirmed the lead's reading of the mood and gave the method: subtract, then
add, with a quick test by the owner after a step; the rules above hold it. Step one, the
subtraction, is in the level as two values: the environment's intensity and the key's
intensity stand at 0, so only the eight points and the glows light the hall. The validator
accepts the level and the root gates pass. Nobody has seen it. Steps two and three are
being prepared and wait for the owner's feedback on step one. Status stays WIP.
Remaining: the owner's quick test of step one, the rest of the lighting pass with the
owner's test, then milestones 6 and 7 with the owner's test after each, and the owner's QA
of the look.

(2026-11-19 10:06:22)
The owner tested the subtraction and passed it as the base, skipped the turning down of
the LEDs, and asked for fill light with a falloff and a limited reach, for the silhouettes
alone; the rules above hold it. The first fill is in the level as three point lights: the
three lamps of the old hall that lit no LED's surroundings, the bay light and the two
aisle pools, became low, cool fills of a short range at the ramp top and at one enclosure
end of each assembly line. The format admits eight points and the level uses all eight,
so this step adds no point: the warm light on two cranes and the two pools over the aisle
are gone with it. The validator accepts the level and the root gates pass. Nobody has
seen it. Status stays WIP. Remaining: the owner's quick test of the first fill and a
ruling on the cap of eight points, the rest of the lighting pass with the owner's test,
then milestones 6 and 7 with the owner's test after each, and the owner's QA of the look.

(2026-11-19 10:20:33)
The owner tested the first fill and passed it as aligned with the art direction, ended
the subtraction and asked for a subtle ambient light over the entire interior, at a
conservative value that the owner's QA iterates; the rules above hold it. The ambient is
in the level as one value: the environment's intensity stands at 2, where it stood at 7
in the first art pass. By the model it is the lowest value at which the front floor
leaves the display's black, while the raised slab and the walls stand at the black
point. The validator accepts the level and the root gates pass. Nobody has seen it. The
owner gave no ruling on the cap of eight points, and no further fill is planned until
the owner asks for one. Status stays WIP. Remaining: the owner's quick test of the
ambient, the rest of the lighting pass with the owner's test, then milestones 6 and 7
with the owner's test after each, and the owner's QA of the look.

(2026-11-19 11:55:35)
The owner tested the ambient, marked fourteen places along the passways as too dark and
asked for emergency wall lights there; the rules above hold it. The level gains fourteen
of them, one for each marked place: a small lamp on a wall or a pier, a static object
with the new cold blue glow `emergency`, and a point light of a limited reach that stands
between the lamp and the lane. The format's cap of point lights rises from 8 to 24 for
it, a change of `level-format` with its own review, and the level now holds 22 points and
214 static objects. The key, at intensity 0 since the subtraction, is removed from the
level, which changes no pixel and saves a shadowed light. A first placement lit the walls
and left the floors at five marks dark; the lead changed its ruling and the points moved
out toward the lanes. One test of `level-pipeline` counted the glows of props alone and
now counts those of static objects too. The validator accepts the level and the root
gates pass. Nobody has seen it, and the frame rate with 22 points is the owner's to read.
The look and lighting document follows when the owner has passed the lighting. Status
stays WIP. Remaining: the owner's quick test of the emergency lights, the rest of the
lighting pass with the owner's test, then milestones 6 and 7 with the owner's test after
each, and the owner's QA of the look.

(2026-11-19 12:05:00)
The owner tested the fourteen emergency lights, found them much better and marked three
more places that need one; the rules above hold it. The level gains the three. For each,
the owner's logged view was cast against the stage of the built level: two lamps hang
where that view meets a side wall, and the third hangs on the wall beside the owner,
behind a row of tubes, because the tank ahead is curved and carries no lamp. The cap of
point lights rises once more, from 24 to 32, and the level now holds 25 points and 217
static objects. The validator accepts the level and the root gates pass. Nobody has seen
it. Status stays WIP. Remaining: the owner's quick test of the three lights, the rest of
the lighting pass with the owner's test, then milestones 6 and 7 with the owner's test
after each, and the owner's QA of the look.

(2026-11-19 12:50:00)
The owner tested the three further lights, raised the ambient by hand from 2 to 3.3 and
approved milestone 5 in writing: the layout, the litter and the lighting. Milestone 5 is
done. The level holds 127 props, 616 slabs, 217 static objects, 200 pieces of litter and
17 emergency lamps, 25 point lights and no key, at an ambient of 3.3; the rule above
holds that value. The look and lighting document states the lighting as the owner passed
it, with the display's black point, the three kinds of point and the way to add an
emergency wall light from a mark; the guide, the project knowledge, the design and the
art notes are in line with it. The root gates pass. The lead wrote a handoff note for the
next team lead. Status stays WIP. Remaining: milestones 6 and 7 with the owner's test
after each, and the owner's QA of the look.
