import { resolve } from "node:path";
import { parseArgs } from "node:util";
import type { Point } from "./point.js";
import { parsePoint } from "./point.js";

/** A custom perspective view of the snapshot command: the eye and the point it looks at. */
export interface CustomView {
  readonly eye: Point;
  readonly lookAt: Point;
}

/** One command of the tool with its options; every path is absolute. */
export type Command =
  | { readonly name: "kinds" }
  | { readonly name: "validate"; readonly description: string }
  | { readonly name: "build"; readonly description: string; readonly workdir: string }
  | {
      readonly name: "snapshot";
      readonly description: string;
      readonly workdir: string;
      readonly custom: CustomView | undefined;
    };

/** The parsed command line: the command, or the usage problem that names its option. */
export type Parsed =
  | { readonly ok: true; readonly command: Command }
  | { readonly ok: false; readonly problem: string };

/** The one usage line that follows every usage problem. */
export const USAGE: string =
  "usage: level-cli <kinds|validate|build|snapshot> [--description <path>] [--workdir <dir>]" +
  " [--eye=<x,y,z> --look-at=<x,y,z>]";

/** The command names, in the order the usage line gives them. */
const COMMANDS = ["kinds", "validate", "build", "snapshot"] as const;

/** The options every command accepts; `--eye` and `--look-at` belong to `snapshot`. */
const OPTIONS = {
  description: { type: "string" },
  workdir: { type: "string" },
  eye: { type: "string" },
  "look-at": { type: "string" },
} as const;

/** The option values that `parseArgs` returns for the tool's options. */
type Values = ReturnType<typeof parseArgs<{ options: typeof OPTIONS }>>["values"];

/** A failed parse with its problem. */
function problem(text: string): Parsed {
  return { ok: false, problem: text };
}

/** The custom view of `--eye` and `--look-at`: absent, a view, or the problem with them. */
function customView(values: Values): CustomView | undefined | string {
  const { eye, "look-at": lookAt } = values;
  if (eye === undefined && lookAt === undefined) return undefined;
  if (eye === undefined || lookAt === undefined) return "--eye and --look-at go together";
  const eyePoint = parsePoint(eye);
  if (eyePoint === undefined) return `--eye takes x,y,z in metres, got "${eye}"`;
  const lookPoint = parsePoint(lookAt);
  if (lookPoint === undefined) return `--look-at takes x,y,z in metres, got "${lookAt}"`;
  if (eyePoint.every((value, axis) => value === lookPoint[axis])) {
    return "--eye and --look-at name the same point";
  }
  return { eye: eyePoint, lookAt: lookPoint };
}

/** The command that `name` and the option values select, or the problem with them. */
function command(name: (typeof COMMANDS)[number], values: Values, committed: string): Parsed {
  const custom = customView(values);
  if (typeof custom === "string") return problem(custom);
  if (custom !== undefined && name !== "snapshot") {
    return problem("--eye and --look-at belong to snapshot");
  }
  if (name === "kinds") return { ok: true, command: { name } };
  const description = resolve(values.description ?? committed);
  if (name === "validate") return { ok: true, command: { name, description } };
  if (values.workdir === undefined) return problem(`${name} needs --workdir <dir>`);
  const workdir = resolve(values.workdir);
  if (name === "build") return { ok: true, command: { name, description, workdir } };
  return { ok: true, command: { name, description, workdir, custom } };
}

/** Whether `error` is the usage error `parseArgs` throws for an unknown or malformed option. */
function isUsageError(error: unknown): error is TypeError {
  return (
    error instanceof TypeError && String(Reflect.get(error, "code")).startsWith("ERR_PARSE_ARGS")
  );
}

/**
 * Parses the command line: one command name, then options. `committed` is the default
 * description; relative paths resolve against the current directory.
 */
export function parseCommand(argv: readonly string[], committed: string): Parsed {
  let parsed: { values: Values; positionals: string[] };
  try {
    parsed = parseArgs({ args: [...argv], options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    if (isUsageError(error)) return problem(error.message.replaceAll("\n", " "));
    throw error;
  }
  const [name, ...extra] = parsed.positionals;
  if (name === undefined) return problem("name a command");
  if (extra.length > 0) return problem(`unexpected argument "${extra[0]}"`);
  const known = COMMANDS.find((candidate) => candidate === name);
  if (known === undefined) {
    return problem(`unknown command "${name}"; the commands are ${COMMANDS.join(", ")}`);
  }
  const empty = Object.entries(parsed.values).find(([, value]) => value.trim() === "");
  if (empty !== undefined) return problem(`--${empty[0]} needs a value`);
  return command(known, parsed.values, committed);
}
