import type { KeyEventLike } from "../surroundings/index.js";
import type { RunState } from "./run-state.js";

/** The keys that open the comment box: `F3`, and `M` for a browser that keeps `F3`. */
const MARK_KEYS = ["F3", "KeyM"] as const;

/** The status of a refused mouse capture. */
const CAPTURE_REFUSED = "mouse capture refused: click the view again";

/**
 * Keys while the comment box is open: `Enter` sends, `Esc` cancels, `F3` does nothing (so the
 * browser opens no find bar over the box), the rest type.
 */
function boxKey(state: RunState, event: KeyEventLike): void {
  if (event.code === "F3") {
    event.preventDefault();
  } else if (event.code === "Enter" || event.code === "NumpadEnter") {
    event.preventDefault();
    state.marks.submit();
  } else if (event.code === "Escape") {
    event.preventDefault();
    state.marks.cancel();
  }
}

/** `V`: switch between walk and fly, and say why when the page stays in fly. */
function switchMode(state: RunState): void {
  const outcome = state.motion.toggle();
  const { display } = state;
  if (outcome === "walk" || outcome === "fly") {
    display.status(`mode: ${outcome}`);
  } else if (outcome === "outside") {
    display.status("walk needs the camera inside the interior; staying in fly", "warn");
  } else if (outcome === "stuck") {
    const why = "a capsule here would be stuck in the level's collision";
    display.status(`walk cannot stand under the camera: ${why}; staying in fly`, "warn");
  } else {
    display.status(
      `walk is off: ${state.walkOff ?? "the physics world did not start"}; fly stays`,
      "warn",
    );
  }
}

/** A key going down while the box is closed. */
function keyDown(state: RunState, event: KeyEventLike): void {
  if (state.marks.open) return boxKey(state, event);
  const { code } = event;
  if (MARK_KEYS.some((key) => key === code)) {
    event.preventDefault();
    state.keys.clear();
    state.surroundings.document.exitPointerLock();
    state.marks.start(state.motion.pose());
  } else if (code === "KeyV") {
    switchMode(state);
  } else if (code === "Escape") {
    state.surroundings.document.exitPointerLock();
  } else {
    state.keys.press(code);
  }
}

/**
 * The mouse capture: a click on the view asks for the pointer lock; a refusal, by the event or
 * by the rejected request, says to click again, once per click.
 */
function wireCapture(state: RunState): void {
  const { document } = state.surroundings;
  const { canvas } = state.regions;
  let refused = false;
  const refuse = (): void => {
    if (refused) return;
    refused = true;
    state.display.status(CAPTURE_REFUSED, "warn");
  };
  canvas.addEventListener("click", () => {
    if (document.pointerLockElement === canvas || state.marks.open) return;
    refused = false;
    const result = canvas.requestPointerLock();
    if (result instanceof Promise) result.catch(refuse);
  });
  document.addEventListener("pointerlockerror", refuse);
  document.addEventListener("pointerlockchange", () => {
    const captured = document.pointerLockElement === canvas;
    state.log.info(captured ? "mouse captured" : "mouse released");
  });
}

/** Wire the keys, the mouse and the capture to the running page. */
export function wireInput(state: RunState): void {
  const { window, document } = state.surroundings;
  wireCapture(state);
  window.addEventListener("keydown", (event) => keyDown(state, event));
  window.addEventListener("keyup", (event) => state.keys.release(event.code));
  window.addEventListener("blur", () => state.keys.clear());
  window.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement !== state.regions.canvas || state.marks.open) return;
    state.motion.look(event.movementX, event.movementY);
  });
}
