import type { PageCanvas, PageDocument, PageElement, PageTextArea } from "./ports.js";

/** The ids of the page document's regions and of the page program's script tag. */
export const REGION_IDS = {
  canvas: "view",
  hud: "hud",
  status: "status",
  banner: "banner",
  verdict: "verdict",
  errors: "errors",
  markBox: "mark",
  markPose: "mark-pose",
  markText: "mark-text",
  markHint: "mark-hint",
  programScript: "program",
} as const;

/** The page's regions, each narrowed once by its tag. */
export interface Regions {
  readonly canvas: PageCanvas & HTMLCanvasElement;
  readonly hud: PageElement;
  readonly status: PageElement;
  readonly banner: PageElement;
  readonly verdict: PageElement;
  readonly errors: PageElement;
  readonly markBox: PageElement;
  readonly markPose: PageElement;
  readonly markText: PageTextArea;
  readonly markHint: PageElement;
}

/**
 * The inline minimum height of the heads-up display and the status strip: they never collapse,
 * and they grow with their text, so no message is cut.
 */
export const REGION_MIN_HEIGHT = "1.6em";

/**
 * Whether the element is the canvas, by its tag. In the browser a `CANVAS` element is an
 * `HTMLCanvasElement`, the type `level-view` draws on; a test's hand-built element is used
 * through the port's members only.
 */
function isCanvas(element: PageElement): element is PageCanvas & HTMLCanvasElement {
  return element.tagName.toUpperCase() === "CANVAS";
}

/** Whether the element is a textarea. */
function isTextArea(element: PageElement): element is PageTextArea {
  return element.tagName.toUpperCase() === "TEXTAREA";
}

/** The element of `id`; a document without it is a defect of the page files. */
function regionAt(document: PageDocument, id: string): PageElement {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`the page document has no element with id "${id}"`);
  return element;
}

/** The status strip alone, or null: the boot watch writes there when it can. */
export function statusRegion(document: PageDocument): PageElement | null {
  return document.getElementById(REGION_IDS.status);
}

/** Read every region of the page document; a missing or mistagged region throws. */
export function readRegions(document: PageDocument): Regions {
  const canvas = regionAt(document, REGION_IDS.canvas);
  if (!isCanvas(canvas)) throw new Error(`the element "${REGION_IDS.canvas}" is no canvas`);
  const markText = regionAt(document, REGION_IDS.markText);
  if (!isTextArea(markText)) throw new Error(`the element "${REGION_IDS.markText}" is no textarea`);
  return {
    canvas,
    hud: regionAt(document, REGION_IDS.hud),
    status: regionAt(document, REGION_IDS.status),
    banner: regionAt(document, REGION_IDS.banner),
    verdict: regionAt(document, REGION_IDS.verdict),
    errors: regionAt(document, REGION_IDS.errors),
    markBox: regionAt(document, REGION_IDS.markBox),
    markPose: regionAt(document, REGION_IDS.markPose),
    markHint: regionAt(document, REGION_IDS.markHint),
    markText,
  };
}
