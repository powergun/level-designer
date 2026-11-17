import { afterAll, beforeAll, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { bootPage } from "@level-designer/qa-client";
import {
  LEVEL_FILES,
  levelFileRoute,
  type MarkRequest,
  type RefusalReason,
  PAGE_FILES,
  ROUTES,
  readMarkAnswer,
  readRefusalAnswer,
  readSessionAnswer,
} from "@level-designer/qa-client/protocol";
import { createTestPage } from "@level-designer/qa-client/testing";
import { FAKE_GLB, fakeBuilt, fakePipeline } from "./fakes.ts";
import type { RunFolders, TestRun } from "./harness.ts";
import { abandonedPost, rawRequest } from "./raw-http.ts";
import {
  argsOf,
  makeFolders,
  misshapenLines,
  readAnswer,
  removeFolders,
  runLogLines,
  startRun,
} from "./harness.ts";

/** The one real server of this file, its folders and its address. */
let folders: RunFolders;
let server: TestRun;
let address: string;

beforeAll(async () => {
  folders = makeFolders();
  server = startRun(argsOf(folders), fakePipeline("accepted"));
  address = await server.address;
});

afterAll(async () => {
  try {
    server.stop.abort("the test file ended");
    await server.status;
  } finally {
    removeFolders(folders);
  }
});

/** A GET of `path` on the server. */
function get(path: string, headers: Record<string, string> = {}): Promise<Response> {
  return fetch(new URL(path, address), { headers });
}

/** A POST of `body` as JSON to `path` on the server. */
function post(path: string, body: unknown): Promise<Response> {
  return fetch(new URL(path, address), { method: "POST", body: JSON.stringify(body) });
}

/** The run name from the session facts. */
async function runName(): Promise<string> {
  const facts = await readAnswer(await get(ROUTES.session), readSessionAnswer);
  return facts.run;
}

/** The marks file's lines, or none before the first mark. */
function markLines(): string[] {
  const path = join(folders.workdir, "qa", "marks.log");
  try {
    return readFileSync(path, "utf8").split("\n").slice(0, -1);
  } catch {
    return [];
  }
}

/** A valid mark body of `run` in walk mode. */
function markBody(run: string): MarkRequest {
  return {
    run,
    mode: "walk",
    eye: [1, 1.7, 2],
    feet: [1, 0, 2],
    yaw: 12.5,
    pitch: -3,
    comment: "gap by the crate",
  };
}

test("the page and the four level files are served with their content types", async () => {
  const { document, style, watch, program } = PAGE_FILES;
  const types: [string, string][] = [
    [document.route, "text/html"],
    [style.route, "text/css"],
    [watch.route, "text/javascript"],
    [program.route, "text/javascript"],
  ];
  for (const [route, type] of types) {
    const response = await get(route);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toStartWith(type);
    expect((await response.text()).length).toBeGreaterThan(0);
  }
  const built = fakeBuilt();
  const expected: Record<string, Uint8Array> = {
    [LEVEL_FILES.glb]: FAKE_GLB,
    [LEVEL_FILES.level]: new TextEncoder().encode(built.json),
    [LEVEL_FILES.prepared]: new TextEncoder().encode(built.prepared.files.document),
    [LEVEL_FILES.navMesh]: built.prepared.files.navMesh,
  };
  for (const name of Object.values(LEVEL_FILES)) {
    const response = await get(levelFileRoute(name));
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array(expected[name] ?? []),
    );
  }
});

test("the real page boots against the real handler", async () => {
  const html = await (await get(PAGE_FILES.document.route)).text();
  const page = createTestPage({
    html,
    fetch: (path, init) => fetch(new URL(path, address), init),
  });
  await bootPage(page.surroundings);
  expect(page.document.visibleText("status")).toStartWith("ready");
  expect(page.view.inputs).toHaveLength(1);
  // The page's log batches reached the run log as page lines.
  expect(runLogLines(folders.workdir).some((line) => / page info boot step/.test(line))).toBe(true);
});

