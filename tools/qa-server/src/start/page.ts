import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PAGE_FILES } from "@level-designer/qa-client/protocol";
import type { StartFailure, StartLine, StepOutcome } from "./step.js";
import { failure, messageOf } from "./step.js";

/** The page as the server serves it: the document, the style and the two script bundles. */
export type PageFiles = { readonly [file in keyof typeof PAGE_FILES]: string };

/** The absolute path of one page file of `qa-client`, by its source name. */
export type PageFileLookup = (source: string) => string;

/** The lookup of the program file: each page file through qa-client's page files entry. */
export function qaClientPageFile(source: string): string {
  return fileURLToPath(import.meta.resolve(`@level-designer/qa-client/page/${source}`));
}

/** The reason of a failed bundle: each build message, or the thrown message. */
function bundleReason(error: unknown): string {
  if (error instanceof AggregateError && error.errors.length > 0) {
    return error.errors.map((inner: unknown) => messageOf(inner)).join("; ");
  }
  return messageOf(error);
}

/** One page file's text, or the failure that names it. */
type Loaded =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly failure: StartFailure };

/** The text of the page file `source`, served as it is. */
async function readPage(lookup: PageFileLookup, source: string): Promise<Loaded> {
  try {
    return { ok: true, text: await readFile(lookup(source), "utf8") };
  } catch (error) {
    return {
      ok: false,
      failure: failure(`cannot read the page file ${source}: ${messageOf(error)}`, error),
    };
  }
}

/** The page script `source` bundled on its own for the browser, unminified, in one file. */
async function bundleScript(lookup: PageFileLookup, source: string): Promise<Loaded> {
  try {
    const result = await Bun.build({ entrypoints: [lookup(source)], target: "browser" });
    const [output] = result.outputs;
    if (!result.success || output === undefined) throw new Error(result.logs.join("; "));
    return { ok: true, text: await output.text() };
  } catch (error) {
    const reason = `cannot bundle the page script ${source}: ${bundleReason(error)}`;
    return { ok: false, failure: failure(reason, error) };
  }
}

/** The run log line of a served bundle. */
function bundledLine(route: string, text: string): StartLine {
  return { level: "info", text: `bundled ${route}: ${text.length} characters` };
}

/**
 * Reads the page document and style and bundles the boot watch and the page program apart, so
 * the watch shares no chunk with the program and runs when the program fails to load.
 */
export async function bundlePage(lookup: PageFileLookup): Promise<StepOutcome<PageFiles>> {
  const lines: StartLine[] = [];
  const document = await readPage(lookup, PAGE_FILES.document.source);
  if (!document.ok) return { ok: false, lines, failure: document.failure };
  const style = await readPage(lookup, PAGE_FILES.style.source);
  if (!style.ok) return { ok: false, lines, failure: style.failure };
  const watch = await bundleScript(lookup, PAGE_FILES.watch.source);
  if (!watch.ok) return { ok: false, lines, failure: watch.failure };
  lines.push(bundledLine(PAGE_FILES.watch.route, watch.text));
  const program = await bundleScript(lookup, PAGE_FILES.program.source);
  if (!program.ok) return { ok: false, lines, failure: program.failure };
  lines.push(bundledLine(PAGE_FILES.program.route, program.text));
  const value = {
    document: document.text,
    style: style.text,
    watch: watch.text,
    program: program.text,
  };
  return { ok: true, lines, value };
}
