/**
 * The program file of qa-server, which the QA recipe runs with Bun. It loads the level pipeline
 * only with a dynamic import, after the run log opens and the siblings are checked, and turns
 * the first stop signal into the run's stop request.
 */
import { qaClientPageFile, run } from "@level-designer/qa-server";

const stop = new AbortController();
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"] as const) {
  process.on(signal, () => {
    if (!stop.signal.aborted) return stop.abort(signal);
    process.stderr.write("qa-server: stopped at once; the run log has no last line\n");
    process.exit(1);
  });
}

const status = await run(Bun.argv.slice(2), {
  loadPipeline: () => import("@level-designer/level-pipeline"),
  pageFile: qaClientPageFile,
  out: (line) => process.stdout.write(`${line}\n`),
  err: (line) => process.stderr.write(`${line}\n`),
  now: () => new Date(),
  stop: stop.signal,
});
process.exit(status);
