# HANDOFF: TASK-001.07, look-dev the dark factory with procedural materials

For the next team lead, written on 2026-11-18. This note is an index: read what it names.

## 1. The big picture

TASK-001 delivers a "dark factory" level pair for the game sec-111. TASK-001.07 gives the
level procedural materials, called finishes, in seven milestones, each ending in the owner's
test. TASK-001 is not complete until it completes. TASK-001.06, the hand-off, runs after it.

Where the task stands:

- Milestones 1 to 4 are done, and the owner's QA passed each: the art is aligned and the
  frame rate did not drop. Every prop, both floors and the side walls carry painted finishes.
- Milestone 1: the painter and the housings. Milestone 2: four more layer kinds, the finish
  pages, the containers and the cranes. Milestone 3: hall finishes through the stage wrap.
  Milestone 4: the seven other prop finishes, art only.
- The level holds 127 props in their passed places, 616 slabs and 133,889 triangles. The
  view compiles 38 prop programs and the hall's wraps. A snapshot takes about 34 s.
- The tree is clean on `dev`, and both root gates pass: 978 tests in about 8 s. The commit
  whose message names "milestone 5" holds milestone 4.

Your next steps:

1. Milestone 5, additions to the level: it adds a prop only where the owner asked for one,
   and the owner has named none. Its sure part is the floor lines around both assembly
   lines and at the yard's slots. Report the art study's two offers and take the owner's word.
2. Milestone 6, seals and static objects: the largest build left, five components and a brief.
3. Milestone 7, legends and the hand-off. Then the owner's QA of the whole look.

## 2. The knowledge

Read in this order:

1. [CLAUDE.md](CLAUDE.md) and the files it names, [README.md](README.md),
   [the project knowledge](docs/KNOWLEDGE.md),
   [the authoring guide](docs/AUTHORING-GUIDE.md) and
   [look and lighting](docs/LOOK-AND-LIGHTING.md).
2. The task documents: [TASK-001](docs/project-management/TASK-001-deliver-the-dark-factory-level.md)
   for the brief and every owner's decision, and
   [TASK-001.07](docs/project-management/TASK-001-07-look-dev-the-dark-factory-with-procedural-materials.md)
   for the requirement, the rules and each milestone's status.
3. The design, in `docs/researches/2026-11-17-dark-factory-look-dev/`, kept in line with
   what was built: [design](docs/researches/2026-11-17-dark-factory-look-dev/design.md),
   [painter cost](docs/researches/2026-11-17-dark-factory-look-dev/painter-cost.md),
   [finish format](docs/researches/2026-11-17-dark-factory-look-dev/finish-format.md),
   [non-destructible objects](docs/researches/2026-11-17-dark-factory-look-dev/non-destructible-objects.md),
   [build plan](docs/researches/2026-11-17-dark-factory-look-dev/build-plan.md) and
   [its milestones 4 to 7](docs/researches/2026-11-17-dark-factory-look-dev/build-plan-milestones-4-7.md).
4. The art notes: [the painter briefs](docs/notes/look-dev-painter-briefs.md),
   [the painter recipes](docs/notes/look-dev-painter-recipes.md) and
   [the hall's brief](docs/notes/look-dev-hall-brief.md).
5. The standing briefs: [team](docs/notes/team-brief.md),
   [engineer](docs/notes/engineer-brief.md) and [reviewer](docs/notes/reviewer-brief.md).
6. The knowledge documents of the components you assign.
7. The three retros in `../skin-designer/docs/retros/`.

No further research is needed. The sibling repositories are read-only.

## 3. The context

The workflow that the owner approved and four milestones followed:

- The lead stays lean: it coordinates, rules and reports. Opus 5.5 agents do code and
  reviews; Fable 5.2 agents do art and architecture; all at the highest effort. Every
  subagent reads the root `CLAUDE.md` and the team brief first.
- A subtask: the engineer writes a plan and stops; the lead reads it, rules on its open
  readings and says "go"; the engineer builds in the tree and writes an outcome; a separate
  reviewer reports; the engineer fixes; the same reviewer checks the fixes.
- The lead runs both root gates itself at each landing point, under the gate lock. Engineers
  prove their package with the per-package commands and every lint step by hand.
- The art author plans with a draft of the recipes, takes the lead's rulings, types into the
  draft description, validates, reads the finish pages and then copies the draft over the
  committed level. One integrator brings the root and design documents in line afterwards.
- Per session the lead names two directories outside the repository: a scratch directory
  for plans, outcomes, reviews and state files, and the gate lock directory.
- After a milestone's test the owner commits the tree and tells the lead to mark it done.
  The lead writes the status update with the project-management-duty skill and commits only
  that file, only when the owner says so in that turn. Never push.
- Report status apart from questions, and what changed for the owner, not every round.

The tools:

```sh
just setup      # after a clone or a manifest change; the only way to install
just test       # root gate
just lint       # root gate; a document change needs it too
just validate --description levels/dark-factory.draft.json
just snapshot --description levels/dark-factory.draft.json   # sheets and finish pages
just qa         # the owner's alone
```

A milestone's hand-over tells the owner: what to run, what to judge and where, the file that
explains a failure, what was computed and never seen, every visible change the owner did not
ask for by name, and the cures held ready, each as one value of the description.

## 4. Lessons, failure modes and gotchas

The owner's directions, given during these milestones:

- The task is additive; do not overcomplicate. No passed prop moves, and the lights stay.
- The art review is light and quick: one pass on rules only. The owner does the real art
  review in the human test.
- No overcomplication in the acceptance review: one short pass by a fresh reviewer, in one
  phase, with findings only for what breaks the requirements, the gates or the owner's test.
- The art comes first. Nothing measures cost; the owner reads the frame rate.

Lessons that held:

- Decide for the reader first. An agent's image reader scales a PNG down to about 1,568 px,
  so the finish sheet became one page per finish path, and the floor's page two halves.
- A recipe draws once per slab. A slab that splits at the 25 m2 cap, a girder web or a long
  container side, shows its end marks again at the joint. Plan marks for the split faces.
- A hall finish draws on every surface of its stage material, pipes and tanks included, by
  the surface's own normal. The art author measures the built level before it places a line.
- Conservative rulings passed every test: leave passed objects untouched, drop a mark no
  reference shows, choose paint over bare metal. The owner accepted each rise in value.
- Avoid a red tree: land a tolerant step first, or announce a short window and land in order.

Failure modes of this session:

- Crossed messages. An agent reads one message a turn, so its reply may answer the message
  before. Send one message per phase and check the file in the tree, not the report.
- Line endings. Edit scripts wrote CRLF; the read-only check is `git ls-files --eol -m -o
  --exclude-standard`. Two agents tried `git add` for it; the permission mode blocked them.
- A stale hand-over. Count the files to commit from `git status` at the very end.
- Depth beyond the ask. The lead ran a deep art review until the owner cut it short.

Gotchas:

- The lint fails a file at 500 lines: the recipes note stands at 489 and the finish format at
  488. A list holds ten items and about 200 words, and prose may not hold a `just` command.
- Each painted path is one more program at the view's start. Handles, if the owner finds the
  start slow: the strips' joints, the stacks' posts, the crates' stencil role, the arm's head.
- Legends are not built: no `glyphs` kind, and every slab's number is 0 until milestone 7.
  The girders and the containers carry blank plates and discs that wait for them.
- The recipes note still writes a one-sided `border` on `corrugated/shutter`, for milestone
  6. The format wants every side above zero; a rectangle under `across: ends` draws the same.
- Unproven still: the damaged look, which waits for adoption; and whether legends read.
