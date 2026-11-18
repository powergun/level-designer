# TASK-001: deliver the dark factory level with the level designer

Build the level designer in this repository and use it to dress the old factory stage of
sec-111 into a "dark factory" level. The task ends when the owner's QA accepts the level
pair: a `.glb` with the sealed, dressed factory and a `.json` with the destructible props
and the lighting. The delivery includes the look development of the dressed objects: the
task is not complete until TASK-001.07 completes. Adopting the pair in sec-111 follows as
a separate task in the sec-111 repository.

## The owner's brief

The owner wrote this brief on 2026-11-16. It is the requirement.

```text
# level designer app

## Background

We currently reply on a downloaded .glb (old_factory_free.glb) and a fix JSON description
to dress up the stage with our in-house destructible walls.

This setting works for the early prototype, but as our project moving towards an internal
beta testing, we need a proper level design format and pipeline.

We need a standalone app to author the level data.

We should stay with .glb (mesh + material + textures + operational metadata) and .json
for any in-house gameplay-specific information

The new standalone app is called "level designer" and its repo in "../level-designer".
It is guaranteed a sibling repo.

## Art direction

### Build on the existing factory level

We want to customize (dress up) the old factory level with our in-house destructible
objects to make the interior look more like a "dark factory" (i.e., a Xiaomi car factory)
which matches our theme of "robots rebeling against human"

We will not author a brand new level from scratch as it is too complex and challenge.
It is better to build on something that is already proven in the prototype and QA.

We will fully seal the old factory, and close the opening side.

### Add procedurally-authored objects

We will procedurally add geometry resembling production pipelines, storage containers
and interior cranes under the ceiling.

We have gathered some reference images:

- layout: docs/art-direction/references/layout
- mood (dark factory): docs/art-direction/references/mood

We should use our in-house destructible system from "destruction lib"
(../destruction-poc/README.md) so all the procedurally dressed objects can be destroyed
with proper physics model (wood, brick, concrete, metal)

### Lighting

Lighting is part of the output. We will use lighting to achieve the mood reference.
Lighting information can be saved in the .json file.

### QA and playtest

We will build a minimal walk-through FPS QA mode so we can QA the level.
This app should allow human to fly as well.

## Technical direction

This new app can depends on destruction lib repo and sec-111.

It will operate on its own. Only its level data is consumed by sec-111 game project
(not its code)

### Project boostrapping and dev-ops pipeline

You should generally mirror the dev-ops pipeline in sec-111 and destruction lib, meaning
just setup, just test and just lint; however, since level designer project is a new
project, you do not need to establish the complete pipeline upfront; you can build it as
you develop the project.

### Technical structure

Use the component-driven design.

The walk-through QA app is a thin and lean component that runs as a web app in browser.
This app is for human. This app should offer coordinate recording function (press F3) so
human can mark problematic area by walking there and press F3 and type a comment.
The information should be saved in a log file in .tmp/ directory.

We should provide agent-friendly authoring feature so agents can follow the art
references to dress up the original .glb. This process does not require interactivity.
We follow the principle of "only build what we need". As soon as the new level passes QA
and delivers the art expectation, we will stop any development.

The level design pipeline and data flow should be implemented in several small,
single-responsibility and purpose-built components. These components form the internal
"library layer".

### Constraints

New procedural textures will be capped at 1K. This can be a hardcoded setting in the
source code.

Polycount for the dressed up level should be capped at 300k. This can be done via a
simple validator cli.

Other validation include: 1) no lights sinked in floor or outside the interior;
2) no objects without materials

## Operation

Your role is the team lead. You lead a team of fable 5.2 and opus 5.5 subagents.
Use the fable 5.2 subagents for designing and architecturing; use the opus 5.5 subagnets
for source code development and review.

Once this operation starts, firstly, bootstrap the new repo and establish the library
layer, the QA app and the necessary level dressing tools for the agents.

Then, do the first pass of level dressing and lighting, followed by human QA.

From there, human will provide concrete art improvement feedback, and your team will
continue iterating on them.
```

## The owner's decisions

The owner answered the lead's questions on 2026-11-16. These answers bind the task.

Scope and tools:

- The operation includes sec-111 adoption, after the level passes QA. Until then sec-111
  stays untouched.
- The QA app walks and flies; the human cannot shoot in it. Automated checks prove that
  destruction lib admits and damages every dressed object.
- The QA app renders through the game's renderer, the rendering-poc pipeline, so the
  approved mood is the game's mood.
- Agents see the level through browser-free snapshot sheets. The human alone judges mood
  and lighting in the browser.
- The level pair is a build product of a committed level description. It is written under
  the scratch directory and exported to sec-111 at adoption.
- The owner commits in this repository. The team never commits or pushes: it hands over
  a tree where both root gates pass, and QA runs the owner's commit.

