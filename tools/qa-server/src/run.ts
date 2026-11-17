import { join } from "node:path";
import type { Options } from "./command-line/index.js";
import { parseOptions, USAGE } from "./command-line/index.js";
import type { RunLog } from "./run-log/index.js";
import { openRunLog } from "./run-log/index.js";
import { MarkFile } from "./routes/index.js";
import { serveUntilStopped } from "./serve.js";
import { StartRecord } from "./start-record.js";
import type { StartLine, StepOutcome } from "./start/index.js";
import { buildForQa, bundlePage, checkSiblings } from "./start/index.js";
import type { ExitStatus, Surroundings } from "./surroundings.js";

/** The start facts: the process, the arguments, the work directory, the run and its files. */
function startFacts(
  argv: readonly string[],
  options: Options,
  log: RunLog,
  marks: string,
): StartLine[] {
  const facts = [
    `qa-server pid ${process.pid} bun ${Bun.version} ${process.platform}-${process.arch}`,
    `arguments ${JSON.stringify(argv)}`,
    `workdir ${options.workdir}`,
    `run ${log.name}`,
    `run log ${log.path}`,
    `marks file ${marks}`,
  ];
  return facts.map((text) => ({ level: "info", text }));
}

/** The value of a step that passed with its lines written, or the run's status that ends it. */
function settle<T>(
  record: StartRecord,
  outcome: StepOutcome<T>,
): { readonly value: T } | ExitStatus {
  if (!record.write(outcome.lines)) return 1;
  if (!outcome.ok) return record.fail(outcome.failure);
  if (record.stopped()) return 0;
  return { value: outcome.value };
}

/** The five start steps after the run log opened, then the serving until the stop request. */
async function startAndServe(
  argv: readonly string[],
  options: Options,
  log: RunLog,
  surroundings: Surroundings,
): Promise<ExitStatus> {
  const record = new StartRecord(log, surroundings);
  const marks = new MarkFile(join(options.workdir, "qa", "marks.log"), log.name);
  const facts = startFacts(argv, options, log, marks.path);
  if (!record.write(facts) || !record.begin("sibling check")) return 1;
  const siblings = settle(record, checkSiblings(options.siblings));
  if (typeof siblings === "number") return siblings;
  if (!record.begin("level")) return 1;
  const level = settle(record, await buildForQa(surroundings.loadPipeline));
  if (typeof level === "number") return level;
  if (!record.begin("page bundles")) return 1;
  const page = settle(record, await bundlePage(surroundings.pageFile));
  if (typeof page === "number") return page;
  if (!record.begin("port")) return 1;
  const session = { log, marks, level: level.value, page: page.value, now: surroundings.now };
  return serveUntilStopped(session, options.port, record, surroundings);
}

/**
 * The server's entry: parses `argv` (the arguments after the program file), opens the run log,
 * checks the siblings, builds through the loaded pipeline, bundles the page and serves until
 * the stop request. It resolves with the run's exit status once the run log is closed.
 */
export async function run(
  argv: readonly string[],
  surroundings: Surroundings,
): Promise<ExitStatus> {
  const parsed = parseOptions(argv);
  if (!parsed.ok) {
    surroundings.err(`qa-server: ${parsed.problem}`);
    surroundings.err(USAGE);
    return 3;
  }
  const opening = openRunLog(join(parsed.options.workdir, "qa"), surroundings.now);
  if (!opening.ok) {
    surroundings.err(`qa-server: cannot open the run log ${opening.path}: ${opening.reason}`);
    return 1;
  }
  surroundings.out(`run log ${opening.log.path}`);
  try {
    return await startAndServe(argv, parsed.options, opening.log, surroundings);
  } finally {
    opening.log.close();
  }
}
