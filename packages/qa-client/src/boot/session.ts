import {
  readRefusalAnswer,
  readSessionAnswer,
  ROUTES,
  type SessionFacts,
} from "../protocol/index.js";
import { type PageLog, UNLOGGED } from "../log/index.js";
import { getJson, type Transport, unanswered } from "../transport/index.js";
import { done, failed, type StepOutcome, type StepReport } from "./steps.js";

/** The facts of a built level, the only ones the page boots on. */
export type BuiltSession = SessionFacts & { readonly build: { readonly kind: "built" } };

/** The step's name. */
const STEP = "session facts";

/** A failure before the join: the page knows no run, so it also says no line reaches the log. */
function unjoined(log: PageLog, message: string): StepOutcome<BuiltSession> {
  log.noRun();
  return failed(`${message}; ${UNLOGGED}`);
}

/** The message of an answer that is not session facts: a refusal's, or the shape's miss. */
function notSessionFacts(status: number, body: unknown): string {
  const refused = readRefusalAnswer(body);
  if (refused.ok) return `${STEP} failed: HTTP ${status}: ${refused.value.message}`;
  const read = readSessionAnswer(body);
  const miss = read.ok ? "" : read.miss.message;
  return `${STEP} failed: the server's answer is not session facts: ${miss}`;
}

/**
 * Ask for the session facts and join their run. A blocked build lists every error with its rule
 * and path and ends the boot; a rejected level raises the verdict banner, which stays.
 */
export async function readSession(
  transport: Transport,
  report: StepReport,
): Promise<StepOutcome<BuiltSession>> {
  const { display, log } = report;
  const reply = await getJson(transport, ROUTES.session);
  if (reply.kind !== "answered") return unjoined(log, `${STEP} failed: ${unanswered(reply)}`);
  const read = readSessionAnswer(reply.body);
  if (reply.status !== 200 || !read.ok) {
    return unjoined(log, notSessionFacts(reply.status, reply.body));
  }
  const { logFailure, ...facts } = read.value;
  log.joinRun(facts.run, facts.runLog);
  log.noteLogFailure(logFailure);
  log.info(`session: run ${facts.run}, run log ${facts.runLog}, marks ${facts.marksFile}`);
  const { build } = facts;
  if (build.kind === "blocked") {
    display.buildErrors(build.errors);
    return failed(`build blocked: ${build.errors.length} errors; fix the description and restart`);
  }
  log.info(`level ${build.name}, description ${build.description}, verdict ${build.verdict.kind}`);
  if (build.verdict.kind === "rejected") {
    display.verdict(
      `rejected: ${build.verdict.findings} findings; see the run log ${facts.runLog}`,
    );
  }
  return done({ ...facts, build });
}
