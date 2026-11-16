# Team brief: rules for every subagent

The team lead gives this file to every subagent together with its assignment. An agent
does what its brief does not forbid, so every brief carries every rule. The lead adds two
things per session: the scratch directory and the gate lock directory, both outside the
repository.

## Never

- Never launch a dev server or a browser, and never drive an existing browser. The human
  owns all browser, visual and interactive QA.
- Never write inside a sibling repository (`../sec-111`, `../destruction-poc`,
  `../rendering-poc` and the others). Never run a recipe there that writes files. Reading
  files and running read-only commands is allowed.
- Never commit, push, stash, reset, checkout or otherwise change git state in any
  repository. The owner commits.
- Never mine git history. Never read a `docs/archived` directory.
- Never read shell history, the user profile, or any file outside this repository, the
  sibling repositories and the scratch directory.
- Never contact an external service or the web, and never send project or owner details
  anywhere. Package installs that a recipe of this repository performs are the exception.
- Never go beyond the assignment's scope. Report an adjacent problem; do not fix it.
- Never turn a decision of the task documents or of the lead into a question for the
  owner. An item the lead marked required is not a question.

## Always

- Read the root `CLAUDE.md`, the house rules it names, the task document of the
  assignment and the design sections it points to before writing anything.
- Edit only your own component. Root files and dependency lists belong to the
  integrator.
- Hold the gate lock for every root gate: create the lock directory, run the gate, remove
  the directory, pass or fail. Creation fails while another member holds it; wait and
  retry. Iterate with the per-package commands in between.
- Keep one-off scripts, probes and measurements in the scratch directory, with absolute
  output paths. Leave no stray file in the repository.
- Make tests remove every file and folder they create.
- After starting a background command, check that it finished. Do not wait to be told.
- After a manifest change, install only through `just setup`. A bare `bun install` links
  the rendering library copy back to its sibling files and fails the `render-gateway`
  drift test.
- As a reviewer, change no file in the repository, not even for a moment. Run probes
  from the scratch directory against a package's facade.
- Leave a scratch file that another member reads as a reference unchanged. Put a new
  variant in a new file and name it.

## Reporting

- Write the complete report to the file the assignment names, in the scratch directory.
  The final reply is only the file path plus a one-line status. If a file name is
  refused, pick another and report it; never paste the report into the reply.
- Separate what was verified (read in a named file, or measured with a named command)
  from what is inferred. Name what was not checked.
- Report every deviation from the design with its reason. Do the nearest thing that
  keeps the design's intent; do not silently change scope.
- Before reporting done, reread the assignment and every later message from the lead.
  Later messages are requirements.
- Send a question to the lead only when the documents cannot settle it. Give options and
  a default, and keep working on what does not depend on the answer.
- Write plain ASCII Markdown: lists over tables, no ASCII art, `->` for flows.
