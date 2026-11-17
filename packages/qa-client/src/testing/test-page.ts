import { createPhysicsWorld } from "@level-designer/sec111-gateway";
import type {
  GpuLike,
  PageConsole,
  PageFetch,
  PageSurroundings,
  PhysicsStarter,
} from "../surroundings/index.js";
import { HandBuiltDocument } from "./hand-built-document.js";
import { ManualTimers } from "./manual-timers.js";
import { ScriptedView, type ViewScript } from "./scripted-view.js";
import { ScriptedWindow } from "./scripted-window.js";

/** What a test boots the page on. */
export interface TestPageOptions {
  /** The page document's text: the file `page/index.html`, or the body a server served at `/`. */
  readonly html: string;
  /** The protocol: a scripted fake, or a bridge to a real server. */
  readonly fetch: PageFetch;
  /** The address query, such as `?leak=1`; empty by default. */
  readonly search?: string;
  /** The scripted view's answer; it starts by default. */
  readonly view?: ViewScript;
  /** The browser's WebGPU entry; `none` is a browser without it. An adapter by default. */
  readonly gpu?: GpuLike | "none";
  /** The physics starter; the gateway's real `createPhysicsWorld` by default. */
  readonly startPhysics?: PhysicsStarter;
}

/** A booted test page's surroundings and the handles a test drives and reads them by. */
export interface TestPage {
  readonly surroundings: PageSurroundings;
  readonly document: HandBuiltDocument;
  readonly window: ScriptedWindow;
  readonly timers: ManualTimers;
  readonly view: ScriptedView;
}

/** The adapter information of the default WebGPU entry. */
const TEST_ADAPTER = {
  vendor: "test",
  architecture: "scripted",
  device: "none",
  description: "scripted adapter",
} as const;

/** A WebGPU entry whose adapter always answers. */
const TEST_GPU: GpuLike = {
  requestAdapter: () => Promise.resolve({ info: TEST_ADAPTER }),
};

/** A console that drops every call; the page wraps it to copy calls into its run log. */
function silentConsole(): PageConsole {
  return {
    error: () => undefined,
    warn: () => undefined,
  };
}

/** Assemble the surroundings of one test page from the hand-built and scripted parts. */
export function createTestPage(options: TestPageOptions): TestPage {
  const document = new HandBuiltDocument(options.html);
  const window = new ScriptedWindow(options.search ?? "");
  const timers = new ManualTimers();
  const view = new ScriptedView(options.view ?? { kind: "start" });
  const gpu = options.gpu === "none" ? undefined : (options.gpu ?? TEST_GPU);
  const surroundings: PageSurroundings = {
    document,
    window,
    clock: timers.clock,
    timers,
    fetch: options.fetch,
    gpu,
    startView: view.start,
    startPhysics: options.startPhysics ?? createPhysicsWorld,
    console: silentConsole(),
  };
  return { surroundings, document, window, timers, view };
}
