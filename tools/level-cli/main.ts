/**
 * The program file of level-cli, which the root recipes run with Bun: it wires the real level
 * pipeline and snapshot renderer into the tool's `run` entry and sets the exit status.
 */
import { run } from "@level-designer/level-cli";
import {
  buildLevel,
  COMMITTED_DESCRIPTION,
  readInputs,
  validateLevel,
} from "@level-designer/level-pipeline";
import { renderFinishSheet, renderSheets } from "@level-designer/snapshot-render";

process.exitCode = await run(
  Bun.argv.slice(2),
  {
    committedDescription: COMMITTED_DESCRIPTION,
    readInputs,
    buildLevel,
    validateLevel,
    renderSheets,
    renderFinishSheet,
  },
  {
    out: (line) => process.stdout.write(`${line}\n`),
    err: (line) => process.stderr.write(`${line}\n`),
  },
);
