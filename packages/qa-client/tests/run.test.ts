import { expect, test } from "bun:test";
import { ROUTES } from "@level-designer/qa-client/protocol";
import { bootReady, bootTestPage } from "./page-fixture.ts";
import { acceptedSession, FAKE_RUN, ok } from "./protocol-fake.ts";

/** The running page's periodic flush, ms. */
const FLUSH_MS = 5000;

test("a console.error and a console.warn reach the log", async () => {
  const page = await bootReady();
  page.surroundings.console.error("render", new Error("lost texture"));
  page.surroundings.console.warn("slow frame");
  page.timers.advance(FLUSH_MS);
  expect(page.fake.logged("console.error: render Error: lost texture", "error")).toBe(true);
  expect(page.fake.logged("console.warn: slow frame", "warn")).toBe(true);
});

test("the heads-up display shows the level, the hash, the verdict and the mark count", async () => {
  const page = await bootReady();
  page.timers.frames(1);
  const hud = page.text("hud");
  for (const fact of [
    "walk",
    "eye ",
    "feet ",
    "yaw ",
    "60 fps",
    "marks 0",
    "dark-factory",
    "0123456789ab",
    "accepted",
  ]) {
    expect(hud).toContain(fact);
  }
});

test("a rejected level keeps its verdict banner in view", async () => {
  const session = acceptedSession();
  const rejected = {
    ...session,
    build: { ...session.build, verdict: { kind: "rejected" as const, findings: 3 } },
  };
  const page = await bootReady({ session: { ...rejected, build: rejected.build } });
  page.timers.frames(30);
  page.window.press("F3");
  page.window.press("Escape");
  expect(page.text("verdict")).toBe(`rejected: 3 findings; see the run log ${session.runLog}`);
  expect(page.fake.logged("verdict: rejected: 3 findings", "warn")).toBe(true);
});

test("a lost device or a GPU error is shown and stops the drawing", async () => {
  for (const kind of ["device-lost", "gpu-error"] as const) {
    const page = await bootReady();
    page.timers.frames(3);
    const drawn = page.view.frames.length;
    page.view.fail({ kind, message: "reason unknown: the GPU process exited" });
    page.timers.frames(3);
    expect(page.view.frames).toHaveLength(drawn);
    const label = kind === "device-lost" ? "GPU device lost" : "GPU error";
    const text = `${label}: reason unknown: the GPU process exited; drawing stopped`;
    expect(page.text("banner")).toContain(text);
    expect(page.fake.logged(text, "error")).toBe(true);
  }
});

test("a refused mouse capture says to click again, once per click", async () => {
  const page = await bootReady();
  page.document.refusePointerLock = true;
  page.document.element("view").click();
  expect(page.text("status")).toBe("mouse capture refused: click the view again");
  // The browser both fires the error event and rejects the request; the page says it once.
  await Promise.resolve();
  page.timers.advance(FLUSH_MS);
  const refusals = page.fake.lines().filter((line) => line.text.includes("mouse capture refused"));
  expect(refusals.map((line) => line.level)).toEqual(["warn"]);
  page.document.refusePointerLock = false;
  page.document.element("view").click();
  expect(page.document.pointerLockElement).toBe(page.document.element("view"));
});

test("a log batch of another run raises the banner with reload the page", async () => {
  const page = await bootReady({
    arrange: (fake) =>
      fake.script(ROUTES.log, {
        status: 409,
        body: {
          kind: "refused",
          reason: "other-run",
          message: `the body names run "${FAKE_RUN}"; this server runs "qa-later"`,
          logFailure: null,
        },
      }),
  });
  await page.timers.settle(() => page.text("banner") !== "");
  expect(page.text("banner")).toContain("reload the page: the server restarted");
});

test("a run log that cannot be written raises the one banner", async () => {
  const page = await bootReady({
    arrange: (fake) =>
      fake.script(ROUTES.log, ok({ kind: "logged", logFailure: "EACCES: qa.log" })),
  });
  await page.timers.settle(() => page.text("banner") !== "");
  expect(page.text("banner")).toContain("the run log cannot be written: EACCES: qa.log");
});

test("a log batch without an answer raises the banner and names the lost lines", async () => {
  const page = await bootReady();
  page.fake.script(ROUTES.log, "hold");
  page.surroundings.console.error("one more");
  page.timers.advance(15_000);
  await page.timers.settle(() => page.text("banner") !== "");
  expect(page.text("banner")).toMatch(
    /log batch failed: no answer; \d+ page lines are not in the run log/,
  );
});

test("an uncaught error and an unhandled rejection raise the banner with their stack", async () => {
  const page = await bootReady();
  page.window.throwUncaught(new Error("frame state broke"));
  expect(page.text("banner")).toContain("page error: Error: frame state broke");
  page.window.rejectUnhandled(new Error("late promise"));
  expect(page.text("banner")).toContain("unhandled rejection: Error: late promise");
  expect(page.fake.logged("unhandled rejection: Error: late promise", "error")).toBe(true);
  const uncaught = page.fake.lines().find((line) => line.text.startsWith("page error:"));
  expect(uncaught?.level).toBe("error");
  expect(uncaught?.text).toContain("run.test.ts");
});

