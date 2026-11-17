import type { Display } from "../display/index.js";
import type { PageLog } from "../log/index.js";
import type { MotionPose } from "../motion/index.js";
import {
  foldLines,
  MAX_COMMENT,
  type MarkRequest,
  type Point,
  readMarkAnswer,
  ROUTES,
} from "../protocol/index.js";
import type { PageElement, PageTextArea } from "../surroundings/index.js";
import { postJson, type Transport, unanswered } from "../transport/index.js";

/** The regions of the comment box. */
export interface MarkRegions {
  readonly markBox: PageElement;
  readonly markPose: PageElement;
  readonly markText: PageTextArea;
  readonly markHint: PageElement;
}

/** What a mark needs beyond its regions. */
export interface MarkServices {
  readonly display: Display;
  readonly log: PageLog;
  readonly transport: Transport;
  readonly run: string;
}

/** The box's hint, which states the comment cap. */
const HINT = `Enter saves the mark, Esc cancels it. A comment holds at most ${MAX_COMMENT} characters.`;

/** The hint once the comment reaches the cap, so a cut paste never goes unsaid. */
const HINT_AT_CAP =
  `The comment has reached its cap of ${MAX_COMMENT} characters; ` +
  "text beyond it was not taken.";

/** Radians to degrees at 0.1, yaw folded into -180 to 180. */
function degrees(radians: number, fold: boolean): number {
  let value = (radians * 180) / Math.PI;
  if (fold) value = ((((value + 180) % 360) + 360) % 360) - 180;
  return Math.round(value * 10) / 10;
}

/** A point at 1 mm. */
function millimetres(point: Point): Point {
  const [x, y, z] = point.map((value) => Math.round(value * 1000) / 1000);
  return [x ?? 0, y ?? 0, z ?? 0];
}

/** The mark body of a pose and a comment; line terminators become spaces. */
function markBody(run: string, pose: MotionPose, comment: string): MarkRequest {
  return {
    run,
    mode: pose.mode,
    eye: millimetres(pose.eye),
    feet: pose.feet === null ? null : millimetres(pose.feet),
    yaw: degrees(pose.yaw, true),
    pitch: degrees(pose.pitch, false),
    comment: foldLines(comment).trim(),
  };
}

/** The pose as the box and the log show it. */
function poseText(body: Omit<MarkRequest, "run" | "comment">): string {
  const feet = body.feet === null ? "none" : body.feet.join(", ");
  return `${body.mode} eye ${body.eye.join(", ")} feet ${feet} yaw ${body.yaw} pitch ${body.pitch}`;
}

/**
 * One mark from key to outcome: `F3` or `M` opens the box with the captured pose; `Enter` sends
 * it and shows `saving mark` until the one outcome; `Esc` cancels. A block or a failure keeps the
 * box and its text.
 */
export class MarkFlow {
  private state: "closed" | "open" | "saving" = "closed";
  private captured: MotionPose | null = null;
  private saved = 0;

  /** A flow on the comment box's regions. */
  constructor(
    private readonly regions: MarkRegions,
    private readonly services: MarkServices,
  ) {
    regions.markText.maxLength = MAX_COMMENT;
    regions.markHint.textContent = HINT;
    regions.markText.addEventListener("input", () => this.edited());
  }

  /** Whether the box is open, which freezes movement. */
  get open(): boolean {
    return this.state !== "closed";
  }

  /** The number of marks saved in this page's run. */
  get count(): number {
    return this.saved;
  }

  /** Open the box with the captured pose. */
  start(pose: MotionPose): void {
    if (this.state !== "closed") return;
    this.state = "open";
    this.captured = pose;
    const text = poseText(markBody(this.services.run, pose, ""));
    this.regions.markPose.textContent = text;
    this.regions.markText.value = "";
    this.regions.markHint.textContent = HINT;
    this.regions.markBox.hidden = false;
    this.regions.markText.focus();
    this.services.display.status("mark: type a comment, Enter saves, Esc cancels");
    this.services.log.info(`mark start: ${text}`);
  }

  /** `Enter` sends the mark; nothing while a mark is saving. */
  submit(): void {
    const pose = this.captured;
    if (this.state !== "open" || pose === null) return;
    const body = markBody(this.services.run, pose, this.regions.markText.value);
    if (body.comment === "") {
      this.services.display.status("mark blocked: the comment is empty", "warn");
      this.services.log.flush();
      return;
    }
    this.state = "saving";
    this.services.display.status("saving mark");
    void this.send(body);
  }

  /** `Esc` cancels an open mark; nothing while a mark is saving. */
  cancel(): void {
    if (this.state !== "open") return;
    this.close();
    this.services.display.status("mark cancelled");
    this.services.log.flush();
  }

  /** Post the mark and show its one outcome. */
  private async send(body: MarkRequest): Promise<void> {
    const { display, log, transport } = this.services;
    const reply = await postJson(transport, ROUTES.mark, body);
    this.state = "open";
    if (reply.kind !== "answered")
      return display.status(`mark failed: ${unanswered(reply)}`, "error");
    const answer = readMarkAnswer(reply.body);
    if (!answer.ok) return display.status(`mark failed: ${answer.miss.message}`, "error");
    const { value } = answer;
    log.noteLogFailure(value.logFailure);
    if (value.kind === "failed") return display.status(`mark failed: ${value.message}`, "error");
    if (value.kind === "refused") {
      const restarted = value.reason === "other-run";
      const reason = restarted
        ? `reload the page: the server restarted (${value.message})`
        : value.message;
      return display.status(`mark failed: ${reason}`, "error");
    }
    this.saved += 1;
    this.close();
    display.status(`mark ${value.mark} saved to ${value.file}`);
    log.flush();
  }

  /** Say when the comment reaches the cap, and the plain hint again below it. */
  private edited(): void {
    const atCap = this.regions.markText.value.length >= MAX_COMMENT;
    const hint = atCap ? HINT_AT_CAP : HINT;
    if (this.regions.markHint.textContent === hint) return;
    this.regions.markHint.textContent = hint;
    if (atCap) this.services.log.warn(`mark: ${HINT_AT_CAP}`);
  }

  /** Close the box. */
  private close(): void {
    this.state = "closed";
    this.captured = null;
    this.regions.markBox.hidden = true;
  }
}
