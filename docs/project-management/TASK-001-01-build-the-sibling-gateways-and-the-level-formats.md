# TASK-001.01: build the sibling gateways and the level formats

Part of TASK-001. This subtask is milestone 1 of the build plan: the root wiring that
links the three sibling repositories, the three gateway components, and the two format
components every later milestone builds on.

## Outcome

- The workspace links sec-111, destruction lib and the rendering-poc library through
  `sec111-gateway`, `destruction-gateway` and `render-gateway`, and nothing else reaches a
  sibling.
- `level-format` admits a level description and encodes and decodes the level `.json`.
- `level-glb` reads the base stage, assembles the static scene and the level scene,
  writes GLB bytes and inspects a GLB.
- The root gates pass, and the test recipe's wall time is recorded.

## Task genesis

Components: `packages/sec111-gateway`, `packages/destruction-gateway`,
`packages/render-gateway`, `packages/level-format`, `packages/level-glb`, and the root
files the integrator owns.

Read first:

- `TASK-001-deliver-the-dark-factory-level.md`, for the brief, the owner's decisions and
  the rules.
- In `docs/researches/2026-11-16-level-designer-foundation/`: `architecture.md` (the
  component sections and the test strategy), `level-format.md` (the shapes these
  components own) and `build-plan.md` (working rules and subtasks 1.1 to 1.6, which give
  each component's scope and automated checks).
- The component's own `CLAUDE.md`, `README.md` and `docs/KNOWLEDGE.md` once its skeleton
  exists.

Rules:

- The build plan's subtask is the specification. A reviewer checks the work against it
  and the format document line by line.
- A gateway is a bridge: re-exports, readers of sibling files, the copied game values and
  their guards. It holds no other logic.
- `level-format` and `level-glb` depend on no workspace package in their sources.
- Gateway tests do not prepare a level; they use sec-111's committed prepared level.
- Each engineer writes the component's README and knowledge document from what was
  built, and keeps the knowledge tree one-way.

## Status update

(2026-11-16 14:44:10)
The linking mechanism for each sibling is proved through the real gates. The integrator
is applying the root wiring and building the three gateways; the two format components
start when the skeletons pass the gates. Status WIP. Remaining: subtasks 1.1 to 1.6 and
their reviews.

(2026-11-16 14:58:35)
Subtasks 1.1 to 1.4 are built: the root wiring and the three gateways, with their drift
guards. The root gates pass and the test recipe takes under one second. `level-format`
and `level-glb` are skeletons. Remaining: the independent review of 1.1 to 1.4, then
subtasks 1.5 and 1.6 with their reviews. One knip suppression for `level-glb` goes when
its real-stage test lands.

(2026-11-16 16:19:16)
Subtasks 1.1 to 1.6 are built, and each passed its own independent review. The gateway
review added the setup check that names a sibling without an install. `level-format`
admits a description, encodes and decodes the level `.json`, and reads a slab as an
oriented box. `level-glb` assembles the static scene and the level scene, inspects a GLB
and returns world triangles; its real-stage test landed and the knip suppression is gone.
An acceptance review found every outcome and rule of this task met. The root gates pass
on Windows, and the test recipe takes 0.72 s for 149 tests. Status stays WIP. Remaining:
the owner's QA, which runs the three root gates on Windows and on macOS, then the owner's
written approval to mark the task DONE.

(2026-11-16 16:28:23)
The owner ran QA on Windows and on macOS, and the three root gates pass on both machines.
The knowledge documents are curated to the current state. No work remains in this task;
milestone 2 continues in TASK-001.02. Mark this task DONE with the owner's written
approval.
