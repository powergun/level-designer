# Handoff: TASK-001, the dark factory level, after milestone 3

For the next team lead. Written on 2026-11-16, after TASK-001.03 was marked DONE.

## 1. The big picture

The level designer builds the level pair of sec-111's "dark factory": a `.glb` with the
sealed, dressed hall and a `.json` with the destructible props and the lighting. TASK-001
delivers it in six subtasks, one per milestone of the build plan. The design in
`docs/researches/2026-11-16-level-designer-foundation/` is the technical source of truth.

Progress, all committed on `dev`:

- TASK-001.01 DONE: the three sibling gateways, `level-format` and `level-glb`.
- TASK-001.02 DONE: `slab-model`, `prop-kit` with six box kinds, and `snapshot-render`.
- TASK-001.03 DONE: `level-rules` (eighteen validator rules and the destructibility
  proof), `level-pipeline` (the build and the report) and `level-cli` behind `just kinds`,
  `just validate`, `just build` and `just snapshot`.
- The seed `levels/dark-factory.json` describes the sealed hall: thirteen seals, no
  props. The validator accepts it, and the owner confirmed in a glTF viewer that every
  opening is closed.
- Gates at this hand-over, on Windows: `just test` passes 419 tests in 8.2 s, and
  `just lint` is clean.

The next action is TASK-001.04, status PLAN: build the QA app, milestone 4.

1. Mark TASK-001.04 WIP with the project management skill.
2. Before any code, have an architect reconcile the design documents with the built
   components and with the five facts in the task document's status update.
3. Run subtask 4.1 (the skeleton), then 4.2 `level-view` and 4.3 the three new prop kinds
   in parallel, then 4.4 `qa-client` (its protocol unit first), 4.5 `qa-server`, 4.6 the
   recipe and documents, and 4.7 the silent-failure audit.
4. Run the acceptance review, then hand the app to the owner, who launches it.

TASK-001.05 (the art pass) and TASK-001.06 (the hand-off) follow.

## 2. The knowledge

Run the `catchup` command first; it reads the root and component documents. Then read:

- `docs/project-management/TASK-001-deliver-the-dark-factory-level.md`: the owner's
  brief, decisions and rules.
- `docs/project-management/TASK-001-04-build-the-qa-app.md`: the outcome, the rules and
  the five facts the kind design left for the arm and the cranes.
- `architecture.md`: "The QA app" in full, "Collision the game owns", the component
  sections and the test strategy.
- `level-format.md`: the lighting section with its mapping rules, and the kinds.
- `build-plan.md`: the working rules and subtasks 4.1 to 4.7.
- `research-rendering-lighting.md`: the renderer's contract.
- The three retros in `../skin-designer/docs/retros/`. The one on the web editor's
  silent QA failure sets rules for this app.
- `docs/notes/team-brief.md`: the rules every subagent receives with its assignment.
- `docs/notes/gap-disc-rule-candidate.md`: a stronger `gap` rule, kept for the art pass.

No separate research is needed: the three research reports beside the design hold the
evidence.

## 3. The context

The owner's standing workflow for a lead:

- Stay lean: keep your context for the owner, coordination and decisions. Delegate.
- Opus 5.5 subagents write and review code. Fable 5.2 subagents do architecture and
  level design. Launch each at the highest reasoning effort.
- Every subagent reads the root `CLAUDE.md`. Give each one the team brief, the scratch
  directory and the gate lock directory, both outside the repository.
- Each subtask has one developer and one separate reviewer. The reviewer probes the
  limits with its own samples; findings go back to the developer, and the same reviewer
  reviews again.
- After the last subtask, a fresh reviewer runs the acceptance review against the task
  document. No deferrals and no extras: the task document is the only authority.
- Then the owner runs QA. For this app the human alone launches the server and the
  browser; agents never do.
- Report to the owner regularly, status apart from questions. Decide from the documents
  and say what you decided. Raise only the owner's decisions; the owner answers no
  diagnostic question.

Conventions that held in milestone 3:

- The integrator owns the root files and every dependency list. An engineer owns one
  component. The architect owns the three design documents and amends them in place.
- Reports go to files in the scratch directory; a reply is a path and one line. Route
  messages between members through the lead.
- One root gate runs at a time under the gate lock: `just setup` after a manifest
  change, then `just test`, then `just lint`. Rerun both yourself before a hand-over.
- Load the project management skill before touching a task document. The owner commits;
  commit only when the owner says so in that turn, and never push.
- Agents see a level through the `just snapshot` sheets; `just validate` prints the
  report.

## 4. Lessons, failure modes and gotchas

Process:

- Messages cross. A member reads its inbox between tool rounds, so a stop order can
  arrive after the work. Freeze a specification before an engineer starts on it.
- The architect tends to grow a ruling. Ask for the smallest sound amendment, decide,
  and hold the decision.
- Reviews at the limits found what samples missed: a `gap` rule that failed touching
  rows, and openings above the walls and behind the piers that took the seals from
  seven to thirteen. A claim is only as good as the probe points behind it.
- Copies keep appearing. Five facts had to move to their owner: the length slack, the
  point-light cap, the length formatter, the hang height and the spawn names. Expect the
  same in the QA app; its game values belong in `sec111-gateway` under the drift test.
- The safety check on agent launches can fail for a while. Retry once, then do the
  reading yourself.

Repository:

- The three design documents stand at 498, 498 and 493 lines of 499. Free lines before
  amending. The docs lint also caps a list at ten items and about 200 words, and a
  paragraph at six links.
- An empty package cannot pass the gates: an empty facade fails oxlint, and unused
  dependencies fail knip. The integrator ships a manifest-only skeleton and adds the
  exports and dependencies when the engineer starts.
- Install only through `just setup`. A bare `bun install` hard-links the rendering
  library copy to its sibling and fails the `render-gateway` drift test.
- The synopsis tool skips a unit directory named `build`.
- The test recipe takes 8.2 s; 30 s is the blocker line. Only `level-pipeline` prepares a
  level, three times in all. Other tests use sec-111's committed prepared level.

Carried forward:

- For 4.3: `gap` measures crossings between footprint parts. With the six box kinds the
  extra crossings inside one prop exceed 1.5 m; check that again for the arm and cranes.
- For 4.5: the built level's `hash` and prepared files wait for `qa-server` as their
  consumer. The hash of a blocked build is unspecified; the architect settles it first.
- For the art pass: `gap` judges no wedge between touching props and can report one gap
  once per flush wall box. A prop flush to a wall can draw a finding; 1.5 m off always
  passes. The lane width over-reads an odd cell count by 0.1 m.
- Accepted looks of the seed: eight thin dark strips high on the +X wall, and a dark
  streak along the wall top from the +x+z spawn. The game's renderer has not shown them
  yet.
- The tool exits 1 with Bun's stack on a defect or a broken sibling install, and
  `just snapshot` without a custom view leaves an older `custom.png` in place.