Art and gameplay:

- The first pass dresses the hall with assembly lines (conveyors, machine enclosures,
  simple robot arms), storage containers and cranes under the ceiling. No car bodies.
- Every dressed object is destructible. If destruction budgets cannot carry the dressing,
  the dressing shrinks. Static objects follow the look development decisions below.
- The six free-standing walls of the current level are removed. Dressed objects supply
  all cover.
- Dressed objects are built from destruction lib wall slabs. The owner accepts three
  limits: a shot-through object never collapses, SMG rounds do nothing on a slab's thin
  edges, and settled debris falls through to the floor.
- The first pass builds no texture. Surface detail waits for the owner's QA feedback.
- A blown-open container or enclosure can hide the player from minions. The first pass
  accepts this; the fix belongs to adoption.

Look development, decided on 2026-11-17 after the QA of the first art pass:

- The look development is part of the delivery. TASK-001 is not complete until it
  completes, and the team lead is responsible for delivering it.
- The dressed objects get procedural materials, and the level is designed to align fully
  with the art direction: a dark factory that closely resembles the real ones in the
  reference images.
- The team does not start from scratch. Destruction lib is both a library and a demo,
  "Wall Lab", which shows how to build a scene from destructible objects efficiently and
  how to do look development. The team studies it first. The owner's requirement calls
  the demo "HongKong Warehouse", a name only the original level design team used.
- The team takes the demo's method, not its look. Destruction lib is generic and not
  aligned to a theme, and its demo mixes many genres and art styles.
- Only the demo's walls, pillars and spheres are references, for the destruction
  simulation and for the look development. Its statues are not inherited or borrowed.
- A procedural material is a shader, so the `.glb` stays as small as possible. If the
  shaders add significant rendering cost, the materials are baked into the `.glb`
  instead.

Decided on 2026-11-18, when the owner approved the look development plan and annotated
its design:

- Static, indestructible objects are allowed, for mood and to fill gaps. They stay
  clearly apart from the dressed destructible objects, which are for gameplay.
- Non-destructible objects get the same look development. They survive gunshots and
  players see them close up, so their materials are more interesting and detailed, in a
  balance of quality and performance.
- The art comes first, on a good-enough technical direction. The team writes no code
  that is obviously slow and builds no tool to measure cost: the owner reads the frame
  rate on the QA page. Focused performance tuning is a separate task, after the art is
  approved.
- "Small" sets no hard limit on the `.glb`. Every datum added to it is justified: no
  better place holds it, judged by implementation complexity, load time and ease of
  development.
- The team pauses at the end of each milestone, and the owner tests the build for art
  direction and overall performance.
- Agents use no headless browser, in the foreground or in the background.
- At adoption, sec-111 may take a copy of the generic painter files.

Decided on 2026-11-18, when the build of the look development started:

- A static object is floor litter or an overhead object on a wall or the ceiling. Its
  only purpose is to fill gaps for realism.
- A static object has no collision and takes no part in any simulation. It never blocks
  the player.
- Floor litter is thin and small. No static object blocks or interferes with the
  player's vision.
- The look development is additive and must not be overcomplicated. The level is proved
  for layout: it stays, and nothing the owner has passed is thrown away or redone.

## What to read

The design in `docs/researches/2026-11-16-level-designer-foundation/` is the technical
source of truth. Read it before the subtask document:

- `architecture.md`: the data flow, the components, the tools, the QA app and the test
  strategy.
- `level-format.md`: the level description, the level pair, the lighting mapping rules
  and the validator's checks.
- `build-plan.md`: the milestones, the subtasks with their checks, the art pass and the
  hand-off checklist.
- The three research reports beside them hold the evidence: destructible objects, the
  renderer and lighting, and the sec-111 level contract with the hall in numbers.

Also read the root `CLAUDE.md`, the house rules it names, and the three retros in
`../skin-designer/docs/retros/`. That team built a similar app; its lessons apply here.

## Rules for everyone on this task

- The human alone launches the QA server and judges the level in a browser. Agents never
  launch a server or a browser.
- sec-111, destruction-poc and rendering-poc are read-only. Only the three gateway
  components reach them.
- Only build what we need. Every component, field, check and recipe names its consumer.
- An engineer edits only their own component. Root files belong to the integrator. Root
  gates run one at a time under the gate lock the lead names.
- The whole test recipe stays fast. One level preparation costs about 3 s; the build plan
  says which tests may prepare.
- The app never fails silently. Before a hand-over for QA, name the file that explains a
  failure on the owner's machine.
- A report separates what was verified from what is inferred, and names what was not
  checked.

## Subtasks

Subtasks 01 to 06 are the milestones of the build plan. TASK-001.07 follows from the
owner's QA of the first art pass.

