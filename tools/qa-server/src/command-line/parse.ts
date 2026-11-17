import { resolve } from "node:path";
import { parseArgs } from "node:util";

/** The server's options; every path is absolute. */
export interface Options {
  readonly workdir: string;
  readonly siblings: readonly string[];
  readonly port: number;
}

/** The parsed command line: the options, or the usage problem that names its option. */
export type ParsedOptions =
  | { readonly ok: true; readonly options: Options }
  | { readonly ok: false; readonly problem: string };

/** The one usage line that follows every usage problem. */
export const USAGE: string =
  "usage: qa-server --workdir <dir> --sibling <dir> [--sibling <dir>] [--port <n>]";

/** The port the server binds unless `--port` names another. */
const DEFAULT_PORT = 4327;

/** The largest TCP port. */
const MAX_PORT = 65535;

/** The options of the command line. */
const OPTIONS = {
  workdir: { type: "string" },
  sibling: { type: "string", multiple: true },
  port: { type: "string" },
} as const;

/** A failed parse with its problem. */
function problem(text: string): ParsedOptions {
  return { ok: false, problem: text };
}

/** The port of `--port`: the default, a whole number from 0 to 65535, or the problem. */
function portOf(value: string | undefined): number | string {
  if (value === undefined) return DEFAULT_PORT;
  const port = /^\d+$/.test(value) ? Number(value) : Number.NaN;
  if (!Number.isInteger(port) || port > MAX_PORT) {
    return `--port takes a whole number from 0 to ${MAX_PORT}, got "${value}"`;
  }
  return port;
}

/**
 * Parses `argv` (the arguments after the program file). `--workdir` is required, `--sibling`
 * comes at least once, and no value may be empty: an empty path would name the current
 * directory.
 */
export function parseOptions(argv: readonly string[]): ParsedOptions {
  let values: ReturnType<typeof parseArgs<{ options: typeof OPTIONS }>>["values"];
  try {
    values = parseArgs({ args: [...argv], options: OPTIONS, strict: true }).values;
  } catch (error) {
    return problem(error instanceof Error ? error.message : String(error));
  }
  const { workdir, sibling = [], port } = values;
  if (workdir === undefined) return problem("--workdir is required");
  if (sibling.length === 0) return problem("--sibling is required at least once");
  if ([workdir, ...sibling, port].includes("")) return problem("an option value is empty");
  const portValue = portOf(port);
  if (typeof portValue === "string") return problem(portValue);
  return {
    ok: true,
    options: {
      workdir: resolve(workdir),
      siblings: sibling.map((dir) => resolve(dir)),
      port: portValue,
    },
  };
}
