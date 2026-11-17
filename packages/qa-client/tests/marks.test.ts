import { expect, test } from "bun:test";
import { MAX_COMMENT, ROUTES } from "@level-designer/qa-client/protocol";
import { type BootedPage, bootReady } from "./page-fixture.ts";
import { FAKE_RUN, ok } from "./protocol-fake.ts";

/** Open the box with `key`, type `comment` and press Enter. */
function mark(page: BootedPage, comment: string, key = "F3"): void {
  page.window.press(key);
  page.document.element("mark-text").value = comment;
  page.window.press("Enter");
}

/** Whether the comment box is in view. */
function boxOpen(page: BootedPage): boolean {
  return !page.document.element("mark").hidden;
}

/** Wait until the status strip leaves `saving mark`. */
async function outcome(page: BootedPage): Promise<string> {
  await page.timers.settle(() => page.text("status") !== "saving mark");
  return page.text("status");
}

test("F3 and M open the comment box with the captured pose", async () => {
  for (const key of ["F3", "KeyM"]) {
    const page = await bootReady();
    page.document.element("view").click();
    page.timers.frames(2);
    const event = page.window.press(key);
    expect(event.defaultPrevented).toBe(true);
    expect(boxOpen(page)).toBe(true);
    expect(page.document.pointerLockElement).toBeNull();
    expect(page.document.element("mark-text").focused).toBe(true);
    expect(page.document.element("mark-text").maxLength).toBe(MAX_COMMENT);
    expect(page.text("mark-pose")).toMatch(/^walk eye .+ feet .+ yaw 0 pitch 0$/);
  }
});

test("Enter shows saving mark, then the number and the path, and sends run, pose and comment", async () => {
  const page = await bootReady();
  page.timers.frames(2);
  page.window.press("F3");
  page.document.element("mark-text").value = "  gap too narrow\nhere ";
  page.window.press("Enter");
  expect(page.text("status")).toBe("saving mark");
  expect(await outcome(page)).toBe("mark 1 saved to /work/qa/marks.log");
  expect(boxOpen(page)).toBe(false);
  const [body] = page.fake.markBodies();
  expect(body?.run).toBe(FAKE_RUN);
  expect(body?.mode).toBe("walk");
  expect(body?.feet).not.toBeNull();
  expect(body?.comment).toBe("gap too narrow here");
  const pose = page.view.frames.at(-1)?.pose;
  expect<unknown>(body?.eye).toEqual(pose?.eye.map((value) => Math.round(value * 1000) / 1000));
  expect(page.fake.logged("mark start: walk eye")).toBe(true);
  expect(page.fake.logged("status: mark 1 saved to /work/qa/marks.log")).toBe(true);
  page.timers.frames(1);
  expect(page.text("hud")).toContain("marks 1");
});

test("movement stops while the box is open", async () => {
  const page = await bootReady();
  page.window.press("F3");
  page.window.press("KeyW");
  page.timers.frames(30);
  const eyes = page.view.frames.map((frame) => frame.pose.eye[2]);
  expect(Math.max(...eyes) - Math.min(...eyes)).toBeLessThan(0.01);
});

test("Esc cancels the mark and sends nothing", async () => {
  const page = await bootReady();
  page.window.press("F3");
  page.window.press("Escape");
  expect(boxOpen(page)).toBe(false);
  expect(page.text("status")).toBe("mark cancelled");
  expect(page.fake.markBodies()).toHaveLength(0);
});

test("an empty comment is blocked with a message and sends nothing", async () => {
  const page = await bootReady();
  mark(page, "   ");
  expect(page.text("status")).toBe("mark blocked: the comment is empty");
  expect(boxOpen(page)).toBe(true);
  expect(page.fake.markBodies()).toHaveLength(0);
  page.timers.advance(5000);
  expect(page.fake.logged("mark blocked: the comment is empty", "warn")).toBe(true);
});

