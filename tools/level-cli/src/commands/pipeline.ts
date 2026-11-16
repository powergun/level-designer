import type {
  BuildInputs,
  BuildOutcome,
  BuiltLevel,
  ReadOutcome,
  Report,
} from "@level-designer/level-pipeline";
import type { Sheets, SnapshotInput } from "@level-designer/snapshot-render";

/**
 * Everything the tool calls to build, judge and draw a level: the level pipeline's read, build
 * and validation with its committed description, and the snapshot renderer. The program file
 * passes the real ones; tests inject fakes.
 */
export interface Pipeline {
  readonly committedDescription: string;
  readonly readInputs: (path: string) => Promise<ReadOutcome>;
  readonly buildLevel: (inputs: BuildInputs) => Promise<BuildOutcome>;
  readonly validateLevel: (built: BuiltLevel) => Promise<Report>;
  readonly renderSheets: (glb: Uint8Array, input: SnapshotInput) => Sheets;
}

/** The two output streams, one line per call: `out` for data and reports, `err` for the rest. */
export interface Streams {
  readonly out: (line: string) => void;
  readonly err: (line: string) => void;
}

/** 0 accepted or done; 2 blocked or rejected, with nothing written; 3 a usage or file error. */
export type ExitStatus = 0 | 2 | 3;
