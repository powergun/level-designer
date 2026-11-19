# HANDOFF: TASK-001.07, look-dev the dark factory with procedural materials

For the next team lead, written on 2026-11-19. This note is an index: read what it names.

## 1. The big picture

TASK-001 delivers a "dark factory" level pair for the game sec-111. TASK-001.07 gives the
level procedural materials, called finishes, in seven milestones, each ending in the owner's
test. TASK-001 is not complete until it completes. TASK-001.06, the hand-off, runs after it.

Where the task stands:

- Milestones 1 to 5 are done, and the owner's QA passed each.
- Milestone 5 grew by the owner's direction into three parts: floor lines around both
  assembly lines and at the yard's slots; static objects, built in five components, as 200
  pieces of litter; and a lighting pass to the owner's mood, a dark factory like Alien's set.
- The lighting as passed: an ambient of 3.3, the owner's own value, no key, and 25 point
  lights of a cap of 32: five at LED strips, three fills, 17 emergency wall lights with lamps.
- The level holds 127 props in their passed places, 616 slabs, 217 static objects, six glows
  and 136,493 triangles. A snapshot draws 45 finish pages.
- The tree is clean on `dev`, and both root gates pass: 1,044 tests in about 9 s.

Your next steps:

1. Milestone 6, seals and overhead objects, as the build plan states it; start it on the
   owner's word. First, side by side: the art author writes the brief (6.1), and four
   engineers plan the seal's paint keys in `level-format`, the painted seal in `level-glb`,
   its body in `level-pipeline` and its page in `level-cli` (6.2 to 6.5). The art follows
   (6.6): cladding with a gate, shutters, and at most 39 more overhead objects.
2. Milestone 7, legends and the hand-off. Then the owner's QA of the whole look.

## 2. The knowledge

Read in this order:

1. [CLAUDE.md](CLAUDE.md) and the files it names, [README.md](README.md),
   [the project knowledge](docs/KNOWLEDGE.md),
   [the authoring guide](docs/AUTHORING-GUIDE.md) and
   [look and lighting](docs/LOOK-AND-LIGHTING.md), which holds the lighting as passed, the
   display's black point and the way to add an emergency wall light.
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
   [the painter recipes](docs/notes/look-dev-painter-recipes.md),
   [the hall's brief](docs/notes/look-dev-hall-brief.md) and
   [the litter's brief](docs/notes/look-dev-litter-brief.md).
5. The standing briefs: [team](docs/notes/team-brief.md),
   [engineer](docs/notes/engineer-brief.md) and [reviewer](docs/notes/reviewer-brief.md).
6. The knowledge documents of the components you assign.
7. Every image in `docs/art-direction/references/`, the two newest in `mood/` above all.
8. The three retros in `../skin-designer/docs/retros/`.

No further research is needed. The sibling repositories are read-only.

## 3. The context

The workflow that the owner approved and five milestones followed:

- The lead stays lean: it coordinates, rules and reports. Opus 5.5 agents do code and
  reviews; Fable 5.2 agents do art and architecture; all at the highest effort. Every
  subagent reads the root `CLAUDE.md` and the team brief first.
- A subtask: the engineer writes a plan and stops; the lead reads it, rules on its open
  readings and says "go"; the engineer builds in the tree and writes an outcome; a separate
  reviewer reports; the engineer fixes; the same reviewer checks the fixes.
- The lead runs both root gates itself at each landing point, under the gate lock. Engineers
  prove their package with the per-package commands and every lint step by hand.
- The art author types into the git-ignored draft and validates it; the lead compares it
  with the level as data and lands it. An integrator then brings the documents in line.
- A lighting change goes in small steps of a few values each: land it, pass the gates and
  hand it to the owner for a quick test. The owner's feedback is the next step.
- Per session the lead names two directories outside the repository: a scratch directory
  for plans, outcomes, reviews and notes, and the gate lock directory.
- The owner commits the tree. The lead writes the status update with the
  project-management-duty skill and commits only on the owner's word in that turn. Never push.
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

A hand-over tells the owner: what to run, what to judge and where, the file that explains a
failure, what was computed and never seen, every visible change the owner did not ask for by
name, and the cures held ready, each as one value of the description.

## 4. Lessons, failure modes and gotchas

The owner's directions, given during these milestones:

- The task is additive; do not overcomplicate. No passed prop moves.
- The art review is one light pass on rules; the acceptance review is one short pass. The
  owner does the real art review in the human test.
- Static objects are cheap: one box each, and their richness is paint.
- The ambient stays at 3.3. A fill lights silhouettes, never the entire interior.

Lessons that held:

- No agent sees lighting. A full relight computed from the model was a guess; the owner
  asked for subtraction first, then small additions, each tested by eye.
- The page shows a scene luminance under about 0.014 as black. A value under it wastes the
  owner's test.
- Light the floor where the player walks. The first emergency lights stood at their lamps
  and lit only walls; the art author's own caveat caught it before the owner's test.
- A mark logs where the owner stood and looked. Cast that view against the stage of the
  built level to find the wall face a lamp hangs on.
- New art can turn an old test red: a test helper counted the glows of props alone. Run
  both root gates after every landing of the level, before the hand-over.
- Replace an agent whose context runs low with a fresh one and a brief that stands alone;
  the plans, outcomes and notes in the scratch directory carry the memory.

Failure modes of this session:

- Crossed messages. An agent reads one message a turn: a report may answer the message
  before, and an idle notice repeats an old result. Check the file, not the report.
- Line endings. An edit after a review wrote CRLF; the read-only check is `git ls-files
  --eol -m -o --exclude-standard`.
- A root gate that meets another member's work in progress. The member proves its package
  by hand, and the lead runs the gates when the tree is clear.
- Stale figures. The guide and the painter cost state the level's counts: search for them
  after every landing. Read the committed level before stating a value: the owner tunes it.

Gotchas:

- The lint fails a file at 500 lines: the authoring guide stands at 498, the finish format
  at 494 and the recipes note at 490. A list holds ten items and about 200 words.
- The level uses 217 of 256 static objects and 25 of 32 point lights. Every point costs on
  every lit pixel; the frame rate is the owner's to read, and look and lighting names the
  points that go first. The cap of point lights rose twice in one day: give a cap room.
- Litter on a prop hangs in the air in the game once its prop is destroyed, until adoption
  hides it by the `support` its node names. The QA app shows no damage.
- The recipes note still writes a one-sided `border` on `corrugated/shutter`, for milestone
  6. The format wants every side above zero; a rectangle under `across: ends` draws the same.
- Legends are not built: no `glyphs` kind, and every number is 0 until milestone 7. Unproven
  still: whether legends read, and the damaged look, which waits for adoption.
