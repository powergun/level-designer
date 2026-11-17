import { expect, test } from "bun:test";
import { LEVEL_FILES, levelFileRoute, ROUTES } from "@level-designer/qa-client/protocol";
import { WEBGPU_REQUIREMENT } from "@level-designer/level-view";
import { bootPage } from "@level-designer/qa-client";
import { createTestPage } from "@level-designer/qa-client/testing";
import { bootReady, bootTestPage, levelFiles, pageHtml } from "./page-fixture.ts";
import { acceptedSession, ok, ProtocolFake } from "./protocol-fake.ts";

/** A CSS length with a unit, such as `1.6em`; a bare `0` or `0px` does not match a positive one. */
const POSITIVE_LENGTH = /^(\d+(\.\d+)?|\.\d+)(em|rem|px)$/;

/** The request timeout of the page, ms. */
const TIMEOUT_MS = 15_000;

/** The status strip's text. */
function status(page: { text(id: string): string }): string {
  return page.text("status");
}

test("the status strip names the running step", async () => {
  const session = bootTestPage({ arrange: (fake) => fake.script(ROUTES.session, "hold") });
  await session.timers.settle(() => session.fake.requests.length > 0);
  expect(status(session)).toBe("boot: session facts");

  const gpu = bootTestPage({ gpu: { requestAdapter: () => new Promise(() => undefined) } });
  await gpu.timers.settle(() => status(gpu) === "boot: WebGPU probe");

  const files = bootTestPage({
    arrange: (fake) => fake.script(levelFileRoute(LEVEL_FILES.glb), "hold"),
  });
  await files.timers.settle(() => status(files) === "boot: level files");
});

test("both regions carry an inline minimum height and nothing that clips them", async () => {
  const page = await bootReady();
  for (const id of ["hud", "status"]) {
    const { style } = page.document.element(id);
    expect(style.minHeight).toMatch(POSITIVE_LENGTH);
    expect(Number.parseFloat(style.minHeight)).toBeGreaterThan(0);
    expect(style.height).toBe("");
    expect(style.overflow).toBe("");
  }
});

test("a request that never answers ends in failed: no answer on the timer", async () => {
  const session = bootTestPage({ arrange: (fake) => fake.script(ROUTES.session, "hold") });
  await session.timers.settle(() => session.fake.requests.length > 0);
  session.timers.advance(TIMEOUT_MS - 1);
  expect(status(session)).toBe("boot: session facts");
  session.timers.advance(1);
  await session.booted;
  expect(status(session)).toBe(
    "session facts failed: no answer; the page's lines are not in the run log",
  );

  // Once the run is known, the failure is also in a batch, sent at once.
  const glb = levelFileRoute(LEVEL_FILES.glb);
  const file = bootTestPage({ arrange: (fake) => fake.script(glb, "hold") });
  await file.timers.settle(() => file.fake.requests.some((request) => request.path === glb));
  file.timers.advance(TIMEOUT_MS);
  await file.booted;
  const message = `level file ${LEVEL_FILES.glb} failed: no answer`;
  expect(status(file)).toBe(message);
  expect(file.fake.logged(message, "error")).toBe(true);
});

test("the log batch is flushed before each step and on an error", async () => {
  const page = await bootReady();
  const { requests } = page.fake;
  const batchWith = (text: string): number =>
    requests.findIndex(
      (request) => request.path === ROUTES.log && JSON.stringify(request.body).includes(text),
    );
  const firstFile = requests.findIndex((request) => request.path.startsWith(ROUTES.levelPrefix));
  const levelFilesBatch = batchWith("boot step level files: start");
  expect(levelFilesBatch).toBeGreaterThan(-1);
  expect(levelFilesBatch).toBeLessThan(firstFile);
  for (const step of ["WebGPU probe", "level view", "walk world", "input", "frame loop"]) {
    expect(batchWith(`boot step ${step}: start`)).toBeGreaterThan(-1);
  }
  // An error line goes out at once, without waiting for the 5 s flush.
  const before = requests.length;
  page.surroundings.console.error("broken");
  expect(requests.length).toBe(before + 1);
  expect(page.fake.logged("console.error: broken", "error")).toBe(true);
});

test("?leak=1 selects the loud clear colour", async () => {
  const leak = await bootReady({ search: "?leak=1" });
  expect(leak.view.inputs.map((input) => input.clearColor)).toEqual(["leak"]);
  const game = await bootReady();
  expect(game.view.inputs.map((input) => input.clearColor)).toEqual(["game"]);
});

test("a blocked build lists each error with its rule and path and ends the boot", async () => {
  const errors = [
    { rule: "shape", path: "props[0].at", message: "props[0].at: expected a list, got 3" },
    { rule: "kind", path: "props[1].kind", message: 'props[1].kind: unknown kind "x"' },
  ];
  const session = { ...acceptedSession(), build: { kind: "blocked" as const, errors } };
  const page = bootTestPage({ session });
  await page.booted;
  expect(page.text("errors").split("\n")).toEqual([
    `shape props[0].at: ${errors[0]?.message}`,
    `kind props[1].kind: ${errors[1]?.message}`,
  ]);
  expect(status(page)).toContain("build blocked: 2 errors");
  expect(page.fake.logged("build blocked: 2 errors", "error")).toBe(true);
  expect(page.fake.logged("build error: kind props[1].kind")).toBe(true);
  expect(page.fake.requests.some((request) => request.path.startsWith(ROUTES.levelPrefix))).toBe(
    false,
  );
});

