import type { Command } from "./command-line/index.js";
import { parseCommand, USAGE } from "./command-line/index.js";
import type { ExitStatus, Pipeline, Streams } from "./commands/index.js";
import { build, kinds, snapshot, validate } from "./commands/index.js";

/** Runs one parsed command. */
function dispatch(command: Command, pipeline: Pipeline, streams: Streams): Promise<ExitStatus> {
  if (command.name === "kinds") return Promise.resolve(kinds(streams));
  if (command.name === "validate") return validate(command.description, pipeline, streams);
  if (command.name === "build") {
    return build(command.description, command.workdir, pipeline, streams);
  }
  return snapshot(command.description, command.workdir, command.custom, pipeline, streams);
}

/**
 * The tool's entry: parses `argv` (the arguments after the program), runs the command over
 * `pipeline` and returns its exit status. A usage problem prints on `err` with the usage line.
 */
export function run(
  argv: readonly string[],
  pipeline: Pipeline,
  streams: Streams,
): Promise<ExitStatus> {
  const parsed = parseCommand(argv, pipeline.committedDescription);
  if (!parsed.ok) {
    streams.err(`level-cli: ${parsed.problem}`);
    streams.err(USAGE);
    return Promise.resolve(3);
  }
  return dispatch(parsed.command, pipeline, streams);
}
