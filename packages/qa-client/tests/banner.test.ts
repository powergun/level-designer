import { expect, test } from "bun:test";
import { bootPage, type PageFetch } from "@level-designer/qa-client";
import { ROUTES } from "@level-designer/qa-client/protocol";
import { createTestPage } from "@level-designer/qa-client/testing";
import { bootReady, bootTestPage, levelFiles, pageHtml } from "./page-fixture.ts";
import { acceptedSession, type FakeScript, ok, ProtocolFake } from "./protocol-fake.ts";

/** The running page's periodic flush, ms. */
const FLUSH_MS = 5000;

/** The console alarm's banner line of a page joined to `runLog`. */
function consoleAlarm(runLog: string): string {
  return `a console error: programs may have failed and props may be missing; see the run log ${runLog}`;
}

/** The banner lines of a page that hold `text`. */
function bannerLines(page: { text(id: string): string }, text: string): string[] {
  return page
    .text("banner")
    .split("\n")
    .filter((line) => line.includes(text));
}

test("a console error raises one banner that names the run log; each error is in a batch", async () => {
  const page = await bootReady();
  const alarm = consoleAlarm(acceptedSession().runLog);
  page.surroundings.console.warn("slow frame");
  expect(page.text("banner")).toBe("");
  page.surroundings.console.error("THREE.WebGPURenderer: pipeline creation failed");
  expect(bannerLines(page, "props may be missing")).toEqual([alarm]);
  expect(page.fake.logged("console.error: THREE.WebGPURenderer: pipeline creation", "error")).toBe(
    true,
  );
  expect(page.fake.logged(alarm, "error")).toBe(true);
  page.surroundings.console.error("a second failure");
  expect(bannerLines(page, "props may be missing")).toEqual([alarm]);
  expect(page.fake.logged("console.error: a second failure", "error")).toBe(true);
  expect(page.fake.lines().filter((line) => line.text === alarm)).toHaveLength(1);
});

test("a console error while the view compiles raises its banner beside a lost device", async () => {
  const page = bootTestPage({ view: { kind: "hold" } });
  await page.timers.settle(() => page.view.inputs.length === 1);
  page.surroundings.console.error("pipeline creation failed");
  page.view.fail({ kind: "device-lost", message: "reset during compile" });
  page.window.throwUncaught(new Error("third"));
  const alarm = consoleAlarm(acceptedSession().runLog);
  expect(bannerLines(page, "props may be missing")).toEqual([alarm]);
  expect(page.text("banner")).toContain("drawing stopped: GPU device lost: reset during compile");
  expect(page.text("banner")).toContain("page error: Error: third");
  expect(page.text("status")).toBe("boot: level view");
});

/** A page whose first console error comes while it asks for the session facts, before the run. */
function bootWithEarlyError(session: FakeScript = ok(acceptedSession())): {
  page: ReturnType<typeof createTestPage>;
  fake: ProtocolFake;
  booted: Promise<void>;
} {
  const fake = new ProtocolFake(levelFiles());
  fake.script(ROUTES.session, session);
  const fetch: PageFetch = (path, init) => {
    if (path === ROUTES.session) page.surroundings.console.error("early module output");
    return fake.fetch(path, init);
  };
  const page = createTestPage({ html: pageHtml(), fetch });
  return { page, fake, booted: bootPage(page.surroundings) };
}

test("a console error before the run gains the run log's path at the join, logged once", async () => {
  const { page, fake, booted } = bootWithEarlyError();
  expect(page.document.visibleText("banner")).toBe(
    "a console error: programs may have failed and props may be missing; see the run log",
  );
  await booted;
  expect(page.document.visibleText("status")).toStartWith("ready");
  const alarm = consoleAlarm(acceptedSession().runLog);
  expect(
    bannerLines({ text: (id) => page.document.visibleText(id) }, "props may be missing"),
  ).toEqual([alarm]);
  page.surroundings.console.error("later");
  page.timers.advance(FLUSH_MS);
  expect(fake.logged("console.error: early module output", "error")).toBe(true);
  expect(fake.logged("console.error: later", "error")).toBe(true);
  const alarmLines = fake.lines().filter((line) => line.text.includes("props may be missing"));
  expect(alarmLines).toHaveLength(1);
});

test("after a failed session step the console alarm says the lines are not in the run log", async () => {
  const { page, booted } = bootWithEarlyError({ status: 500, body: "down" });
  await booted;
  const unlogged =
    "a console error: programs may have failed and props may be missing; the page's lines are not in the run log";
  expect(page.document.visibleText("banner")).toBe(unlogged);
  expect(page.document.visibleText("status")).toEndWith(
    "; the page's lines are not in the run log",
  );
  page.surroundings.console.error("after the failure");
  expect(page.document.visibleText("banner")).toBe(unlogged);
});

test("the banner keeps the first line of every alarm kind in view, the run log the rest", async () => {
  const page = await bootReady();
  page.surroundings.console.error("pipeline creation failed");
  page.view.fail({ kind: "device-lost", message: `${"x".repeat(1000)}\nsecond line` });
  page.fake.script(ROUTES.log, ok({ kind: "logged", logFailure: "EACCES: qa.log" }));
  page.window.throwUncaught(new Error("frame state broke"));
  await page.timers.settle(() => page.text("banner").includes("cannot be written"));
  const lines = page.text("banner").split("\n");
  expect(lines).toHaveLength(4);
  expect(lines).toContain(consoleAlarm(acceptedSession().runLog));
  expect(lines).toContain("page error: Error: frame state broke");
  expect(lines.every((line) => line.length <= 240)).toBe(true);
  expect(
    lines.some(
      (line) => line.startsWith("drawing stopped: GPU device lost: xxx") && line.endsWith("..."),
    ),
  ).toBe(true);
  const uncaught = page.fake.lines().find((line) => line.text.startsWith("page error:"));
  expect(uncaught?.text).toContain("banner.test.ts");
});

test("after another run's refusal the console alarm says the lines are not in the run log", async () => {
  const page = await bootReady();
  page.surroundings.console.error("pipeline creation failed");
  expect(bannerLines(page, "props may be missing")).toEqual([
    consoleAlarm(acceptedSession().runLog),
  ]);
  page.fake.script(ROUTES.log, {
    status: 409,
    body: { kind: "refused", reason: "other-run", message: "run qa-later", logFailure: null },
  });
  page.surroundings.console.error("refused batch");
  await page.timers.settle(() => page.text("banner").includes("reload the page"));
  const unlogged =
    "a console error: programs may have failed and props may be missing; the page's lines are not in the run log";
  expect(bannerLines(page, "props may be missing")).toEqual([unlogged]);
  page.surroundings.console.error("after the refusal");
  expect(bannerLines(page, "props may be missing")).toEqual([unlogged]);
});

test("a multi-line GPU error's banner line begins with the stopped drawing", async () => {
  const page = await bootReady();
  const message = [
    "Error while parsing WGSL: :12:5 error: unresolved identifier 'slabWear'",
    "    let wear = slabWear * 0.5;",
    "               ^^^^^^^^",
    " - While validating [ShaderModuleDescriptor]",
  ].join("\n");
  page.view.fail({ kind: "gpu-error", message });
  expect(page.text("banner")).toBe(
    "drawing stopped: GPU error: Error while parsing WGSL: :12:5 error: unresolved identifier 'slabWear'",
  );
  expect(page.text("status")).toBe("drawing stopped: GPU error; see the banner");
  expect(page.fake.logged("^^^^^^^^", "error")).toBe(true);
});
