import type { PageDocument } from "../surroundings/index.js";
import { HandBuiltElement } from "./hand-built-element.js";

/** An opening tag with its attribute text. */
const OPENING_TAG = /<([a-zA-Z][\w-]*)\b([^>]*)>/g;

/** An `id` attribute in double quotes. */
const ID_ATTRIBUTE = /\bid="([^"]+)"/;

/** A bare or valued `hidden` attribute. */
const HIDDEN_ATTRIBUTE = /(?:^|\s)hidden(?:\s|=|$)/;

/**
 * The hand-built document: every element of a page document's text that carries an id, with
 * its tag and its `hidden` attribute, so a test boots on the regions of the real page document.
 * It also owns the pointer lock, which a test grants or refuses.
 */
export class HandBuiltDocument implements PageDocument {
  readonly body: { textContent: string | null } = { textContent: "" };
  pointerLockElement: HandBuiltElement | null = null;
  /** Whether a pointer-lock request is refused, as a browser does after a recent release. */
  refusePointerLock = false;
  private readonly elements = new Map<string, HandBuiltElement>();
  private readonly listeners = new Map<string, (() => void)[]>();

  /** Read the elements with an id from the page document's text. */
  constructor(html: string) {
    for (const match of html.matchAll(OPENING_TAG)) {
      const attributes = match[2] ?? "";
      const id = ID_ATTRIBUTE.exec(attributes)?.[1];
      if (id === undefined) continue;
      const tag = (match[1] ?? "").toUpperCase();
      const hidden = HIDDEN_ATTRIBUTE.test(attributes.replace(ID_ATTRIBUTE, ""));
      this.elements.set(id, new HandBuiltElement(tag, hidden, (element) => this.lock(element)));
    }
  }

  /** The element of `id`, or null. */
  getElementById(id: string): HandBuiltElement | null {
    return this.elements.get(id) ?? null;
  }

  /** The element of `id`; a test that names a missing one is wrong. */
  element(id: string): HandBuiltElement {
    const element = this.elements.get(id);
    if (element === undefined) throw new Error(`the hand-built document has no element "${id}"`);
    return element;
  }

  /** The ids of the elements, in document order. */
  ids(): string[] {
    return [...this.elements.keys()];
  }

  /** The text an element shows, or the empty text when it is hidden. */
  visibleText(id: string): string {
    const element = this.element(id);
    return element.hidden ? "" : (element.textContent ?? "");
  }

  /** Register a pointer-lock listener. */
  addEventListener(type: "pointerlockchange" | "pointerlockerror", listener: () => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  /** Release the pointer lock. */
  exitPointerLock(): void {
    if (this.pointerLockElement === null) return;
    this.pointerLockElement = null;
    this.fire("pointerlockchange");
  }

  /** Grant or refuse a lock request as Chrome does: a refusal fires the event and rejects. */
  private lock(element: HandBuiltElement): Promise<void> {
    if (this.refusePointerLock) {
      this.fire("pointerlockerror");
      return Promise.reject(new Error("the pointer lock was refused"));
    }
    this.pointerLockElement = element;
    this.fire("pointerlockchange");
    return Promise.resolve();
  }

  /** Call the listeners of one event type. */
  private fire(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}
