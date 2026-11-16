import { expect, test } from "bun:test";
import { join, resolve } from "node:path";
import { run } from "@level-designer/level-cli";
import { listKinds } from "@level-designer/prop-kit";
import { COMMITTED, capture, fakePipeline, filesUnder, sceneForEachTest } from "./fakes.js";
import { ACCEPTED, ACCEPTED_LINES, BLOCKING, REJECTED } from "./reports.js";

// Owner: level-cli's `validate` and `kinds`: the printed report, the lines of a blocked build,
// the kind listing, the default description, and that neither command writes a file.

const scene = sceneForEachTest();

test("validate prints an accepted report from the hall facts to the verdict and exits 0", async () => {
  const { pipeline, calls } = fakePipeline({
    build: { ok: true, built: scene.built },
    report: ACCEPTED,
  });
  const output = capture();
  const status = await run(["validate", "--workdir", scene.workdir], pipeline, output.streams);
  expect(status).toBe(0);
  expect(output.out).toEqual([...ACCEPTED_LINES]);
  expect(output.err).toEqual([]);
  expect(calls.validations).toEqual([scene.built]);
  expect(await filesUnder(scene.workdir)).toEqual([]);
});

test("validate prints each finding and the rejected verdict and exits 2", async () => {
  const { pipeline } = fakePipeline({ build: { ok: true, built: scene.built }, report: REJECTED });
  const output = capture();
  const status = await run(["validate"], pipeline, output.streams);
  expect(status).toBe(2);
  expect(output.out).toContain("ramp\tnone");
  const findings = output.out.filter(
    (line) => line.startsWith("light-floor\t") || line.startsWith("spawn\tfront"),
  );
  expect(findings).toEqual([
    "light-floor\tlighting.points[0]\tlighting.points[0] sits 0.5 m under the floor at (0, 0)",
    "spawn\tfront\tprop front stands 2 m from the player spawn; keep 6 m",
  ]);
  expect(output.out.at(-1)).toBe("rejected: 2 findings");
});

test("validate prints a blocked build as its error lines and exits 2 without judging", async () => {
  const { pipeline, calls } = fakePipeline({ build: BLOCKING });
  const output = capture();
  const status = await run(["validate", "--workdir", scene.workdir], pipeline, output.streams);
  expect(status).toBe(2);
  expect(output.out).toEqual([
    "place\tprops[0].at\tprops[0].at: (100, 0) lies outside the interior",
    'kind\tprops[1].kind\tprops[1].kind: unknown kind "robot"; the kinds are conveyor',
    "blocked: 2 errors",
  ]);
  expect(calls.validations).toEqual([]);
  expect(await filesUnder(scene.workdir)).toEqual([]);
});

test("a single finding or build error is counted in the singular", async () => {
  const one = { ...REJECTED, findings: REJECTED.findings.slice(0, 1) };
  const rejected = fakePipeline({ build: { ok: true, built: scene.built }, report: one });
  const rejectedOutput = capture();
  expect(await run(["validate"], rejected.pipeline, rejectedOutput.streams)).toBe(2);
  expect(rejectedOutput.out.at(-1)).toBe("rejected: 1 finding");
  const blocked = fakePipeline({ build: BLOCKING.slice(0, 1) });
  const blockedOutput = capture();
  expect(await run(["validate"], blocked.pipeline, blockedOutput.streams)).toBe(2);
  expect(blockedOutput.out.at(-1)).toBe("blocked: 1 error");
});

test("the committed description is the default and --description replaces it", async () => {
  const { pipeline, calls } = fakePipeline({
    build: { ok: true, built: scene.built },
    report: ACCEPTED,
  });
  await run(["validate"], pipeline, capture().streams);
  await run(["validate", "--description", "levels/draft.json"], pipeline, capture().streams);
  expect(calls.reads).toEqual([resolve(COMMITTED), resolve("levels/draft.json")]);
});

test("a description that cannot be read is named on standard error with exit 3", async () => {
  const { pipeline, calls } = fakePipeline({
    read: "unreadable",
    build: { ok: true, built: scene.built },
  });
  const output = capture();
  const path = join(scene.workdir, "missing.json");
  const status = await run(["validate", "--description", path], pipeline, output.streams);
  expect(status).toBe(3);
  expect(output.err).toEqual([`cannot read ${path}: no such file`]);
  expect(output.out).toEqual([]);
  expect(calls.builds).toEqual([]);
});

test("kinds lists every kind with one line per parameter, reads nothing and writes nothing", async () => {
  const { pipeline, calls } = fakePipeline({ build: { ok: true, built: scene.built } });
  const output = capture();
  const status = await run(["kinds", "--workdir", scene.workdir], pipeline, output.streams);
  expect(status).toBe(0);
  const expectedShape = listKinds().flatMap((kind) => [
    `kind\t${kind.name}`,
    ...kind.params.map((param) => `param\t${param.name}\t${param.type}`),
  ]);
  const shape = output.out.map((line) => line.split("\t").slice(0, 3).join("\t"));
  expect(shape).toEqual(expectedShape);
  for (const line of output.out.filter((text) => text.startsWith("param\t"))) {
    expect(line.split("\t")).toHaveLength(5);
  }
  expect(calls.reads).toEqual([]);
  expect(await filesUnder(scene.workdir)).toEqual([]);
});

test("kinds prints each parameter's range, form or choices and its default", async () => {
  const { pipeline } = fakePipeline({ build: { ok: true, built: scene.built } });
  const output = capture();
  await run(["kinds"], pipeline, output.streams);
  const start = output.out.indexOf("kind\tcrate");
  const next = output.out.findIndex((line, i) => i > start && line.startsWith("kind\t"));
  const crateLines = output.out.slice(start + 1, next === -1 ? undefined : next);
  const crate = listKinds().find((kind) => kind.name === "crate");
  const size = crate?.params.find((param) => param.name === "size");
  if (size?.type !== "number") throw new Error("crate has no number parameter size");
  expect(crateLines).toContain(
    `param\tsize\tnumber\t${size.min} to ${size.max}\tdefault ${size.default}`,
  );
  expect(crateLines).toContain("param\tcolor\tcolor\t#rrggbb\trequired");
  const params = listKinds().flatMap((kind) => kind.params);
  const material = params.find((param) => param.type === "material");
  const glow = params.find((param) => param.type === "glow");
  if (material?.type !== "material" || glow?.type !== "glow") {
    throw new Error("no kind takes a material and a glow");
  }
  expect(output.out).toContain(
    `param\t${material.name}\tmaterial\t${material.choices.join(",")}\tdefault ${material.default}`,
  );
  const presence = glow.required ? "required" : "optional";
  expect(output.out).toContain(`param\t${glow.name}\tglow\ta name of glows\t${presence}`);
});
