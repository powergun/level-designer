import { expect, spyOn, test } from "bun:test";
import {
  buildLevel,
  COMMITTED_DESCRIPTION,
  readInputs,
  validateLevel,
} from "@level-designer/level-pipeline";
import * as stage from "@level-designer/sec111-gateway/stage";

// Owner: level-pipeline, on the committed description. This file runs the gate's third and
// last full preparation, and only that one.

/** Every call of sec-111's preparation, counted through the gateway's stage entry; files of one run may share it. */
const preparations = spyOn(stage, "prepareLevel");

/** One preparation costs about 3 s. */
const PREPARATION_TIMEOUT = 30_000;

test(
  "the committed description builds and is accepted",
  async () => {
    const before = preparations.mock.calls.length;
    const read = await readInputs(COMMITTED_DESCRIPTION);
    if (!read.ok) throw new Error(`${read.path}: ${read.reason}`);
    const outcome = await buildLevel(read.inputs);
    if (!outcome.ok) throw new Error(`blocked: ${JSON.stringify(outcome.errors)}`);
    const report = await validateLevel(outcome.built);
    expect(report.findings).toEqual([]);
    expect(report.accepted).toBe(true);
    expect(outcome.built.prepared.level.metrics.scale).toBe(1);
    const { count, limit } = report.summary.bodyBoxes;
    expect(count).toBeLessThan(limit);
    expect(preparations.mock.calls.length - before).toBe(1);
  },
  PREPARATION_TIMEOUT,
);
