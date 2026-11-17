import { bindFailure } from "./bind-failure.js";
import type { RunLog } from "./run-log/index.js";
import type { Session } from "./routes/index.js";
import { createHandler } from "./routes/index.js";
import type { StartRecord } from "./start-record.js";
import { failure } from "./start/index.js";
import type { ExitStatus, Surroundings } from "./surroundings.js";

/** The one interface the server binds: loopback only. */
const HOSTNAME = "127.0.0.1";

/** Resolves when the stop request arrives, at once when it already has. */
function stopRequested(stop: AbortSignal): Promise<void> {
  return new Promise((done) => {
    if (stop.aborted) done();
    else stop.addEventListener("abort", () => done(), { once: true });
  });
}

/**
 * Writes the last line of a run and prints it with the run log's path on standard error; a
 * line that cannot be written is reported there too.
 */
function lastLine(log: RunLog, surroundings: Surroundings): void {
  const last = `stopped: ${String(surroundings.stop.reason)}`;
  const failed = log.write("server", "info", last);
  if (failed !== null) surroundings.err(`qa-server: ${failed}`);
  surroundings.err(`qa-server: ${last}; the run log is ${log.path}`);
}

/**
 * Binds the port, prints the address, serves until the stop request,
 * then closes every connection and writes the last line. A bind failure is a start failure.
 */
export async function serveUntilStopped(
  session: Session,
  port: number,
  record: StartRecord,
  surroundings: Surroundings,
): Promise<ExitStatus> {
  let server: Bun.Server<undefined>;
  try {
    const fetch = createHandler(session);
    server = Bun.serve({ hostname: HOSTNAME, port, development: false, fetch });
  } catch (error) {
    return record.fail(failure(bindFailure(HOSTNAME, port, error), error));
  }
  record.end();
  const address = `http://${HOSTNAME}:${server.port}/`;
  if (!record.write([{ level: "info", text: `serving ${address}` }])) {
    await server.stop(true);
    return 1;
  }
  surroundings.out(`serving ${address}`);
  await stopRequested(surroundings.stop);
  await server.stop(true);
  lastLine(session.log, surroundings);
  return 0;
}
