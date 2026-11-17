# qa-client rules

- Keep the source and the page scripts browser-safe: no Bun or Node modules and no Bun or Node
  globals. Only the tests read a file, the page document.
- Never import destruction lib, directly or through another component.
- Draw only through `@level-designer/level-view`; reach sec-111's physics and game values
  only through `@level-designer/sec111-gateway`. Hold no copy of a game value.
- Never fail silently: each blocking condition shows a message on the page and sends it in
  a log batch, and each mark ends in exactly one outcome.
- Keep the protocol unit the one owner of the routes, the page and level file names, the
  limits and the shapes that `qa-server` shares.
- Keep `page/watch.ts` and `page/program.ts` free of decisions: they pass the real browser to
  `src/`, where every decision sits behind a port and has a test.
- Add no gameplay: the human cannot shoot.
- Test the real page entry on the hand-built document of `page/index.html` against a scripted
  fake of the protocol, with the manual timers. Never launch a server or a browser.
