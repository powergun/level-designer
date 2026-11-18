# Engineer brief: the standing brief for an engineer of a subtask

The team lead points every engineer to this file together with the team brief and the
assignment. The assignment names the member name, the subtask of the build plan and the
one component. The lead also names two directories for the session, both outside the
repository: the scratch directory and the gate lock directory.

## Read first, in this order

1. The root `CLAUDE.md` (a hard requirement) and the files it names.
2. `docs/notes/team-brief.md`: the rules for every subagent. All apply.
3. The root `README.md` and `docs/KNOWLEDGE.md`.
4. The task documents of the assignment in `docs/project-management/`.
5. The design the task documents point to: its working rules, the milestone, the subtask
   in full, and every section that the subtask's scope and checks name.
6. The component's `CLAUDE.md`, `README.md` and `docs/KNOWLEDGE.md`, the same documents of
   each component it depends on, and the component's `synopsis.xml` files.
7. The retros that the task documents name.

The design is the authority. Where the component's documents are older than the design,
the design wins, and bringing those documents in line is part of the subtask.

## Phase 1: plan, then stop

Write `plan-<subtask>.md` in the scratch directory, at most 150 lines:

- the observable contract to deliver;
- the units and files to add or change, and each change of the public surface with its
  consumer;
- one line per check of the subtask: the test that will prove it, and its home;
- what the integrator must do: dependency edges, exports, lint, knip and bundle entries;
- what another subtask must land first, and what another subtask needs from this one;
- every point where the design is unclear or cannot be built as written, each with a
  proposed reading. Plan on the reading; do not stop for it.

Reply with the plan's path and one line, then stop. Build nothing before the lead's "go".
The lead's answer may hold changes; they are requirements.

## Phase 2: build, on "go"

- Make the smallest coherent change that delivers the subtask. Add to what exists; redo
  nothing that works, and mix in no adjacent cleanup.
- Every check becomes a test at the rule's limit and one step beyond it. Where a rule has
  corners, add an edge-biased sample. Prove each new test by breaking its code once.
- A change that breaks another component's build is staged in the scratch directory and
  lands only on the lead's word, in one window with the components it breaks.
- Tests remove what they create and start no server, no browser and no real renderer.
- Update the component's `README.md`, `docs/KNOWLEDGE.md` and `CLAUDE.md` to what the
  component now owns.
- Before reporting, run every lint step on the package by hand, the late ones too: the
  formatter, oxlint with both configurations, the type check of both projects, knip,
  jscpd, tsane, and the markdown, unicode and size checks. The late steps run last at
  the root, behind steps that another member's work in progress can block.
- Then run `just test` and `just lint` from the root, each under the gate lock. A failure
  inside the component is the engineer's. A failure outside it goes to the lead at once,
  with the step, the file and the message.

## Report

Write `outcome-<subtask>.md` in the scratch directory; a file name that starts with
`report-` is refused by the harness. It holds:

- per check: the test file and test name that prove it;
- every changed file and every change of the public surface;
- the gate results: command, exit status, the test recipe's time;
- what was verified, what was inferred, what was not tested;
- every deviation from the design, with its reason.

Keep a state file `state-<member name>.md` there, at most 40 lines, true at all times: a
replacement continues from it. Reply with the outcome's path and one line. A separate
reviewer reads the work; fix its findings, add a section "Fixes for review <n>" and reply
again. Before each "done", reread the assignment and every later message of the lead.
