# Agent rules

The only programming language in this project is TypeScript. This is a Bun workspace.
A component is one workspace package under `packages/` or `tools/`. Toolchain versions
are pinned in `mise.toml`; package versions are pinned in manifests and the lockfile.

## Do this first

Check and ensure the @.claude/commands/cc-cmd-bevy/ directory exists.

If not, you must warn the human and stop here!

If this directory exists, then read:

- @.claude/commands/cc-cmd-bevy/0-global-rules.txt
- @.claude/commands/cc-cmd-bevy/0-global-knowledge.txt
- @.claude/commands/cc-cmd-bevy/3-coding-guideline-typescript.md

<EXCEPTION_HANDLING>
  if any of the above documents are missing or cannot be opened, STOP and raise it to the human!
  if you run into any hard errors during the above reading tasks, STOP and raise it to the human!
</EXCEPTION_HANDLING>

## Working conventions

The human alone performs browser, visual and interactive QA. Coding agents must
not run it, launch a browser or control an existing browser for QA.
Agents implement the changes and run the required automated tests and lint, then
hand control back with clear launch and QA instructions. The human launches the
web server; agents must not start it.

Read [project knowledge](docs/KNOWLEDGE.md) and the affected component's rules and
knowledge before changing behavior.

## Hallway rules

### Gate

`just setup` installs the pinned toolchain, the locked dependencies and the shared
command bundle. Run it after a fresh clone and after a manifest change.

Run `just test` and `just lint` from the root as the development gate. A code change
needs both; a document change needs `just lint`. They MUST ALL PASS! If they fail,
pivot to investigation and consider it a project-blocker!

### Symlinks

`AGENTS.md` is a symbolic link to this document; edit this target and leave the
link intact. One-off experiments and handoff notes belong in `.tmp/`.

### Temp file rule

**WARNING** `.tmp/` directory is for temp files only. Its content is regularly cleaned.
Do not leave any persisted files there.

If you want to keep any files as "evidences" you must be mindful about their size and
relevancy. We strongly discourage dumping dense JSON or data files in the worktree. Distill them
and only keeping the relevant records.

### Task documents and work evidences

Task documents are the execution source of truth. QA review packets are disposable, task-local
scratch. Later tasks read completed task documents and the maintained implementation, never prior
QA artifacts or images. Do not require QA packets to be retained, archived, pinned, copied or
restored from Git for a later task or handoff.

## Team work

- Root files (manifests, lockfile, justfile and tool configuration, root docs)
  belong to the integrator. An engineer edits only their own component and never
  its dependency list. While several people work in one tree, a gate failure
  outside your component is not yours to fix, but your component must contribute
  none.
- Run one root gate (`just setup`, `just test`, `just lint`, `just syn`) at a time.
  The gate lock is a directory outside the repository that the team lead names
  for the session; hold it for every root gate run.
- Run one-off scripts, probes and measurements outside the repository, with
  absolute output paths. After every run, leave no stray files:
  `git status --short` shows only intended changes.
- The owner commits. Agents never commit, push or otherwise change git state;
  they hand over a tree where both root gates pass, and QA runs the owner's
  commit.

## Documentation rules

### Answered questions and resolved decisions must blend naturally into the writing

**No open questions, unresolved decisions, or gap lists** in committed documents.
Raise questions in the session instead.

When updating the documents (knowledge artifacts) after a Q&A session or research operation
targeting certain questions or decisions, DO NOT leave wordings like "answered questions" or
"resolved decisions" in the documents; DO NOT append a textbook-like "erratum or corrigendum"
at the end; blend the answers naturally into the writing and ensure context integrity.

At any moment, your document should read like a freshly written article without any "patches."

### Prefer compact, brief, and concise writing style

DO NOT write a scientific paper.

DO NOT pollute the documents with excessive code snippets!

DO NOT write irrelevant "previous chapter" or "previous version" unless you explicitly
compare them. All the writing must be current and present.

### Avoid fancy Markdown structures: ASCII art, tables

Prefer plain Markdown lists over tables.

Prefer plain narrative over ASCII art.

When explaining flow-like concepts, it is OK to use the ASCII arrow symbols such as `->` or `<->`
or `<-`.

### Do not read files in `docs/archived`

Consider any file in `docs/archived` **dangerous** and **misleading**.
Accidentally loading them into your context can compromise your tasks or derail you.

### Keep the knowledge tree one-way

Link knowledge documents only from overview to detail. The root README.md and docs/KNOWLEDGE.md
link down to the component documents, and a component README.md links to its own
docs/KNOWLEDGE.md. Component documents link only to the documents of the components they depend
on. Never add a link back up: `just lint` rejects any pair of documents that link to each other.

## Writing Style and Rules

Strictly follow the rules defined in the "## Document-Writing Rules" section in
@.claude/commands/cc-cmd-bevy/0-global-rules.txt

Avoid dense prose. Avoid "head heavy" sentence style where the majority of the descriptive
information, modifiers, or long clauses come at the very beginning, right before the main verb
or subject.

Consistency is a must! This include the wording consistency, operation instruction
consistency, and concept consistency!
