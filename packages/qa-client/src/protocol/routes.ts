/** The routes of the QA server: the page, its level files and the three API routes. */
export const ROUTES = {
  page: "/",
  session: "/api/session",
  log: "/api/log",
  mark: "/api/mark",
  levelPrefix: "/level/",
} as const;

/**
 * The page files: each source in the page files entry of this package and the route it answers
 * at. The server bundles the two scripts apart, so the boot watch runs without the program.
 */
export const PAGE_FILES = {
  document: { source: "index.html", route: "/" },
  style: { source: "page.css", route: "/page.css" },
  watch: { source: "watch.ts", route: "/watch.js" },
  program: { source: "program.ts", route: "/program.js" },
} as const;

/** The four fixed names of the level files: the level pair and the prepared static level. */
export const LEVEL_FILES = {
  glb: "level.glb",
  level: "level.json",
  prepared: "prepared.json",
  navMesh: "prepared.navmesh.bin",
} as const;

/** One of the four level file names. */
export type LevelFileName = (typeof LEVEL_FILES)[keyof typeof LEVEL_FILES];

/** The route of one level file. */
export function levelFileRoute(name: LevelFileName): string {
  return `${ROUTES.levelPrefix}${name}`;
}

/** The longest mark comment, in UTF-16 units, the count of a textarea's `maxLength`. */
export const MAX_COMMENT = 2000;

/** The most lines one log batch holds. */
export const MAX_BATCH_LINES = 200;

/** The longest text of one page line. */
export const MAX_LINE_TEXT = 8000;

/**
 * The line terminators, each one character: every character a Unicode line splitter breaks on
 * (LF, VT, FF, CR, FS, GS, RS, NEL, LS and PS). The page folds a comment by them, the mark
 * admission refuses a comment that holds one, and the server folds run log text.
 */
const LINE_TERMINATORS: string = String.fromCharCode(
  0x0a,
  0x0b,
  0x0c,
  0x0d,
  0x1c,
  0x1d,
  0x1e,
  0x85,
  0x2028,
  0x2029,
);

/** A run of line terminators. */
const TERMINATOR_RUN = new RegExp(`[${LINE_TERMINATORS}]+`, "g");

/** The text on one line: each run of line terminators becomes one space. */
export function foldLines(text: string): string {
  return text.replace(TERMINATOR_RUN, " ");
}
