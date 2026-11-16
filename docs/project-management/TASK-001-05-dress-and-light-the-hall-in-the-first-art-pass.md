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
