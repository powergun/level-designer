import { decodeLevel, type Level } from "@level-designer/level-format";
import { decodePreparedLevel, type PreparedLevel } from "@level-designer/sec111-gateway";
import {
  LEVEL_FILES,
  type LevelFileName,
  levelFileRoute,
  readRefusalAnswer,
} from "../protocol/index.js";
import { messageOf, request, type Transport, unanswered } from "../transport/index.js";
import { done, failed, type StepOutcome } from "./steps.js";

/** The level files, read and decoded. */
export interface LevelFiles {
  readonly glb: Uint8Array;
  readonly level: Level;
  readonly prepared: PreparedLevel;
}

/** The failure message of one level file. */
function fileFailed<T>(name: LevelFileName, reason: string): StepOutcome<T> {
  return failed(`level file ${name} failed: ${reason}`);
}

/** The reason of an answer other than the file: the refusal's message, or the bare status. */
function refusalReason(status: number, bytes: Uint8Array): string {
  let message = "";
  try {
    const refused = readRefusalAnswer(JSON.parse(new TextDecoder().decode(bytes)));
    if (refused.ok) message = `: ${refused.value.message}`;
  } catch {
    // A body that is not JSON leaves the bare status.
  }
  return `HTTP ${status}${message}`;
}

/** Fetch one level file's bytes. */
async function fetchFile(
  transport: Transport,
  name: LevelFileName,
): Promise<StepOutcome<Uint8Array>> {
  const reply = await request(
    transport,
    levelFileRoute(name),
    { method: "GET" },
    async (response) => new Uint8Array(await response.arrayBuffer()),
  );
  if (reply.kind !== "answered") return fileFailed(name, unanswered(reply));
  if (reply.status !== 200) return fileFailed(name, refusalReason(reply.status, reply.body));
  return done(reply.body);
}

/** Decode the level `.json`; the reason names its first problem and the count. */
function readLevel(bytes: Uint8Array): StepOutcome<Level> {
  const admission = decodeLevel(new TextDecoder().decode(bytes));
  if (admission.ok) return done(admission.value);
  const [first] = admission.problems;
  const more = admission.problems.length > 1 ? ` (and ${admission.problems.length - 1} more)` : "";
  return fileFailed(LEVEL_FILES.level, `it does not decode: ${first?.message ?? ""}${more}`);
}

/** Decode the prepared static level from its document and its navmesh. */
function readPrepared(document: Uint8Array, navMesh: Uint8Array): StepOutcome<PreparedLevel> {
  try {
    return done(decodePreparedLevel(new TextDecoder().decode(document), navMesh));
  } catch (thrown) {
    return fileFailed(LEVEL_FILES.prepared, `it does not decode: ${messageOf(thrown)}`);
  }
}

/** Fetch the four level files in order and decode the level and the prepared static level. */
export async function readLevelFiles(transport: Transport): Promise<StepOutcome<LevelFiles>> {
  const glb = await fetchFile(transport, LEVEL_FILES.glb);
  if (!glb.ok) return glb;
  const levelBytes = await fetchFile(transport, LEVEL_FILES.level);
  if (!levelBytes.ok) return levelBytes;
  const level = readLevel(levelBytes.value);
  if (!level.ok) return level;
  const preparedBytes = await fetchFile(transport, LEVEL_FILES.prepared);
  if (!preparedBytes.ok) return preparedBytes;
  const navMesh = await fetchFile(transport, LEVEL_FILES.navMesh);
  if (!navMesh.ok) return navMesh;
  const prepared = readPrepared(preparedBytes.value, navMesh.value);
  if (!prepared.ok) return prepared;
  return done({ glb: glb.value, level: level.value, prepared: prepared.value });
}