test("one mark request appends exactly one line with every field", async () => {
  const run = await runName();
  const before = markLines().length;
  const response = await post(ROUTES.mark, markBody(run));
  expect(response.status).toBe(200);
  const answer = await readAnswer(response, readMarkAnswer);
  if (answer.kind !== "saved") throw new Error(`the mark was not saved: ${answer.kind}`);
  expect(answer.file).toBe(join(folders.workdir, "qa", "marks.log"));
  expect(answer.logFailure).toBeNull();
  const lines = markLines();
  expect(lines).toHaveLength(before + 1);
  const mark: unknown = JSON.parse(lines.at(-1) ?? "");
  const { mode, eye, feet, yaw, pitch, comment } = markBody(run);
  const pose = { mode, eye, feet, yaw, pitch, comment };
  expect(mark).toEqual({
    time: expect.stringMatching(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}[+-]\d\d:\d\d$/),
    run,
    mark: answer.mark,
    level: "qa-fixture",
    description: "00c0ffee00aa",
    ...pose,
  });
});

test("a mark of another run, a long comment and a malformed pose are refused with a reason", async () => {
  const run = await runName();
  const before = markLines();
  const cases: [unknown, RefusalReason, number][] = [
    [markBody("qa-2026-01-01T00-00-00"), "other-run", 409],
    [{ ...markBody(run), comment: "x".repeat(2001) }, "comment-too-long", 400],
    [{ ...markBody(run), eye: [1, 2] }, "malformed-pose", 400],
  ];
  for (const [body, reason, status] of cases) {
    const response = await post(ROUTES.mark, body);
    expect(response.status).toBe(status);
    const answer = await readAnswer(response, readRefusalAnswer);
    expect(answer.reason).toBe(reason);
    expect(answer.message.length).toBeGreaterThan(0);
  }
  expect(markLines()).toEqual(before);
});

test("a foreign Host or Origin is refused; a request without Origin is served", async () => {
  const foreign: Record<string, string>[] = [
    { host: "evil.example" },
    { origin: "http://evil.example" },
    { origin: "null" },
  ];
  for (const headers of foreign) {
    const response = await get(ROUTES.session, headers);
    expect(response.status).toBe(403);
    expect((await readAnswer(response, readRefusalAnswer)).reason).toBe("foreign-host");
  }
  expect((await get(ROUTES.session)).status).toBe(200);
  expect((await get(ROUTES.session, { origin: address.slice(0, -1) })).status).toBe(200);
});

/** The three.js core modules of a bundle. */
function threeCores(modules: readonly string[]): string[] {
  return modules.filter((path) => path.endsWith("three.core.js"));
}

/** The installed Rapier package roots of a bundle. */
function rapierRoots(modules: readonly string[]): Set<string> {
  return new Set(modules.flatMap((path) => /^.*rapier3d[^\\/]*@[^\\/]+/.exec(path) ?? []));
}

/** The modules of a bundle that come from destruction lib or its gateway. */
function destruction(modules: readonly string[]): string[] {
  return modules.filter((path) => path.includes("destruction"));
}

/** The module path comments of a served bundle: Bun writes one before each module. */
async function modulesOf(route: string): Promise<string[]> {
  const text = await (await get(route)).text();
  return [...text.matchAll(/^\/\/ (\S+\.[cm]?[jt]s)$/gm)].map((match) => match[1] ?? "");
}

test("the page program bundles one three.js core and one Rapier root, the watch none", async () => {
  const program = await modulesOf(PAGE_FILES.program.route);
  const watch = await modulesOf(PAGE_FILES.watch.route);
  expect(threeCores(program)).toHaveLength(1);
  expect(rapierRoots(program).size).toBe(1);
  expect(destruction(program)).toEqual([]);
  expect(threeCores(watch)).toEqual([]);
  expect(rapierRoots(watch).size).toBe(0);
  expect(destruction(watch)).toEqual([]);
  expect(watch.length).toBeGreaterThan(0);
});

