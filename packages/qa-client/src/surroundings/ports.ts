import type {
  LevelViewInput,
  LevelViewStart,
  RenderQuality,
  ViewPose,
} from "@level-designer/level-view";
import type { createPhysicsWorld } from "@level-designer/sec111-gateway";

/** The part of an element's inline style the page sets. */
interface PageStyle {
  minHeight: string;
}

/** The part of a document element the page uses; every region has it. */
export interface PageElement {
  readonly tagName: string;
  textContent: string | null;
  hidden: boolean | string;
  readonly style: PageStyle;
  readonly dataset: Record<string, string | undefined>;
}

/** The view canvas: a click captures the mouse on it. */
export interface PageCanvas extends PageElement {
  requestPointerLock(): unknown;
  addEventListener(type: "click", listener: () => void): void;
}

/** The comment field of the mark box. */
export interface PageTextArea extends PageElement {
  value: string;
  maxLength: number;
  focus(): void;
  addEventListener(type: "input", listener: () => void): void;
}

/** The part of the document the page uses: its regions by id, the body and the pointer lock. */
export interface PageDocument {
  getElementById(id: string): PageElement | null;
  readonly body: { textContent: string | null } | null;
  readonly pointerLockElement: unknown;
  exitPointerLock(): void;
  addEventListener(type: "pointerlockchange" | "pointerlockerror", listener: () => void): void;
}

/** A key event: its physical key code and its default action. */
export interface KeyEventLike {
  readonly code: string;
  preventDefault(): void;
}

/** A mouse move: the motion since the last event, in pixels. */
export interface MouseMoveLike {
  readonly movementX: number;
  readonly movementY: number;
}

/** An uncaught error, or a script that failed to load (its `target` is the script element). */
export interface ErrorEventLike {
  readonly message: string;
  readonly error: unknown;
  readonly target: unknown;
}

/** An unhandled promise rejection. */
export interface RejectionLike {
  readonly reason: unknown;
}

/** The part of the window the page uses: its events, its address, its size and its browser. */
export interface PageWindow {
  addEventListener(type: "keydown" | "keyup", listener: (event: KeyEventLike) => void): void;
  addEventListener(type: "mousemove", listener: (event: MouseMoveLike) => void): void;
  addEventListener(type: "blur", listener: () => void): void;
  addEventListener(
    type: "error",
    listener: (event: ErrorEventLike) => void,
    capture?: boolean,
  ): void;
  addEventListener(type: "unhandledrejection", listener: (event: RejectionLike) => void): void;
  readonly location: { readonly search: string };
  readonly innerWidth: number;
  readonly innerHeight: number;
  readonly navigator: { readonly userAgent: string };
}

/** The timers: timeouts and animation frames. */
export interface PageTimers {
  setTimeout(callback: () => void, ms: number): number;
  clearTimeout(handle: number): void;
  requestAnimationFrame(callback: () => void): number;
}

/** The request options the page sends. */
export interface PageRequestInit {
  readonly method: "GET" | "POST";
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
  readonly signal: AbortSignal;
}

/** The part of a response the page reads. */
export interface PageResponse {
  readonly status: number;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

/** `fetch` on a path of the page's own server. */
export type PageFetch = (path: string, init: PageRequestInit) => Promise<PageResponse>;

/** The adapter information the run log records. */
interface GpuAdapterInfoLike {
  readonly vendor: string;
  readonly architecture: string;
  readonly device: string;
  readonly description: string;
}

/** The browser's WebGPU entry, `navigator.gpu`, which a browser without WebGPU lacks. */
export interface GpuLike {
  requestAdapter(): Promise<{ readonly info?: GpuAdapterInfoLike } | null>;
}

/** The view the page draws through: the frame call and the frame rate. */
export interface PageView {
  frame(pose: ViewPose, time: number): void;
  readonly frameRate: number;
}

/** The start outcome of `level-view`, with the view as the page's port. */
export type ViewStart =
  | Exclude<LevelViewStart, { readonly kind: "started" }>
  | { readonly kind: "started"; readonly view: PageView; readonly quality: RenderQuality };

/** Starts the level view. */
export type ViewStarter = (input: LevelViewInput) => Promise<ViewStart>;

/** Starts sec-111's physics world: the gateway's `createPhysicsWorld`. */
export type PhysicsStarter = typeof createPhysicsWorld;

/** The console methods the page also copies into its run log. */
export interface PageConsole {
  error(...data: unknown[]): void;
  warn(...data: unknown[]): void;
}

/**
 * Everything the page reaches outside itself, as one value: the document, the window, the clock
 * in ms since the Unix epoch, the timers, `fetch`, the browser's WebGPU entry, the view starter,
 * the physics starter and the console.
 */
export interface PageSurroundings {
  readonly document: PageDocument;
  readonly window: PageWindow;
  readonly clock: () => number;
  readonly timers: PageTimers;
  readonly fetch: PageFetch;
  readonly gpu: GpuLike | undefined;
  readonly startView: ViewStarter;
  readonly startPhysics: PhysicsStarter;
  readonly console: PageConsole;
}

/** The part of the surroundings the boot watch uses. */
export type WatchSurroundings = Pick<
  PageSurroundings,
  "document" | "window" | "clock" | "timers" | "fetch"
>;
