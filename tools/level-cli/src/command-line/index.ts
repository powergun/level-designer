/**
 * command-line: the parse of the tool's command line into one command with absolute paths and
 * its custom view, or the usage problem that names the option or command at fault.
 */
export { parseCommand, USAGE } from "./parse.js";
export type { Command, CustomView } from "./parse.js";
