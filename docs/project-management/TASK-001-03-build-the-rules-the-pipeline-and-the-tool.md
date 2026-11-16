# TASK-001.03: build the rules, the pipeline and the tool until the sealed hall builds

Part of TASK-001. This subtask is milestone 3 of the build plan: the validator's rules,
the one build pipeline, the command-line tool with its recipes, and the seed description
of the sealed, empty hall.

## Outcome

- `level-rules` holds every validator check of the format document as a pure function
  over a built level, including the destructibility proof for every slab.
- `level-pipeline` builds a level from a description and validates it into a report.
- `level-cli` offers the commands of the architecture, each behind a root recipe.
- `levels/dark-factory.json` describes the sealed hall with no props. It builds, the
  validator accepts it, and the snapshot sheets show every seal in place.
- The root gates pass, and the test recipe's wall time is recorded.

## Task genesis

Components: `packages/level-rules`, `tools/level-pipeline`, `tools/level-cli`, the
`levels` directory, and the root recipes the integrator owns.

Read first:

- `TASK-001-deliver-the-dark-factory-level.md`, for the brief, the owner's decisions and
  the rules.
- In `docs/researches/2026-11-16-level-designer-foundation/`: `architecture.md` (data
  flow, the three component sections, "Command-line tools and recipes" and the test
  strategy), `level-format.md` (the validator checks and their messages) and
  `build-plan.md` (working rules and subtasks 3.1 to 3.6).
- `research-sec111-level-contract.md` in the same directory, for the hall in numbers,
  the openings to seal and the placement constraints.

Rules:

- The build plan's subtask is the specification. A reviewer checks the work against it
  and the format document line by line, and probes each rule at its limit.
- sec-111 owns its preparation rules: the validator judges the outcome of a preparation
  and copies none of its numbers.
- The owner's checks are exact: at most 300,000 triangles, every light inside the
  interior and above the floor, no object without a material, and no new image while the
  first pass builds no texture.
- `level-pipeline` is the only test home that prepares a level, and its tests share
  preparations as the plan says.
- Commands write only under the work directory the recipe passes.

## Status update

(2026-11-16 14:44:10)
Planned. It starts when milestone 2 is green.

(2026-11-16 17:09:57)
Still planned. The kind design of milestone 2 leaves four facts for this task. A tall
hollow prop has a ring for a standing footprint, because a roof at 2.17 m or higher is
no standing slab; the lane rule must block every cell a wall touches. An enclosure's
long sides stand inside its roof edge by the eave, so `gap` measures twice the eave more
than the typed widths suggest. The proof must cover the thin glow slabs. The knowledge
document of `prop-kit` holds these dimensions. The pipeline rounds slabs with the
rounding that `level-format` owns.

(2026-11-16 18:48:05)
Milestone 2 is DONE and committed, so this task starts; change status to WIP. The
integrator creates the three package skeletons while an architect reconciles the design
documents with the built components and the four facts above. Remaining: subtasks 3.1 to
3.6 with their reviews, the acceptance review and the owner's QA.

(2026-11-16 22:14:46)
Subtasks 3.1 to 3.6 are built, and each passed its own independent review. `level-rules`
holds the eighteen validator rules and the destructibility proof. `level-pipeline` builds
a level from a description and validates it into a report. `level-cli` offers `kinds`,
`validate`, `build` and `snapshot`, each behind a root recipe. The seed
`levels/dark-factory.json` holds no props and thirteen seals: the plan's seven, two above
the side walls and four behind the open piers of the +X wall, because the reviews found
the hall open there. It builds, the validator accepts it, and the sheets show no
background inside the hall. The `gap` rule fails a pair only where a free lane lies
between the two, so touching rows pass. The owner approved the seal count and this form
of `gap` with its stated limits. `level-format` gained the length slack, the point-light
cap and the one length formatter that the new components read. An acceptance review
found every outcome and rule met. The root gates pass on Windows. The test recipe takes
8.2 s for 419 tests, against 0.82 s for 335 tests before this milestone; the three level
preparations account for the difference. Status stays WIP. Remaining: the owner's QA on
Windows and on macOS, then the owner's written approval to mark the task DONE.

(2026-11-16 22:22:05)
The owner's QA passed. The owner also opened the built level in a glTF viewer and
confirmed that every opening of the hall is sealed. The owner approved in writing marking
this task DONE. Mark this task DONE. No work remains.