/** A page whose view start is held open, with a failure fired before the start settles. */
async function failedDuringStart(kind: "device-lost" | "gpu-error"): Promise<{
  page: ReturnType<typeof bootTestPage>;
  text: string;
}> {
  const page = bootTestPage({ view: { kind: "hold" } });
  await page.timers.settle(() => page.view.inputs.length === 1);
  page.view.fail({ kind, message: "reset during compile" });
  const label = kind === "device-lost" ? "GPU device lost" : "GPU error";
  const text = `${label}: reset during compile; drawing stopped`;
  expect(page.text("banner")).toContain(text);
  expect(page.fake.logged(text, "error")).toBe(true);
  return { page, text };
}

test("a failure during the view start shows when the start then resolves started", async () => {
  const { page, text } = await failedDuringStart("device-lost");
  page.view.release();
  await page.booted;
  page.timers.frames(3);
  expect(page.view.frames).toHaveLength(0);
  expect(page.text("banner")).toContain(text);
  expect(page.text("status")).toBe("drawing stopped; see the banner");
});

test("a failure during the view start shows when the start then resolves failed", async () => {
  const { page, text } = await failedDuringStart("gpu-error");
  page.view.release({ kind: "fail", step: "renderer", message: "compile lost its device" });
  await page.booted;
  expect(page.text("banner")).toContain(text);
  expect(page.text("status")).toBe("level view failed: compile lost its device");
});

test("a failure during the view start shows when the start never settles", async () => {
  const { page, text } = await failedDuringStart("device-lost");
  page.timers.advance(60_000);
  expect(page.text("banner")).toContain(text);
  expect(page.text("status")).toBe("boot: level view");
});

test("a frame that throws raises the banner, stops the drawing and the strip says so", async () => {
  const page = await bootReady();
  page.timers.frames(2);
  page.view.breakFrames(new Error("Rapier: unreachable executed"));
  page.timers.frames(3);
  expect(page.text("banner")).toContain(
    "a frame failed; drawing stopped: Error: Rapier: unreachable",
  );
  expect(page.text("status")).toBe("drawing stopped: a frame failed; see the banner");
  expect(page.fake.logged("a frame failed; drawing stopped", "error")).toBe(true);
  expect(page.timers.pendingFrames).toBe(0);
});

test("the banner shows the newest alarm first", async () => {
  const page = await bootReady();
  page.view.fail({ kind: "device-lost", message: "reason unknown: the GPU process exited" });
  page.window.throwUncaught(new Error("second"));
  expect(page.text("banner").indexOf("Error: second")).toBeLessThan(
    page.text("banner").indexOf("GPU device lost"),
  );
});

test("after another run's refusal the page stops posting and keeps one banner line", async () => {
  const page = await bootReady({
    arrange: (fake) =>
      fake.script(ROUTES.log, {
        status: 409,
        body: { kind: "refused", reason: "other-run", message: "run qa-later", logFailure: null },
      }),
  });
  await page.timers.settle(() => page.text("banner") !== "");
  const posts = (): number =>
    page.fake.requests.filter((request) => request.path === ROUTES.log).length;
  const before = posts();
  for (let second = 0; second < 30; second += 5) {
    page.surroundings.console.warn("still here");
    page.timers.advance(5000);
    await Promise.resolve();
  }
  expect(posts()).toBe(before);
  expect(
    page
      .text("banner")
      .split("\n")
      .filter((line) => line.includes("reload the page")),
  ).toHaveLength(1);
});

test("a GPU failure after the start leaves no ready in the status strip", async () => {
  const page = await bootReady();
  page.view.fail({ kind: "gpu-error", message: "Uncaptured validation error: buffer destroyed" });
  expect(page.text("status")).toBe("drawing stopped: GPU error; see the banner");
});

test("a dead run log never pushes a lost device out of the banner, and falls quiet", async () => {
  const page = await bootReady();
  const device = "GPU device lost: reason unknown: the GPU process exited; drawing stopped";
  page.view.fail({ kind: "device-lost", message: "reason unknown: the GPU process exited" });
  page.fake.script(ROUTES.log, "hold");
  const posts = (): number =>
    page.fake.requests.filter((request) => request.path === ROUTES.log).length;
  for (let period = 0; period < 8; period += 1) {
    page.timers.advance(5000);
    await page.timers.settle(() => true);
  }
  page.timers.advance(15_000);
  await page.timers.settle(() => true);
  const quiet = posts();
  for (let period = 0; period < 6; period += 1) {
    page.timers.advance(5000);
    await page.timers.settle(() => true);
  }
  const banner = page.text("banner").split("\n");
  expect(banner).toContain(device);
  expect(banner.filter((line) => line.startsWith("log batch failed"))).toHaveLength(1);
  expect(posts() - quiet).toBeLessThanOrEqual(1);
});

test("the heads-up display shows the loud clear colour, and the pitch the mouse sets", async () => {
  const leak = await bootReady({ search: "?leak=1" });
  leak.timers.frames(1);
  expect(leak.text("hud")).toContain("leak colour");
  const game = await bootReady();
  game.document.element("view").click();
  game.window.moveMouse(0, -100);
  game.timers.frames(1);
  expect(game.text("hud")).not.toContain("leak colour");
  const pitch = /pitch (-?\d+\.\d)/.exec(game.text("hud"))?.[1];
  const set = game.view.frames.at(-1)?.pose.pitch ?? 0;
  expect(set).toBeGreaterThan(0);
  expect(Number(pitch)).toBeCloseTo((set * 180) / Math.PI, 1);
});
