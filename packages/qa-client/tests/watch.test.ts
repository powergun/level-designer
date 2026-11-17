import { expect, test } from "bun:test";
import { bootPage } from "@level-designer/qa-client";
import { ROUTES } from "@level-designer/qa-client/protocol";
import { createTestPage, type TestPage } from "@level-designer/qa-client/testing";
import { levelFiles, pageHtml } from "./page-fixture.ts";
import { watchBoot } from "../src/watch/index.js";
import { ProtocolFake } from "./protocol-fake.ts";

/** The watch's start limit, ms. */
const START_MS = 10_000;

/** A page with only the boot watch running, as when the program never runs. */
function watchedPage(arrange?: (fake: ProtocolFake) => void): {
  page: TestPage;
  fake: ProtocolFake;
} {
  const fake = new ProtocolFake(levelFiles());
  arrange?.(fake);
  const page = createTestPage({ html: pageHtml(), fetch: fake.fetch });
  watchBoot(page.surroundings);
  return { page, fake };
}

test("the watch reports a page program that fails to load", async () => {
  const { page, fake } = watchedPage();
  page.window.failScriptLoad("program");
  const reason = "the page program failed to load: /program.js";
  expect(page.document.visibleText("status")).toBe(reason);
  const { minHeight } = page.document.element("status").style;
  expect(minHeight).toMatch(/^(\d+(\.\d+)?|\.\d+)(em|rem|px)$/);
  expect(Number.parseFloat(minHeight)).toBeGreaterThan(0);
  await page.timers.settle(() => fake.logged(`boot watch: ${reason}`, "error"));
});

test("the watch reports a page program that does not start within 10 s", async () => {
  const { page, fake } = watchedPage();
  page.timers.advance(START_MS - 1);
  expect(fake.requests).toHaveLength(0);
  page.timers.advance(1);
  const reason = "the page program did not start within 10 s";
  expect(page.document.visibleText("status")).toBe(reason);
  await page.timers.settle(() => fake.logged(`boot watch: ${reason}`, "error"));
});

test("the watch says when the run log is out of reach too", async () => {
  const { page } = watchedPage((fake) => fake.script(ROUTES.session, "hold"));
  page.timers.advance(START_MS);
  await page.timers.settle(() => true);
  page.timers.advance(15_000);
  await page.timers.settle(() => page.document.visibleText("status").includes("out of reach"));
  expect(page.document.visibleText("status")).toBe(
    "the page program did not start within 10 s; the run log is out of reach (no answer)",
  );
});

test("a page program that started raises nothing from the watch", async () => {
  const fake = new ProtocolFake(levelFiles());
  const page = createTestPage({ html: pageHtml(), fetch: fake.fetch });
  watchBoot(page.surroundings);
  await bootPage(page.surroundings);
  page.timers.advance(START_MS);
  page.window.throwUncaught(new Error("after the start"));
  expect(fake.logged("boot watch:")).toBe(false);
  expect(page.document.visibleText("status")).not.toContain("page program");
});

test("the watch reports an error and a rejection of the program before the start", async () => {
  const thrown = watchedPage();
  thrown.page.window.throwUncaught(new SyntaxError("Unexpected token '?'"));
  const error = "the page program failed to start: Unexpected token '?'";
  expect(thrown.page.document.visibleText("status")).toBe(error);
  await thrown.page.timers.settle(() => thrown.fake.logged(`boot watch: ${error}`, "error"));

  const rejected = watchedPage();
  rejected.page.window.rejectUnhandled(new Error("RuntimeError: Aborted(CompileError)"));
  const rejection = "the page program failed to start: RuntimeError: Aborted(CompileError)";
  expect(rejected.page.document.visibleText("status")).toBe(rejection);
  await rejected.page.timers.settle(() =>
    rejected.fake.logged(`boot watch: ${rejection}`, "error"),
  );
});

test("the watch reports a page document without a region, through the real bootPage", async () => {
  const fake = new ProtocolFake(levelFiles());
  const html = pageHtml().replace('<div id="hud"></div>', "");
  const page = createTestPage({ html, fetch: fake.fetch });
  watchBoot(page.surroundings);
  // The browser turns the rejected boot into an unhandled rejection.
  await bootPage(page.surroundings).catch((reason: unknown) => page.window.rejectUnhandled(reason));
  const reason = 'the page program failed to start: the page document has no element with id "hud"';
  expect(page.document.visibleText("status")).toBe(reason);
  await page.timers.settle(() => fake.logged(`boot watch: ${reason}`, "error"));
});
