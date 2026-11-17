import type { BuiltLevel } from "@level-designer/level-pipeline";
import { LEVEL_FILES, PAGE_FILES, ROUTES } from "@level-designer/qa-client/protocol";
import type { Answer } from "./answer.js";
import { refuse } from "./answer.js";
import type { Session } from "./session.js";

/** The page files by route, each with its content type. */
function pageFiles(session: Session): ReadonlyMap<string, Answer> {
  const { document, style, watch, program } = PAGE_FILES;
  const { page } = session;
  const script = "text/javascript; charset=utf-8";
  return new Map<string, Answer>([
    [document.route, { kind: "file", type: "text/html; charset=utf-8", data: page.document }],
    [style.route, { kind: "file", type: "text/css; charset=utf-8", data: page.style }],
    [watch.route, { kind: "file", type: script, data: page.watch }],
    [program.route, { kind: "file", type: script, data: page.program }],
  ]);
}

/** The page file at `path`, or undefined when `path` is no page route. */
export function pageFileAnswer(session: Session, path: string): Answer | undefined {
  return pageFiles(session).get(path);
}

/** The level files of a built level by name, each with its content type. */
function levelFiles(built: BuiltLevel): ReadonlyMap<string, Answer> {
  const json = "application/json; charset=utf-8";
  const { document, navMesh } = built.prepared.files;
  return new Map<string, Answer>([
    [LEVEL_FILES.glb, { kind: "file", type: "model/gltf-binary", data: built.glb }],
    [LEVEL_FILES.level, { kind: "file", type: json, data: built.json }],
    [LEVEL_FILES.prepared, { kind: "file", type: json, data: document }],
    [LEVEL_FILES.navMesh, { kind: "file", type: "application/octet-stream", data: navMesh }],
  ]);
}

/** The level file at `path` under the level prefix; none while the build is blocked. */
export function levelFileAnswer(session: Session, path: string): Answer {
  const name = path.slice(ROUTES.levelPrefix.length);
  const unknown = refuse("not-found", `no level file "${name}"`);
  if (session.level.kind === "built") return levelFiles(session.level.built).get(name) ?? unknown;
  const known = Object.values(LEVEL_FILES).some((file) => file === name);
  return known ? refuse("no-level", `no level file ${name}: the build is blocked`) : unknown;
}
