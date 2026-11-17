# qa-client

`@level-designer/qa-client` is the QA page. The human walks the level in the game's collision,
flies freely and records a mark with a typed comment on `F3`. The page draws the level through
`@level-designer/level-view` and walks in sec-111's physics world through
`@level-designer/sec111-gateway`. Its one consumer is `@level-designer/qa-server`, which serves
the page and answers its requests.

The component owns:

- the boot in a fixed order, with a status strip that names the running step;
- the input, walk in sec-111's physics world and fly with no collision;
- the marks: the comment box and the one outcome of each mark;
- the heads-up display and the status strip, which never collapse;
- the page side of the run log: log batches, console errors and warnings, uncaught errors;
- the JSON protocol it shares with `qa-server`: the routes, the page and level file names, the
  shapes of the session facts, a log batch, a mark and their answers, the server's admissions
  of request bodies and the page's readers of answers;
- the boot watch, a script bundled apart that reports a page program that fails to load or to
  start.

It has four entries:

- the facade, `@level-designer/qa-client`: `bootPage`, and the `PageFetch` port that test fakes
  implement;
- the protocol entry, `@level-designer/qa-client/protocol`: the protocol unit alone, which
  depends on nothing, so the server reads it without loading a sibling;
- the page files, `@level-designer/qa-client/page/<file>`: `index.html`, `page.css`,
  `watch.ts` and `program.ts`, which `qa-server` serves and bundles;
- the testing entry, `@level-designer/qa-client/testing`: `createTestPage`, with the
  hand-built document, the scripted window, the manual clock and timers and the scripted view.

It imports no destruction lib, and the human cannot shoot in it.

Iterate with the per-package commands from the repository root:

```sh
mise exec -- bun test ./packages/qa-client
mise exec -- bun x --no-install oxlint packages/qa-client
mise exec -- bun x --no-install knip --workspace packages/qa-client
```

Read the [component knowledge](docs/KNOWLEDGE.md) next.
