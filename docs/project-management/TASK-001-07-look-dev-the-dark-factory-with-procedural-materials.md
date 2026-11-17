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
