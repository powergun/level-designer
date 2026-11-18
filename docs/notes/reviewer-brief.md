# Reviewer brief: the standing brief for a reviewer

The team lead points every reviewer to this file together with the team brief and the
assignment. The assignment names the member name, the subtask or milestone under review
and the engineer's outcome file. The lead also names the session's scratch directory and
gate lock directory, both outside the repository.

A reviewer changes no file in any repository, not even for a moment. Probes run from the
reviewer's own subdirectory of the scratch directory, against a package's facade.

## Read first

1. The root `CLAUDE.md` (a hard requirement) and the files it names.
2. `docs/notes/team-brief.md`: the rules for every subagent. All apply.
3. The root `README.md` and `docs/KNOWLEDGE.md`.
4. The requirement authority: the task documents in `docs/project-management/`.
5. The design they point to: the subtask or milestone under review in full, and every
   section its scope and checks name.
6. The documents of the component under review and its `synopsis.xml` files.
7. The retros that the task documents name.
8. The engineer's plan and outcome in the scratch directory. They are claims to test.

## How to review

- Review the change, never the report: `git status --short` and `git diff` of the working
  tree are allowed; git history is not. Judge only the files of the subtask under review;
  other members work in the same tree.
- Check the work against the subtask's scope and checks and against every sentence of the
  design that it implements. Name each requirement that is missing, deferred, weakened or
  silently changed.
- Disbelieve the tests. For each check, find the test and the change of production code
  that turns it red. Draw new samples with another generator and seed, at the rule limits
  and in the corners where several parameters sit at their limits together.
- Check the house rules: one fact, one owner; no speculative option; no check without a
  named risk; no part that only measures; a public surface with living consumers; the
  component's documents current.
- Name what is more machinery than its consumer needs, with the simpler form.
- Report as a finding what breaks the task documents' requirements, the gates or the
  owner's test. Leave polish and taste out, and propose no scope beyond the task documents.
- Prove the package with the per-package commands and every lint step by hand. Run the
  root gates under the gate lock when the lead says the tree is clear of other members'
  work in progress.

## Report

Write `review-<subtask>-<n>.md` in the scratch directory, `<n>` counting the rounds from 1:
the findings by severity (blocker, major, minor), each with the file and line, the
evidence (a named file, or a named probe and its output) and the smallest fix; then what
was verified, what was inferred, what was not checked, and the gate results; then one
verdict line, `approved` or `changes required`.

Reply with the report's path and one line with the verdict and the counts. When the
engineer has fixed the findings, the lead sends the same reviewer back: check each fix in
the code, look for what the fix broke, and write the next round's file.

## The acceptance review of a milestone

A fresh reviewer, who took no part in the build, reads the whole milestone against the
task documents before the owner's test. Beyond the points above it establishes:

- the coverage of every subtask's scope and checks;
- the owner's decisions against the tree;
- the task's constraints on a level that the reviewer builds itself;
- the root gates and a tree without stray files, with the untracked files listed for the
  owner's commit;
- for every way the new work can fail on the owner's machine, what the owner sees on the
  page and which file explains it;
- the content of the lead's hand-over: what to run, what to judge, which file to send
  back, what was computed and never seen, and every visible change the owner did not ask
  for by name.
