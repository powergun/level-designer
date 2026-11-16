import { expect, test } from "bun:test";
import { judgeLevel, namedSpawns } from "@level-designer/level-rules";
import { readCommittedLevel } from "@level-designer/sec111-gateway/testing";
import { expectOne, factsOf, kitProp } from "./room.js";

test("on the committed level three lanes measure more than 7 m and the +x-z lane 1.8 m", async () => {
  const prepared = await readCommittedLevel();
  const judgement = await judgeLevel(factsOf(prepared));
  const widths = Object.fromEntries(judgement.lanes.map((l) => [l.spawn, l.width]));
  expect(Object.keys(widths)).toEqual(["+x+z", "-x+z", "+x-z", "-x-z"]);
  expect(widths["+x+z"]).toBeGreaterThan(7);
  expect(widths["-x+z"]).toBeGreaterThan(7);
  expect(widths["-x-z"]).toBeGreaterThan(7);
  expect(widths["+x-z"]).toBeCloseTo(1.8, 9);
  // Without dressing each lane keeps its own static width where it is under 3 m.
  const kept = judgement.lanes.map((l) =>
    l.spawn === "+x-z" ? l.keeps === l.width : l.keeps === 3,
  );
  expect(kept).toEqual([true, true, true, true]);
  expect(judgement.findings.filter((f) => f.rule === "lane")).toEqual([]);
  expect(judgement.ramp?.from).toBeCloseTo(-29.2332, 9);
  expect(judgement.ramp?.to).toBeCloseTo(-28.1399, 9);
});

test("scale fails on a prepared level that measures another scale and names the value", async () => {
  // sec-111's committed level is prepared from the unscaled base stage: it measures 3.89956.
  const prepared = await readCommittedLevel();
  const judgement = await judgeLevel(factsOf(prepared, { baseScale: 1 }));
  expectOne(
    judgement.findings.filter((f) => f.rule === "scale"),
    "base.scale",
    "sec-111 measures scale 3.89956 on the static scene; set base.scale to 3.899560",
  );
});

test("a partition across a lane fails lane", async () => {
  // An 8 m partition across the west lane of the raised slab, 10.75 m from the -x-z spawn.
  const prepared = await readCommittedLevel();
  const site = { at: [-9.5, -75] as const, yaw: 0 };
  const props = [
    kitProp(prepared, "wall", "partition", site, { width: 8, height: 3, color: "#555555" }),
  ];
  const judgement = await judgeLevel(factsOf(prepared, { props }));
  const westLane = judgement.lanes.find((l) => l.spawn === "-x-z");
  expect(westLane?.width).toBeLessThan(3);
  expectOne(
    judgement.findings.filter((f) => f.rule === "lane"),
    "-x-z",
    "the main lane from the -x-z minion spawn narrows to 2.2 m near (-4.3155, -75.1207); it needs 3 m",
  );
});

test("the spawns are named player and the minions in sec-111's order", async () => {
  const prepared = await readCommittedLevel();
  const spawns = namedSpawns(prepared);
  expect(spawns.map((s) => s.name)).toEqual(["player", "+x+z", "-x+z", "+x-z", "-x-z"]);
  expect(spawns.map((s) => s.position)).toEqual([
    prepared.spawns.player,
    ...prepared.spawns.minions,
  ]);
});
