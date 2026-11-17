# qa-server rules

- Build and validate only through `@level-designer/level-pipeline`, loaded by the program
  file with a dynamic import and injected by tests.
- Load nothing that reaches a sibling before the run log opens: production code imports
  only `@level-designer/qa-client/protocol` from qa-client, and the graph test guards the
  program file's static imports.
- Write files only under the work directory that `--workdir` names, and never name the
  scratch directory or a sibling in source; the QA recipe passes them.
- Bind loopback only, and refuse a request whose `Host`, or `Origin` when present, names
  another host.
- Never fail silently: log and print every start failure with its subject, and answer
  every API request with one JSON object that carries its reason on a refusal and says
  whether its run log lines were written.
- Write the run log and the marks file with synchronous appends only; never truncate.
- Take the routes, the level file names, the message shapes, the admissions and the line
  fold from `qa-client`'s protocol entry; hold no copy.
- Test with an injected build and real servers on temporary ports. Never prepare a level,
  launch a browser or leave a file behind.