test("the session facts name the run, its two files and the built level", async () => {
  const facts = await readAnswer(await get(ROUTES.session), readSessionAnswer);
  const logs = join(folders.workdir, "qa", "logs");
  expect(facts).toEqual({
    run: expect.stringMatching(/^qa-\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d$/),
    runLog: join(logs, `${facts.run}.log`),
    marksFile: join(folders.workdir, "qa", "marks.log"),
    build: {
      kind: "built",
      name: "qa-fixture",
      description: "00c0ffee00aa",
      verdict: { kind: "accepted" },
    },
    logFailure: null,
  });
  // The stepping clock gives the run its start time: its first reading, 10:00:01 local time.
  expect(facts.run).toBe("qa-2026-11-17T10-00-01");
  expect(readdirSync(logs)).toEqual([`${facts.run}.log`]);
});

test("a body that is not JSON is refused at $ and appends nothing", async () => {
  const before = markLines();
  const response = await fetch(new URL(ROUTES.mark, address), { method: "POST", body: "hello" });
  expect(response.status).toBe(400);
  const answer = await readAnswer(response, readRefusalAnswer);
  expect(answer.reason).toBe("malformed");
  expect(answer.message).toStartWith("$: the body is not JSON: ");
  expect(markLines()).toEqual(before);
});

/** The lines of the shared server's run log that hold `part`. */
function logLinesWith(part: string): string[] {
  return runLogLines(folders.workdir).filter((line) => line.includes(part));
}

test("a Host that breaks the request URL gets one JSON refusal and one request line", async () => {
  const requests = [
    "GET /api/session HTTP/1.0\r\n\r\n",
    "GET /api/session HTTP/1.1\r\nHost: 127.0.0.1:abc\r\nConnection: close\r\n\r\n",
  ];
  const before = logLinesWith("-> 403 refused foreign-host").length;
  for (const request of requests) {
    const answer = await rawRequest(address, request);
    expect(answer.status).toBe(403);
    const read = readRefusalAnswer(JSON.parse(answer.body));
    expect(read.ok && read.value.reason).toBe("foreign-host");
  }
  const lines = logLinesWith("-> 403 refused foreign-host").slice(before);
  expect(lines).toHaveLength(2);
  expect(lines[0]).toContain("the request has no Host header");
  expect(lines[1]).toContain(`Host "127.0.0.1:abc" names no loopback host`);
});

test("a body lost to a closed connection is one warn line, not a defect", async () => {
  await abandonedPost(address, ROUTES.mark);
  const lostBody = "the request body was not received";
  for (let turn = 0; turn < 400 && logLinesWith(lostBody).length === 0; turn += 1)
    await Bun.sleep(5);
  expect(logLinesWith(lostBody)).toHaveLength(1);
  expect(logLinesWith(lostBody)[0]).toMatch(
    / server warn POST \/api\/mark -> 400 refused malformed: /,
  );
  expect(runLogLines(folders.workdir).some((line) => line.includes("defect"))).toBe(false);
});

test("the run log holds the start facts in step order, the verdict and each request", async () => {
  const text = "first line\nsecond line\r\nthird line";
  const batch = { run: await runName(), lines: [{ time: Date.now(), level: "warn", text }] };
  expect((await post(ROUTES.log, batch)).status).toBe(200);
  await get("/no-such-route");
  const lines = runLogLines(folders.workdir);
  const has = (part: string): boolean => lines.some((line) => line.includes(part));
  expect(lines[0]).toMatch(/ server info qa-server pid \d+ bun /);
  expect(has(`server info sibling ${folders.sibling}: install found`)).toBe(true);
  expect(has(`server info workdir ${folders.workdir}`)).toBe(true);
  expect(has("server info level qa-fixture 00c0ffee00aa accepted")).toBe(true);
  expect(has(`server info serving ${address}`)).toBe(true);
  expect(has(`GET ${ROUTES.session} -> 200 session facts`)).toBe(true);
  expect(has("GET /no-such-route -> 404 refused not-found")).toBe(true);
  expect(has("page warn first line second line third line")).toBe(true);
  const steps = ["sibling check", "level", "page bundles", "port"].map((step) =>
    lines.findIndex((line) => line.endsWith(` server info start: ${step}`)),
  );
  expect(steps.every((index) => index > 0)).toBe(true);
  expect(steps).toEqual(steps.toSorted((a, b) => a - b));
  expect(misshapenLines(lines)).toEqual([]);
});
