import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { run } from "@level-designer/level-cli";
import { HANG_HEIGHT } from "@level-designer/level-rules";
import { floorHeightAt, GAME_VALUES, PLAYER_BODY } from "@level-designer/sec111-gateway";
import { capture, fakePipeline, filesUnder, sceneForEachTest, SHEET_BYTES } from "./fakes.js";
import { BLOCKING } from "./reports.js";

// Owner: level-cli's `snapshot`: it builds without judging, fills the snapshot input from the
// built level and the game values, and writes the sheets under the work directory.

const scene = sceneForEachTest();

test("snapshot writes three sheets without judging and announces each", async () => {
  const { pipeline, calls } = fakePipeline({ build: { ok: true, built: scene.built } });
  const output = capture();
  const status = await run(["snapshot", "--workdir", scene.workdir], pipeline, output.streams);
  expect(status).toBe(0);
  const sheets = ["plan", "section", "view"] as const;
  expect(output.err).toEqual(
    sheets.map((s) => `wrote ${join(scene.workdir, "snapshots", `${s}.png`)}`),
  );
  expect(await filesUnder(scene.workdir)).toEqual(
    sheets.map((s) => `snapshots/${s}.png`).toSorted(),
  );
  for (const sheet of sheets) {
    const bytes = await readFile(join(scene.workdir, "snapshots", `${sheet}.png`));
    expect([...bytes]).toEqual([...SHEET_BYTES[sheet]]);
  }
  expect(calls.validations).toEqual([]);
  expect(calls.renders).toHaveLength(1);
  expect(calls.renders[0]?.custom).toBeUndefined();
});

test("snapshot fills the input from the prepared level, the description and the game values", async () => {
  const { pipeline, calls } = fakePipeline({ build: { ok: true, built: scene.built } });
  await run(["snapshot", "--workdir", scene.workdir], pipeline, capture().streams);
  expect(calls.renders).toHaveLength(1);
  const input = calls.renders[0];
  if (input === undefined) throw new Error("the renderer was not called");
  const prepared = scene.built.prepared.level;
  expect(input.interior).toEqual(prepared.metrics.interior);
  expect(input.floors).toEqual(prepared.metrics.floorHeights);
  expect(input.clearances).toEqual([HANG_HEIGHT]);
  expect(input.playerSpawn).toEqual(prepared.spawns.player);
  expect(input.minionSpawns).toEqual(prepared.spawns.minions);
  expect(input.props).toEqual(
    scene.built.description.props.map(({ at: [x, z] }) => [x, floorHeightAt(prepared, x, z), z]),
  );
  expect(input.lens).toEqual(GAME_VALUES.lens);
  expect(input.figureHeight).toBe(PLAYER_BODY.height);
  expect(input.eyeHeight).toBe(PLAYER_BODY.height * GAME_VALUES.player.eyeRatio);
});

test("snapshot writes a fourth sheet for an eye and a look-at point", async () => {
  const { pipeline, calls } = fakePipeline({ build: { ok: true, built: scene.built } });
  const output = capture();
  const argv = [
    "snapshot",
    "--workdir",
    scene.workdir,
    "--eye=-5,1.7,-20",
    "--look-at",
    "0,1.5,-40.25",
  ];
  const status = await run(argv, pipeline, output.streams);
  expect(status).toBe(0);
  expect(calls.renders[0]?.custom).toEqual({ eye: [-5, 1.7, -20], lookAt: [0, 1.5, -40.25] });
  const custom = join(scene.workdir, "snapshots", "custom.png");
  expect(output.err.at(-1)).toBe(`wrote ${custom}`);
  expect(await filesUnder(scene.workdir)).toHaveLength(4);
  expect([...(await readFile(custom))]).toEqual([...SHEET_BYTES.custom]);
});

test("snapshot of a blocked build prints its errors, writes nothing and exits 2", async () => {
  const { pipeline, calls } = fakePipeline({ build: BLOCKING });
  const output = capture();
  const status = await run(["snapshot", "--workdir", scene.workdir], pipeline, output.streams);
  expect(status).toBe(2);
  expect(output.out.at(-1)).toBe("blocked: 2 errors");
  expect(output.err).toEqual(["nothing written: the build is blocked"]);
  expect(calls.renders).toEqual([]);
  expect(await filesUnder(scene.workdir)).toEqual([]);
});
