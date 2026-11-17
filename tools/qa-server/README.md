# qa-server

`@level-designer/qa-server` is the loopback server of the QA app. It builds the committed
description once, serves the page of `@level-designer/qa-client` and the level, appends
marks to the marks file and writes one run log per run. It runs under Bun. The human is
its user, through the QA recipe.

It depends on `@level-designer/level-pipeline` and `@level-designer/qa-client`. Its tests
also use `@level-designer/sec111-gateway`'s testing entry and `@level-designer/level-format`.

The component owns:

- its arguments: the work directory, the sibling directories and the port;
- the start in a fixed order: the run log, the sibling install checks, the build and its
  validation through the level pipeline, the two page bundles and the port;
- the start failures, each logged and printed with its subject, and the exit statuses;
- the routes: the page, the level files, the session facts, the log batches and the marks;
- the run log under `<workdir>/qa/logs/` and the marks file `<workdir>/qa/marks.log`;
- the refusals: a foreign `Host` or `Origin`, another run's request, a comment that is too
  long and a malformed pose.

It binds `127.0.0.1` only and never moves to another port.

The facade offers `run`, the server's entry, `qaClientPageFile`, the lookup of the page
files, and the types of the surroundings, the pipeline and the exit status. The program
file `main.ts` passes the real ones; the QA recipe runs it.

```sh
mise exec -- bun tools/qa-server/main.ts --workdir .tmp --sibling ../sec-111 --sibling ../destruction-poc
mise exec -- bun test ./tools/qa-server
```

Exit status 0 means the server ran and was stopped, 1 a start failure, and 3 a usage error.

Read the [component knowledge](docs/KNOWLEDGE.md) next.
