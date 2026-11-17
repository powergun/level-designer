# HANDOFF: TASK-001.07, look-dev the dark factory with procedural materials

For the next team lead, written on 2026-11-18. This note is an index: read what it names.

## 1. The big picture

TASK-001 delivers a "dark factory" level pair for the game sec-111. Subtasks 01 to 05
are DONE: the tools, the QA app and the first art pass, whose layout and lighting the
owner passed. TASK-001.07 is WIP: the look development, which gives the level procedural
materials so that it closely resembles the real dark factories of the reference images.
TASK-001 is not complete until it completes. TASK-001.06, the hand-off, runs after it.

Where the task stands:

- The studies are done, as two research reports.
- The design is written. The owner approved it on 2026-11-18 and annotated it; the notes
  are marked "Human note" in the design and the build plan.
- No development has started and no source exists. `packages/finish-paint` is an empty
  skeleton; its `exports` field, the dependency of `level-view` on it and its bundle
  entry wait for the first source, because each fails the gates without it.
- The tree holds uncommitted documents and this note. The owner commits.

Your first three steps:

1. Fold the owner's annotations into the design; section 4 lists them.
2. Run one adversarial review of the design. It has had none since the cost proof was
   cut and the annotations arrived.
3. Build milestone 1 of the build plan, then pause for the owner's test.

## 2. The knowledge

Read in this order:

1. [CLAUDE.md](CLAUDE.md) and the files it names, [README.md](README.md),
   [the project knowledge](docs/KNOWLEDGE.md) and
   [the authoring guide](docs/AUTHORING-GUIDE.md), with "Look and lighting" in full.
2. The task documents: [TASK-001](docs/project-management/TASK-001-deliver-the-dark-factory-level.md)
   for the brief and every owner's decision, and
   [TASK-001.07](docs/project-management/TASK-001-07-look-dev-the-dark-factory-with-procedural-materials.md)
   for the requirement in the owner's words and the rules.
3. The design, in `docs/researches/2026-11-17-dark-factory-look-dev/`:
   [design](docs/researches/2026-11-17-dark-factory-look-dev/design.md),
   [finish format](docs/researches/2026-11-17-dark-factory-look-dev/finish-format.md) and
   [build plan](docs/researches/2026-11-17-dark-factory-look-dev/build-plan.md).
4. Its evidence, in the same directory: `research-destruction-look-dev.md` for the
   method and `research-dark-factory-surfaces.md` for the surfaces.
5. The art input: [the painter briefs](docs/notes/look-dev-painter-briefs.md), the
   eleven finishes ranked and written as recipes.
6. The foundation, in `docs/researches/2026-11-16-level-designer-foundation/`:
   `architecture.md`, `level-format.md` and the working rules of `build-plan.md`.
7. The three retros in `../skin-designer/docs/retros/`.

No further research is needed. The sibling `../destruction-poc` and its demo, "Wall
Lab", are read-only; only its walls, pillars and spheres are references.

## 3. The context

How the owner wants the task led:

- The lead stays lean: it coordinates, decides and reports, and delegates the rest.
  Fable 5.2 agents do design, architecture and art; Opus 5.5 agents do code and reviews;
  all at the highest effort. Every subagent reads the root `CLAUDE.md` first.
- A subtask has one engineer and one separate reviewer. An engineer plans first and
  builds on "go". Reports go to files in a scratch directory outside the repository; a
  reply is a path and one line.
- The integrator owns the root files and every dependency list. Root gates run one at a
  time under a gate lock, a directory outside the repository that you name.
- Give regular status updates, with status and questions apart. Raise a question that
  needs the owner promptly; decide the rest and report it as a decision.
- A fresh reviewer does an acceptance review when a milestone is built. Then pause: the
  owner tests every milestone on a Windows desktop and a MacBook Pro M1.
- The owner commits. Commit only when the owner says so in that turn, and never push.
- No agent launches the QA server, a browser or a headless browser.
- Use the project-management-duty skill before you touch a task document.

The tools:

```sh
just setup      # after a clone or a manifest change; the only way to install
just test       # root gate
just lint       # root gate; a document change needs it too
just kinds      # the prop kinds and their parameters
just validate --description levels/dark-factory.json
just snapshot --description levels/dark-factory.json
just qa         # the owner's alone
```

Reviewers and probes call the tool with their own work directory, so they never write
where the art author works:
`mise exec -- bun tools/level-cli/main.ts <command> --workdir <dir>`.

## 4. Lessons, failure modes and gotchas

The owner's annotations that the design does not hold yet:

- Static, indestructible objects are allowed, for mood and to fill gaps, clearly apart
  from the dressed destructible objects, which are for gameplay. The format has no
  place for them, and "no new prop kinds" predates this note.
- Non-destructible objects get the same look development, with more interesting and
  detailed materials: the hall's own surfaces, the seals and any static object. The
  design paints only props, seals and floor lines.
- Every datum added to the `.glb` is justified; "small" sets no hard limit.
- The art comes first, on a good-enough technical direction. Performance tuning is a
  separate task; write no code that is obviously slow.
- The team pauses at the end of each milestone for the owner's test.

Decisions that stand:

- A material is a shader. A finish is a recipe in the level description; each layer
  kind is a shader template, instantiated with the recipe's numbers when the level
  loads, into one shared static material per finish.
- Agents get finish sheets in their smallest form. A recipe has three plain caps: 24
  layers, 2 noise layers and 3 legends.
- The owner reads the frame rate on the QA page; nothing is built to measure cost.
- At adoption sec-111 takes a copy of the generic painter files.
- A console error raises one banner on the page in every run, so a failed painter never
  leaves props missing silently.
- Props rise in value so a finish shows; the lights stay as the owner passed them.
- Floor lines, finished seals, crane girders of 1.25 m, painted block walls for the two
  brick fences; no car bodies; sixteen arms.

Failure modes of this session:

- Tooling built for its own sake. The architects designed a self-running cost proof; the
  owner rejected it three times. Make every part name its consumer, and take the
  simplest design.
- Missing delivery presented as optional. The owner expected the look development as
  part of TASK-001; compare the plan with the brief's end result early.
- Crossed messages. A subagent takes its messages one turn at a time, so a "stop" waits
  behind its current turn and reports describe states that are already replaced. Check
  the files, not the report, and keep one writer per document.
- Full contexts. A long-running agent can end without warning. Have each keep a short
  state file, and replace it through files. No agent of this session carries over.
- Computed is not seen. The first lighting values gave black floors; only a probe that
  traced shadows and highlights found it. Say what is computed and what is seen.

Gotchas:

- The lint fails a file at 500 lines: `architecture.md` stands at 499 and the surfaces
  report at 495. Lists hold at most ten items and about 200 words. Text is ASCII only.
  An inline citation of a non-standard recipe fails; put commands in an `sh` block.
- Write documents with the Edit and Write tools, never with a script.
- The painter briefs' keys predate the last renaming in the finish format.
- Earlier engineers' plans aimed at the cancelled proof; brief new engineers from the
  build plan.
- Unproven until the owner's GPU shows it: that the shaders compile, how long about 45
  programs take at the start, the frame rate with a prop filling the frame on the M1,
  and whether the brighter props keep the mood.
