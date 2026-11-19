# level-cli

`@level-designer/level-cli` is the command-line tool of the level designer. Its commands
list the prop kinds, validate a description, build the level pair and draw the snapshot
sheets with one finish page per finish path in use, a slab's, a static object's, a seal's or a
hall finish's. It owns the argument parsing, the file writes under the work directory, the
printed text and the exit statuses. The art team's agents and the root recipes are its users.

It depends on `@level-designer/level-pipeline`, `@level-designer/snapshot-render`,
`@level-designer/prop-kit`, `@level-designer/level-format`, `@level-designer/level-rules`
and `@level-designer/sec111-gateway`, and it runs under Bun.

Exit status 0 means accepted or done, 2 a blocked build or a rejected level, 3 a usage or
file error, and 1 a defect or a broken sibling install, ending with Bun's error and stack.

The facade offers `run`, the tool's entry, and the types of the pipeline and the streams it
takes. The program file `main.ts` passes the real pipeline; the root recipes run it. The
snapshot sheets mark one section line, the hang height of `level-rules`; the tool holds no
height of its own.

```sh
mise exec -- bun tools/level-cli/main.ts validate
mise exec -- bun test ./tools/level-cli
```

Read the [component knowledge](docs/KNOWLEDGE.md) next.
