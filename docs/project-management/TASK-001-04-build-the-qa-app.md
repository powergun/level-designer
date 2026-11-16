# TASK-001.04: build the QA app

Part of TASK-001. This subtask is milestone 4 of the build plan: the walk-through QA app
for the human, and the prop kinds the assembly lines and cranes need.

## Outcome

- `level-view` draws a level pair through the rendering-poc pipeline with the game's
  look and the level's lighting.
- `qa-client` is the page: walk in the game's collision, fly freely, and record a mark
  with a typed comment on F3.
- `qa-server` is the loopback server: it builds the committed description, serves the
  page and the level, appends marks to a log under the scratch directory, and writes one
  log per run.
- `prop-kit` gains the robot arm, the bridge crane and the jib crane.
- The silent-failure audit is closed: every way a step can fail or stall has a visible
  message, a log line and a test.
- The root gates pass, and the test recipe's wall time is recorded.

## Task genesis

Components: `packages/level-view`, `packages/qa-client`, `tools/qa-server`,
`packages/prop-kit`, and the root recipe and documents the integrator owns.

Read first:

- `TASK-001-deliver-the-dark-factory-level.md`, for the brief, the owner's decisions and
  the rules.
- In `docs/researches/2026-11-16-level-designer-foundation/`: `architecture.md` ("The QA
  app" in full, "Collision the game owns", the component sections and the test
  strategy), `level-format.md` (the lighting section and its mapping rules) and
  `build-plan.md` (working rules and subtasks 4.1 to 4.7).
- `research-rendering-lighting.md` in the same directory, for the renderer's contract.
- `../skin-designer/docs/retros/2026-11-15-web-editor-qa-failed-silently.md`. Every rule
  the owner set there applies to this app.

Rules:

- The build plan's subtask is the specification. A reviewer checks the work against it
  line by line.
- The human cannot shoot in the QA app, and the app adds no gameplay.
- Agents never launch the server or a browser. Tests start the real page entry on a
  hand-built document and one real server on a temporary port.
- The app never fails silently. Each blocking condition shows a message on the page and
  writes a log line; each file action reports exactly one outcome.
- The game-owned values the app copies live in one module of `sec111-gateway`, under its
  drift test.
- Tests remove every file they create.

## Status update

(2026-11-16 14:44:10)
Planned. It starts when milestone 3 is green.

(2026-11-16 17:09:57)
Still planned. The kind design of milestone 2 leaves five facts for the articulated and
overhead kinds. A pitched arm link needs a facing built from free unit vectors, and
links at an angle need a stated gap or edge contact in the joint rule. A web has two
visible faces, so its kind names the side its +Z face takes, and a bottom flange faces
down. A jib crane's 0.5 m plinth sits on the `low-top` limit, and a hoist under 2.17 m
becomes a standing slab. A bridge crane's `hookDrop` and `railHeight` ranges admit a
hook under 2.17 m or under the floor, so the kind needs a rule across both. The format
document must state the origin of each of the three kinds.
