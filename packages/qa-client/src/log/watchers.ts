import type { PageConsole, PageWindow } from "../surroundings/index.js";
import { describe, type PageLog } from "./page-log.js";

/** The text of one console call's arguments. */
function consoleText(data: readonly unknown[]): string {
  return data.map(describe).join(" ");
}

/**
 * Copy every `console.error` and `console.warn` into the log, and raise the console alarm on an
 * error; the console still prints them.
 */
export function copyConsole(console: PageConsole, log: PageLog): void {
  const error = console.error.bind(console);
  const warn = console.warn.bind(console);
  console.error = (...data: unknown[]): void => {
    error(...data);
    log.consoleError(`console.error: ${consoleText(data)}`);
  };
  console.warn = (...data: unknown[]): void => {
    warn(...data);
    log.warn(`console.warn: ${consoleText(data)}`);
  };
}

/** Raise the alarm and log the stack of every uncaught error and unhandled rejection. */
export function watchUncaught(window: PageWindow, log: PageLog): void {
  window.addEventListener("error", (event) => {
    const detail =
      event.error === null || event.error === undefined ? event.message : describe(event.error);
    log.alarmed("page-error", `page error: ${detail}`);
  });
  window.addEventListener("unhandledrejection", (event) => {
    log.alarmed("page-error", `unhandled rejection: ${describe(event.reason)}`);
  });
}