test("a mark of another run shows reload the page and keeps the comment", async () => {
  const page = await bootReady({
    arrange: (fake) =>
      fake.script(ROUTES.mark, {
        status: 409,
        body: { kind: "refused", reason: "other-run", message: "run qa-later", logFailure: null },
      }),
  });
  mark(page, "seal leaks");
  const text = await outcome(page);
  expect(text).toBe("mark failed: reload the page: the server restarted (run qa-later)");
  expect(boxOpen(page)).toBe(true);
  expect(page.document.element("mark-text").value).toBe("seal leaks");
  expect(page.fake.logged(text, "error")).toBe(true);
});

test("a failed save, a refusal and no answer each keep the box and its text", async () => {
  const scripts = [
    {
      script: ok({ kind: "failed", message: "EACCES: marks.log", logFailure: null }),
      text: "mark failed: EACCES: marks.log",
    },
    {
      script: {
        status: 400,
        body: {
          kind: "refused",
          reason: "comment-too-long",
          message: "too long",
          logFailure: null,
        },
      },
      text: "mark failed: too long",
    },
    { script: "hold" as const, text: "mark failed: no answer" },
  ];
  for (const { script, text } of scripts) {
    const page = await bootReady({ arrange: (fake) => fake.script(ROUTES.mark, script) });
    mark(page, "crane clips the truss");
    // Only the held answer needs the timeout; the others answer before any time passes.
    if (script === "hold") page.timers.advance(15_000);
    expect(await outcome(page)).toBe(text);
    expect(boxOpen(page)).toBe(true);
    expect(page.document.element("mark-text").value).toBe("crane clips the truss");
    expect(page.fake.logged(text, "error")).toBe(true);
    // The box stays usable: Esc now cancels it.
    page.window.press("Escape");
    expect(page.text("status")).toBe("mark cancelled");
  }
});

test("a second Enter while saving sends nothing more", async () => {
  const page = await bootReady({ arrange: (fake) => fake.script(ROUTES.mark, "hold") });
  mark(page, "one");
  page.window.press("Enter");
  page.window.press("Escape");
  expect(page.text("status")).toBe("saving mark");
  expect(page.fake.markBodies()).toHaveLength(1);
});

test("the box states the comment cap and says when the text reaches it", async () => {
  const page = await bootReady();
  page.window.press("F3");
  expect(page.text("mark-hint")).toContain(`at most ${MAX_COMMENT} characters`);
  const field = page.document.element("mark-text");
  field.type("x".repeat(MAX_COMMENT - 1));
  expect(page.text("mark-hint")).not.toContain("reached");
  field.type("x".repeat(MAX_COMMENT));
  expect(page.text("mark-hint")).toBe(
    `The comment has reached its cap of ${MAX_COMMENT} characters; text beyond it was not taken.`,
  );
  page.timers.advance(5000);
  expect(page.fake.logged("mark: The comment has reached its cap", "warn")).toBe(true);
  field.type("short again");
  expect(page.text("mark-hint")).toContain(`at most ${MAX_COMMENT} characters`);
});

test("every mark outcome is posted at once: a cancel, a block and a save", async () => {
  const page = await bootReady();
  const posted = (text: string): boolean => page.fake.logged(text);
  page.window.press("F3");
  page.window.press("Escape");
  expect(posted("status: mark cancelled")).toBe(true);
  mark(page, " ");
  expect(posted("status: mark blocked: the comment is empty")).toBe(true);
  page.document.element("mark-text").value = "seal gap";
  page.window.press("Enter");
  await outcome(page);
  expect(posted("status: mark 1 saved to /work/qa/marks.log")).toBe(true);
});

test("F3 inside the open box is prevented and keeps the box", async () => {
  const page = await bootReady();
  page.window.press("F3");
  expect(page.window.press("F3").defaultPrevented).toBe(true);
  expect(boxOpen(page)).toBe(true);
});

test("a fly mark sends mode fly with null feet", async () => {
  const page = await bootReady();
  page.window.press("KeyV");
  page.timers.frames(2);
  mark(page, "seam above the door");
  expect(await outcome(page)).toBe("mark 1 saved to /work/qa/marks.log");
  const [body] = page.fake.markBodies();
  expect(body?.mode).toBe("fly");
  expect(body?.feet).toBeNull();
});
