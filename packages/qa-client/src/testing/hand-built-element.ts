import type { PageCanvas, PageTextArea } from "../surroundings/index.js";

/**
 * One element of the hand-built document: every member a region port names, whatever its tag,
 * so a test reads any region the same way. A pointer-lock request goes to the document. The
 * inline style also keeps `height` and `overflow`, so a test sees whether a script clips.
 */
export class HandBuiltElement implements PageCanvas, PageTextArea {
  textContent: string | null = "";
  value = "";
  maxLength = -1;
  /** Whether the page focused this element last. */
  focused = false;
  readonly style = { minHeight: "", height: "", overflow: "" };
  readonly dataset: Record<string, string | undefined> = {};
  private readonly listeners = new Map<string, (() => void)[]>();

  /** An element of `tagName` (upper case, as the DOM reports it), hidden or shown. */
  constructor(
    readonly tagName: string,
    public hidden: boolean,
    private readonly lockRequest: (element: HandBuiltElement) => unknown,
  ) {}

  /** Ask the document for the pointer lock on this element. */
  requestPointerLock(): unknown {
    return this.lockRequest(this);
  }

  /** Register a listener of a click or of an edit. */
  addEventListener(type: "click" | "input", listener: () => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  /** Give this element the focus. */
  focus(): void {
    this.focused = true;
  }

  /** Fire a click on this element, as the human's click does. */
  click(): void {
    this.fire("click");
  }

  /** Replace the field's text, as typing or a paste does, and fire the edit. */
  type(value: string): void {
    this.value = value;
    this.fire("input");
  }

  /** Call the listeners of one event type. */
  private fire(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}
