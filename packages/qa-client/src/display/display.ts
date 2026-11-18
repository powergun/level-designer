import type { BuildErrorFact } from "../protocol/index.js";
import { type PageElement, REGION_MIN_HEIGHT } from "../surroundings/index.js";
import type { AlarmKind, PageLog } from "../log/index.js";

/** The regions the display writes. */
export interface DisplayRegions {
  readonly hud: PageElement;
  readonly status: PageElement;
  readonly banner: PageElement;
  readonly verdict: PageElement;
  readonly errors: PageElement;
}

/**
 * The longest banner line, characters: four alarms of it wrap to about eight lines in a window
 * 1,280 px wide, within the banner's bound, and a console alarm with its run log path fits whole.
 */
const BANNER_LINE_MAX = 240;

/** An alarm's banner line: its first line, cut to the banner's width; the run log has it all. */
function headline(text: string): string {
  const [first = ""] = text.split("\n", 1);
  return first.length > BANNER_LINE_MAX ? `${first.slice(0, BANNER_LINE_MAX - 3)}...` : first;
}

/**
 * The page's visible text: the status strip, the alarm banner, the verdict banner, the build
 * error list and the heads-up display. Every status and verdict it shows is also a log line.
 */
export class Display {
  /** The banner's alarms, newest first, at most one of each kind. */
  private alarms: { readonly kind: AlarmKind; readonly text: string }[] = [];

  /** Take the regions and set the inline minimum heights of the display and the status strip. */
  constructor(
    private readonly regions: DisplayRegions,
    private readonly log: PageLog,
  ) {
    regions.hud.style.minHeight = REGION_MIN_HEIGHT;
    regions.status.style.minHeight = REGION_MIN_HEIGHT;
  }

  /** Show a status message and log it at its level; an error line flushes the log. */
  status(text: string, level: "info" | "warn" | "error" = "info"): void {
    this.regions.status.textContent = text;
    this.log[level](`status: ${text}`);
  }

  /**
   * Show an alarm in the one banner, newest first, as one line. It replaces the alarm of its own
   * kind, so the first line of every kind stays in view; a text already in view changes nothing
   * and returns false.
   */
  alarm(kind: AlarmKind, text: string): boolean {
    if (this.alarms.some((alarm) => alarm.text === text)) return false;
    this.alarms = [{ kind, text }, ...this.alarms.filter((alarm) => alarm.kind !== kind)];
    this.regions.banner.textContent = this.alarms.map((alarm) => headline(alarm.text)).join("\n");
    this.regions.banner.hidden = false;
    return true;
  }

  /** Show the verdict banner, which stays in view, and log it. */
  verdict(text: string): void {
    this.regions.verdict.textContent = text;
    this.regions.verdict.hidden = false;
    this.log.warn(`verdict: ${text}`);
  }

  /** List each build error with its rule and path, and log each on its own line. */
  buildErrors(errors: readonly BuildErrorFact[]): void {
    const lines = errors.map((error) => `${error.rule} ${error.path}: ${error.message}`);
    this.regions.errors.textContent = lines.join("\n");
    this.regions.errors.hidden = false;
    for (const line of lines) this.log.warn(`build error: ${line}`);
  }

  /** Replace the heads-up display's text. */
  hud(text: string): void {
    this.regions.hud.textContent = text;
  }
}
