import { readWorldTriangles } from "@level-designer/level-glb";
import { encodePng } from "../raster/index.js";
import type { Sheets, SnapshotInput } from "./input.js";
import { planSheet } from "./plan.js";
import { sectionSheet } from "./section.js";
import { customSheet, viewSheet } from "./views.js";

/**
 * Draw a level GLB as stored into the plan, section and view sheets, and the custom sheet when
 * the input names a custom view, each as PNG bytes. It reads and writes no file.
 */
export function renderSheets(glb: Uint8Array, input: SnapshotInput): Sheets {
  const triangles = readWorldTriangles(glb);
  const sheets: Sheets = {
    plan: encodePng(planSheet(triangles, input)),
    section: encodePng(sectionSheet(triangles, input)),
    view: encodePng(viewSheet(triangles, input)),
  };
  if (input.custom === undefined) return sheets;
  return { ...sheets, custom: encodePng(customSheet(triangles, input, input.custom)) };
}