- TASK-001.01: build the sibling gateways and the level formats (milestone 1).
- TASK-001.02: build the slab model, the prop kit and the snapshot renderer
  (milestone 2).
- TASK-001.03: build the rules, the pipeline and the tool until the sealed hall builds
  (milestone 3).
- TASK-001.04: build the QA app (milestone 4).
- TASK-001.05: dress and light the hall in the first art pass (milestone 5).
- TASK-001.06: hand the first pass to the owner for QA (milestone 6).
- TASK-001.07: look-dev the dark factory with procedural materials. TASK-001 is not
  complete until this subtask completes.

## Status update

(2026-11-16 14:44:10)
The owner approved the scope through two rounds of questions. The workspace and its
pipeline are bootstrapped and committed. Three research reports, the design and its
adversarial review are done; the design documents are being revised to the review's
rulings. Milestone 1 has started with the root wiring and the three gateways. Status WIP.
Remaining: milestones 1 to 6.

(2026-11-16 14:58:35)
The design is final: the review's rulings are in the architecture, the level format and
the build plan. The root wiring and the three gateways are built and pass the root
gates; their independent review is still open. The owner moved the operation into this
repository and now commits here; the handoff note at the repository root tells the next
team lead how to continue. Remaining: the gateway review, then subtasks 1.5 and 1.6,
then milestones 2 to 6.

(2026-11-16 16:19:16)
Milestone 1 is built and reviewed: the root wiring, the three gateways, `level-format`
and `level-glb`. An acceptance review found TASK-001.01 complete, and the root gates pass
on Windows with a test recipe of 0.72 s. The level format document now states the
readings the two format components settled, such as the path spelling and the index base.
The handoff note is consumed and removed from the repository root. Status stays WIP.
Remaining: the owner's QA of TASK-001.01, then milestones 2 to 6.

(2026-11-16 16:28:23)
The owner's QA of TASK-001.01 passed on Windows and on macOS, and the owner approved
marking it DONE. The linking is now proved on both hosts. Status stays WIP. Remaining:
milestones 2 to 6, starting with TASK-001.02.

(2026-11-16 18:26:00)
Milestone 2 is built and reviewed: `slab-model`, `prop-kit` with the six box kinds, and
`snapshot-render`. An acceptance review found TASK-001.02 complete, and the root gates
pass on Windows with a test recipe of 0.82 s. Status stays WIP. Remaining: the owner's QA
of TASK-001.02, then milestones 3 to 6.

(2026-11-16 18:45:33)
The owner approved in writing marking TASK-001.02 DONE. Status stays WIP. Remaining:
milestones 3 to 6, starting with TASK-001.03.

(2026-11-16 22:14:46)
Milestone 3 is built and reviewed: `level-rules`, `level-pipeline`, `level-cli` with its
four recipes, and the seed description of the sealed hall with thirteen seals. An
acceptance review found TASK-001.03 complete, and the root gates pass on Windows with a
test recipe of 8.2 s. Status stays WIP. Remaining: the owner's QA of TASK-001.03, then
milestones 4 to 6.

(2026-11-16 22:22:05)
The owner's QA of TASK-001.03 passed, and the owner approved in writing marking it DONE.
Status stays WIP. Remaining: milestones 4 to 6, starting with TASK-001.04.

(2026-11-17 13:47:35)
Milestone 4 is built and reviewed: the QA app (`level-view`, `qa-client` and `qa-server`
behind the QA recipe) and the robot arm, the bridge crane and the jib crane in
`prop-kit`. An acceptance review found TASK-001.04 complete, and the root gates pass on
Windows with a test recipe of 8.5 s. Status stays WIP. Remaining: the owner's QA of
TASK-001.04, then milestones 5 and 6.

(2026-11-17 14:48:36)
The owner's QA of TASK-001.04 passed, and the owner approved in writing marking it DONE.
Status stays WIP. Remaining: milestones 5 and 6, starting with TASK-001.05.

(2026-11-17 19:18:10)
Milestone 5 is built and reviewed: the authoring guide and the first art pass in the
committed description, with 127 props and 608 slabs inside the first-pass budget. The
owner approved one component change on the way: the QA page starts facing as the game
does. An acceptance review found TASK-001.05 complete, and the root gates pass on Windows
with a test recipe of 8.3 s. Status stays WIP. Remaining: the owner's QA of TASK-001.05,
then milestone 6.

(2026-11-17 19:46:54)
The owner's QA of TASK-001.05 passed: the mood aligns with the art direction, and the
owner approved in writing marking it DONE. The owner ruled that the look development of
the dressed objects is part of the delivery and that TASK-001 is not complete until it
completes; the decisions above now say so, and TASK-001.07 holds the work. Status stays
WIP. Remaining: TASK-001.07 and TASK-001.06.
