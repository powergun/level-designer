import type { PageFileLookup, Pipeline } from "./start/index.js";

/**
 * What a run takes besides its arguments: the loader of the level pipeline, the lookup of
 * qa-client's page files, the two output streams (one line per call), the one clock of the run
 * and the stop request, whose reason names the cause. The program file passes the real ones.
 */
export interface Surroundings {
  readonly loadPipeline: () => Promise<Pipeline>;
  readonly pageFile: PageFileLookup;
  readonly out: (line: string) => void;
  readonly err: (line: string) => void;
  readonly now: () => Date;
  readonly stop: AbortSignal;
}

/** 0 a run that stopped; 1 a start failure; 3 a usage error. */
export type ExitStatus = 0 | 1 | 3;
