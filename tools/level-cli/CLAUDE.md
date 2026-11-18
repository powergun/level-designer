# level-cli rules

- Build and validate only through `@level-designer/level-pipeline`, and draw only through
  `@level-designer/snapshot-render`, both reached through the injected pipeline.
- Write files only under the work directory that `--workdir` names, and never name the
  scratch directory in source; the root recipes pass it. Remove only the finish pages'
  directory, before `snapshot` writes.
- Write data and reports to standard output; write each `wrote <absolute path>` line, every
  usage and file error and every `nothing written` reason to standard error.
- Exit with 0 for accepted or done, 2 for blocked or rejected, and 3 for a usage or file
  error. Announce every outcome with at least one line.
- Hold no copy of another component's fact: lengths print with `level-format`'s
  `formatLength`, the report's numbers come from the pipeline's report, the kind listing
  from `prop-kit`, the lens, the eye ratio and the figure height from `sec111-gateway`, and
  the hang height from `level-rules`, a swatch's recipe from `recipeAt`. Decode no colour.
- Test each command through the tool's `run` entry with an injected pipeline, captured
  streams and a temporary work directory that the test removes. Never prepare a level in a
  test.
