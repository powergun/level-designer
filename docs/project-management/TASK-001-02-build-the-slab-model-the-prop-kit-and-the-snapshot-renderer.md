# TASK-001.02: build the slab model, the prop kit and the snapshot renderer

Part of TASK-001. This subtask is milestone 2 of the build plan: the component that turns
a slab into a destruction lib object, the kit of prop kinds, and the browser-free
renderer that lets agents see a level.

## Outcome

- `slab-model` builds the destruction lib model of a slab through one shared builder and
  derives its intact mesh.
- `prop-kit` expands the box-shaped prop kinds into slabs: conveyor, enclosure,
  container, crate, partition and light strip.
- `snapshot-render` draws a level GLB into plan, section and perspective PNG sheets
  without a browser or a GPU.
- The root gates pass, and the test recipe's wall time is recorded.

## Task genesis

Components: `packages/slab-model`, `packages/prop-kit`, `tools/snapshot-render`.

Read first:

- `TASK-001-deliver-the-dark-factory-level.md`, for the brief, the owner's decisions and
  the rules.
- In `docs/researches/2026-11-16-level-designer-foundation/`: `architecture.md` (the
  three component sections, "Snapshots" and the test strategy), `level-format.md` (slabs,
  props and their kinds) and `build-plan.md` (working rules and subtasks 2.1 to 2.4).
- `research-destructibles.md` in the same directory, for the slab model's evidence.
- The reference images in `docs/art-direction/references/`: the kinds and the sheets
  serve them.

Rules:

- The build plan's subtask is the specification. A reviewer checks the work against it
  and the format document line by line, and draws its own samples at the parameter
  limits.
- Only `slab-model` constructs a destruction lib model. Only a gateway imports a sibling.
- The kind tables in `prop-kit` own every secondary dimension of a kind. The reviewer
  judges them against the references, and judges each kind for a pocket a player can
  enter and a minion cannot.
- A sheet shows layout, scale and silhouette. It shows no mood, and no test asserts a
  render time.

## Status update

(2026-11-16 14:44:10)
Planned. It starts when milestone 1 is green.

(2026-11-16 16:37:15)
Milestone 1 is DONE and committed, so this task starts; change status to WIP. The
integrator creates the three package skeletons while a designer fixes each box kind's
slab layout and secondary dimensions against the references. Remaining: subtasks 2.1 to
2.4 with their reviews, the acceptance review and the owner's QA.

(2026-11-16 16:40:20)
The owner amended the outcome: `slab-model` derives the intact mesh only. A slab's
corners stay in `level-format`, their one owner since milestone 1.

(2026-11-16 18:26:00)
Subtasks 2.1 to 2.4 are built, and each passed its own independent review. `slab-model`
builds a slab's destruction lib model and its intact mesh. `prop-kit` expands the six box
kinds from a designer's layouts, judged against the references. `snapshot-render` draws
the plan, section and view sheets; a full mutation sweep closed its test gaps.
`level-format` gained the grid rounding, the colour check and the two message rules that
`prop-kit` needs. An acceptance review found every outcome and rule met, and its probe
ran the four components together on the real base stage. The root gates pass on Windows.
The test recipe takes 0.82 s for 335 tests, against 0.72 s for 149 tests before this
milestone. Status stays WIP. Remaining: the owner's QA on Windows and on macOS, then the
owner's written approval to mark the task DONE.