test("an answer that is not session facts is named", async () => {
  const page = bootTestPage({ arrange: (fake) => fake.script(ROUTES.session, ok({ run: 1 })) });
  await page.booted;
  expect(status(page)).toContain("session facts failed: the server's answer is not session facts");
  expect(status(page)).toEndWith("; the page's lines are not in the run log");
});

test("no WebGPU names the requirement, for each way the probe finds none", async () => {
  const cases = [
    { gpu: "none" as const, reason: "this browser has no navigator.gpu" },
    { gpu: { requestAdapter: () => Promise.resolve(null) }, reason: "no WebGPU adapter" },
    { gpu: { requestAdapter: () => Promise.reject(new Error("denied")) }, reason: "denied" },
  ];
  for (const { gpu, reason } of cases) {
    const page = bootTestPage({ gpu });
    await page.booted;
    expect(status(page)).toStartWith(`${WEBGPU_REQUIREMENT} (`);
    expect(status(page)).toContain(reason);
    expect(page.fake.logged(reason, "error")).toBe(true);
    expect(page.view.inputs).toHaveLength(0);
  }
});

test("the probe logs the adapter it found", async () => {
  const page = await bootReady();
  expect(page.fake.logged("WebGPU adapter: test / scripted / none / scripted adapter")).toBe(true);
});

test("a renderer that fell back to WebGL is refused with the requirement", async () => {
  const message = `${WEBGPU_REQUIREMENT} (the renderer fell back to WebGL 2)`;
  const page = bootTestPage({ view: { kind: "refuse", message } });
  await page.booted;
  expect(status(page)).toBe(message);
  expect(page.fake.logged(message, "error")).toBe(true);
});

test("a level file that fails to load or decode is named with the reason", async () => {
  const missing = bootTestPage({
    arrange: (fake) =>
      fake.script(levelFileRoute(LEVEL_FILES.level), {
        status: 404,
        body: {
          kind: "refused",
          reason: "no-level",
          message: "the build is blocked",
          logFailure: null,
        },
      }),
  });
  await missing.booted;
  const notFound = `level file ${LEVEL_FILES.level} failed: HTTP 404: the build is blocked`;
  expect(status(missing)).toBe(notFound);
  expect(missing.fake.logged(notFound, "error")).toBe(true);

  const level = bootTestPage({ files: levelFiles("{}") });
  await level.booted;
  expect(status(level)).toStartWith(`level file ${LEVEL_FILES.level} failed: it does not decode: `);

  const prepared = bootTestPage({
    files: { ...levelFiles(), [LEVEL_FILES.prepared]: new TextEncoder().encode("[]") },
  });
  await prepared.booted;
  expect(status(prepared)).toStartWith(
    `level file ${LEVEL_FILES.prepared} failed: it does not decode: `,
  );
  expect(prepared.fake.logged(`level file ${LEVEL_FILES.prepared} failed`, "error")).toBe(true);
});

test("a GLB that does not load and a renderer start failure show the error text", async () => {
  const glb = bootTestPage({ view: { kind: "fail", step: "glb", message: "bad magic" } });
  await glb.booted;
  expect(status(glb)).toBe(`level file ${LEVEL_FILES.glb} failed: bad magic`);
  expect(glb.fake.logged("bad magic", "error")).toBe(true);

  const shader = bootTestPage({ view: { kind: "fail", step: "renderer", message: "WGSL error" } });
  await shader.booted;
  expect(status(shader)).toBe("level view failed: WGSL error");
  expect(shader.fake.logged("level view failed: WGSL error", "error")).toBe(true);
});

test("lines written while a step stalls reach a batch within 5 s, and after a failed boot too", async () => {
  const held = bootTestPage({ view: { kind: "hold" } });
  await held.timers.settle(() => held.view.inputs.length === 1);
  held.surroundings.console.warn("THREE.WebGPURenderer: texture format unsupported");
  held.timers.advance(5000);
  expect(
    held.fake.logged("console.warn: THREE.WebGPURenderer: texture format unsupported", "warn"),
  ).toBe(true);
  expect(held.fake.logged("level view: clear colour game")).toBe(true);

  const ended = bootTestPage({ gpu: "none" });
  await ended.booted;
  ended.surroundings.console.warn("late warning");
  ended.timers.advance(5000);
  expect(ended.fake.logged("console.warn: late warning", "warn")).toBe(true);
});

test("a stalled step has its start line in a batch while the strip names it", async () => {
  const page = bootTestPage({ startPhysics: () => new Promise(() => undefined) });
  await page.timers.settle(() => page.fake.logged("boot step walk world: start"));
  page.timers.advance(60_000);
  expect(status(page)).toBe("boot: walk world");
  expect(page.view.frames).toHaveLength(0);
});

test("a boot step that throws shows its failure and logs the stack", async () => {
  const fake = new ProtocolFake(levelFiles());
  const page = createTestPage({ html: pageHtml(), fetch: fake.fetch });
  const surroundings = {
    ...page.surroundings,
    startView: () => Promise.reject(new TypeError("GPUDevice.createBuffer is not a function")),
  };
  await bootPage(surroundings);
  const message = "level view failed: GPUDevice.createBuffer is not a function";
  expect(page.document.visibleText("status")).toBe(message);
  expect(fake.logged(message, "error")).toBe(true);
  expect(fake.logged("boot step level view: TypeError: GPUDevice.createBuffer", "warn")).toBe(true);
});

test("an adapter that gives no info is an available adapter without a description", async () => {
  const page = await bootReady({ gpu: { requestAdapter: () => Promise.resolve({}) } });
  expect(page.fake.logged("WebGPU adapter: an adapter that gives no description")).toBe(true);
  expect(page.view.inputs).toHaveLength(1);
});
