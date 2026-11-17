# TASK-001.05: dress and light the hall in the first art pass

Part of TASK-001. This subtask is milestone 5 of the build plan: the first dressing and
lighting of the sealed hall, written into the level description and judged by agents
from snapshot sheets before the owner sees it.

## Outcome

- An authoring guide gives the art team the hall in numbers, the placement rules in
  plain words, the budgets and the accepted limits.
- `levels/dark-factory.json` holds the first pass: storage and cover, two assembly lines
  with robot arms, cranes under the ceiling, light strips, and the look and lighting of
  the dark factory.
- The validator accepts the committed description, inside the first-pass budgets.
- A reviewer has checked the sheets against the references.

## Task genesis

Files: `levels/dark-factory.json` and the authoring guide. No component source changes
in this subtask; a missing capability goes back to the lead.

Read first:

- `TASK-001-deliver-the-dark-factory-level.md`, for the brief, the owner's decisions and
  the rules.
- In `docs/researches/2026-11-16-level-designer-foundation/`: `build-plan.md` (subtasks
  5.1 to 5.5 and "The art pass"), `level-format.md` (the description, the prop kinds and
  the validator's messages), and `research-sec111-level-contract.md` (the hall in
  numbers).
- Every image in `docs/art-direction/references/layout` and
  `docs/art-direction/references/mood`. The layout images show bridge cranes on runway
  beams, jib cranes on columns and stock on an open floor. The mood images show long
  assembly lines with robot arms in near-black ambient with cyan strip lights.

Rules:

- The author edits a scratch copy of the description and replaces the committed file
  only when the validator accepts.
- The loop is: edit the description, validate, read the findings, snapshot, read every
  sheet, edit again.
- Every dressed object is destructible, and nothing static is added. The six old walls
  are gone; props supply all cover.
- Spawn areas and main lanes stay open; the validator's clearance rules say how wide.
- An agent judges layout, spacing, scale and silhouette from the sheets. No agent
  judges mood, shadow, haze or glow; the owner does, in the browser.
- The reviewer reruns the validator and places its own probe props at the rule limits
  on a scratch copy.

## Status update

(2026-11-16 14:44:10)
Planned. The authoring guide starts when the seed description of milestone 3 builds;
the dressing passes follow.

(2026-11-17 14:54:53)
Milestone 4 passed the owner's QA and the owner started this subtask. Status WIP. The
integrator writes the authoring guide while the art author studies the references and
drafts the layout concept. Remaining: subtasks 5.1 to 5.5, the acceptance review and the
owner's QA.

(2026-11-17 16:14:56)
Subtask 5.1 is done: the authoring guide passed its review, and its measurements corrected
three hall numbers in the research report. Pass 5.2, storage and cover, is in the
committed description and passed its art review. The owner approved one component change
inside this subtask: the QA page now starts facing as the game does, toward the back
wall; it is built and reviewed. The owner also ruled that the storage yard stays the
opening view, with lighting to carry it. Remaining: passes 5.3 to 5.5, the acceptance
review and the owner's QA.

(2026-11-17 19:09:02)
Passes 5.3 to 5.5 are in the committed description and passed their art reviews: two
assembly lines, four bridge cranes, six jib cranes, the light strips, and the look and
lighting. The validator accepts 127 props and 608 slabs with no finding; the root gates
pass with a test recipe of 8.3 s. The owner saw the work in progress and asked for dimmer
light tubes; pass 5.5 answers it with every glow under the renderer's bloom threshold.
Pass 5.5 departs from the build plan's wording in two places. The environment is high,
not low: a panel layer of the truss mesh shadows the vertical key on nine tenths of the
floor, so the environment lights the hall. Four point lights hang above their strips, to
stay clear of glints. No agent has seen the lighting; its values are computed from the
renderer's source. Status stays WIP. Remaining: the acceptance re-review and the owner's
QA.

(2026-11-17 19:18:10)
An acceptance review found the task complete: every outcome and rule holds on the tree,
and every review finding traces to its fix. The authoring guide now also holds what the
lighting pass learned: how the hall is lit, the measured brightness of its surfaces, the
bloom threshold and the tuning handles. The root gates pass on Windows: 582 tests, a test
recipe of 8.3 s and a clean lint. No agent launched the server or a browser, so the first
look at the lighting and at the new start facing is the owner's. Status stays WIP.
Remaining: the owner's QA on Windows and on macOS, then the owner's approval.

(2026-11-17 19:46:54)
The owner's QA passed: the mood aligns with the art direction. The owner approved in
writing marking this subtask DONE. The owner also found that the dressed objects carry no
procedural materials; that look development is part of the delivery and is TASK-001.07.
Status DONE. Remaining: none.
