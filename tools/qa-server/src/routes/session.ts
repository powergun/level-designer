import type { RunLog } from "../run-log/index.js";
import type { LevelState, PageFiles } from "../start/index.js";
import type { MarkFile } from "./mark-file.js";

/** Everything one run's handler serves and writes: the run log, the marks, the level, the page. */
export interface Session {
  readonly log: RunLog;
  readonly marks: MarkFile;
  readonly level: LevelState;
  readonly page: PageFiles;
  readonly now: () => Date;
}
