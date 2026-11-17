import type {
  ErrorEventLike,
  KeyEventLike,
  MouseMoveLike,
  PageWindow,
  RejectionLike,
} from "../surroundings/index.js";

/** A key event as a test fires it; it records whether the page prevented the default. */
export interface ScriptedKeyEvent extends KeyEventLike {
  defaultPrevented: boolean;
}

/** The window events a page listens to, with their event values. */
interface WindowEvents {
  readonly keydown: KeyEventLike;
  readonly keyup: KeyEventLike;
  readonly mousemove: MouseMoveLike;
  readonly blur: undefined;
  readonly error: ErrorEventLike;
  readonly unhandledrejection: RejectionLike;
}

/** The listeners of each window event. */
type Listeners = { readonly [K in keyof WindowEvents]: ((event: WindowEvents[K]) => void)[] };

/**
 * The scripted window: a test presses keys, moves the mouse, throws uncaught errors and fails a
 * script load; the page's listeners receive them as the browser's events.
 */
export class ScriptedWindow implements PageWindow {
  readonly location: { readonly search: string };
  readonly innerWidth = 1280;
  readonly innerHeight = 720;
  readonly navigator = { userAgent: "scripted-window" };
  private readonly listeners: Listeners = {
    keydown: [],
    keyup: [],
    mousemove: [],
    blur: [],
    error: [],
    unhandledrejection: [],
  };

  /** A window at the address query `search`, such as `?leak=1`. */
  constructor(search: string) {
    this.location = { search };
  }

  /** Register a listener of one event type; the capture flag changes nothing here. */
  addEventListener<K extends keyof WindowEvents>(
    type: K,
    listener: (event: WindowEvents[K]) => void,
    _capture?: boolean,
  ): void {
    this.listeners[type].push(listener);
  }

  /** Press a key by its code; the returned event tells whether the page prevented its default. */
  press(code: string): ScriptedKeyEvent {
    return this.key("keydown", code);
  }

  /** Release a key by its code. */
  release(code: string): ScriptedKeyEvent {
    return this.key("keyup", code);
  }

  /** Move the mouse by pixels. */
  moveMouse(movementX: number, movementY: number): void {
    this.fire("mousemove", { movementX, movementY });
  }

  /** Throw an uncaught error with its stack. */
  throwUncaught(error: Error): void {
    this.fire("error", { message: error.message, error, target: null });
  }

  /** Reject a promise that nobody handles. */
  rejectUnhandled(reason: unknown): void {
    this.fire("unhandledrejection", { reason });
  }

  /** Fail the load of the script with the tag id `id`, as a missing bundle does. */
  failScriptLoad(id: string): void {
    this.fire("error", { message: "", error: null, target: { id } });
  }

  /** Fire one key event. */
  private key(type: "keydown" | "keyup", code: string): ScriptedKeyEvent {
    const event: ScriptedKeyEvent = {
      code,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
    };
    this.fire(type, event);
    return event;
  }

  /** Call the listeners of one event type. */
  private fire<K extends keyof WindowEvents>(type: K, event: WindowEvents[K]): void {
    for (const listener of this.listeners[type]) listener(event);
  }
}
