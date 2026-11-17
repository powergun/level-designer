import { expect, test } from "bun:test";
import { PAGE_FILES } from "@level-designer/qa-client/protocol";
import { createTestPage } from "@level-designer/qa-client/testing";
import { pageHtml } from "./page-fixture.ts";

test("the page document references exactly the routes of the page files", () => {
  const html = pageHtml();
  const referenced = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    // The empty icon is inline, so the browser asks the server for no favicon.
    .filter((reference) => reference !== "data:,")
    .toSorted();
  const routes = [
    PAGE_FILES.style.route,
    PAGE_FILES.watch.route,
    PAGE_FILES.program.route,
  ].toSorted();
  expect(referenced).toEqual(routes);
  // The watch's script tag comes first, so it runs before the program and catches its failure.
  expect(html.indexOf(PAGE_FILES.watch.route)).toBeLessThan(html.indexOf(PAGE_FILES.program.route));
});

test("the page document's boxes start hidden and its regions carry the page's tags", () => {
  const { document } = createTestPage({
    html: pageHtml(),
    fetch: () => new Promise(() => undefined),
  });
  for (const id of ["mark", "banner", "verdict", "errors"])
    expect(document.element(id).hidden).toBe(true);
  expect(document.element("view").tagName).toBe("CANVAS");
  expect(document.element("mark-text").tagName).toBe("TEXTAREA");
  expect(document.element("program").tagName).toBe("SCRIPT");
});

test("the regions stack in one column: the top regions, the comment box, then the status strip", () => {
  const { document } = createTestPage({
    html: pageHtml(),
    fetch: () => new Promise(() => undefined),
  });
  const regions = ["hud", "verdict", "banner", "errors", "mark", "status"];
  const order = document.ids().filter((id) => regions.includes(id));
  expect(order).toEqual(regions);
  expect(document.element("overlay").tagName).toBe("DIV");
});

/** The declarations of the stylesheet rule whose selector is exactly `selector`. */
function rule(css: string, selector: string): string {
  const start = css.indexOf(`\n${selector} {`);
  if (start < 0) throw new Error(`page.css has no rule for ${selector}`);
  return css.slice(start, css.indexOf("}", start));
}

test("the status strip, the banner and the error list are bounded and scroll", async () => {
  const css = await Bun.file(new URL("../page/page.css", import.meta.url)).text();
  for (const selector of ["#status", "#banner", "#errors"]) {
    const declarations = rule(css, selector);
    expect(declarations).toMatch(/max-height: \d+vh;/);
    expect(declarations).toContain("overflow-y: auto;");
  }
});
