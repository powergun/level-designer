import { expect, test } from "bun:test";
import { run } from "@level-designer/level-cli";
import { capture, fakeBuilt, fakePipeline } from "./fakes.js";

// Owner: level-cli's command line: every usage problem exits 3 before any read, and its line
// on standard error names the command or option at fault, followed by the usage line.

/** Each bad command line with the text its problem line must name. */
const CASES: readonly (readonly [readonly string[], string])[] = [
  [[], "name a command"],
  [["publish"], 'unknown command "publish"'],
  [["validate", "extra"], 'unexpected argument "extra"'],
  [["validate", "--bogus"], "--bogus"],
  [["build", "--workdir"], "--workdir"],
  [["build"], "build needs --workdir"],
  [["snapshot"], "snapshot needs --workdir"],
  [["snapshot", "--workdir", "w", "--eye", "1,2,3"], "--eye and --look-at go together"],
  [
    ["snapshot", "--workdir", "w", "--eye", "1,2", "--look-at", "0,0,0"],
    '--eye takes x,y,z in metres, got "1,2"',
  ],
  [
    ["snapshot", "--workdir", "w", "--eye", "1,2,3", "--look-at", "a,0,0"],
    '--look-at takes x,y,z in metres, got "a,0,0"',
  ],
  [["snapshot", "--workdir", "w", "--eye", "1,2,3", "--look-at", "1,2,3"], "name the same point"],
  [["snapshot", "--workdir", "w", "--eye", "-1,2,3", "--look-at", "0,0,0"], "--eye=-XYZ"],
  [["validate", "--eye", "1,2,3", "--look-at", "0,0,0"], "--eye and --look-at belong to snapshot"],
  [["build", "--workdir="], "--workdir needs a value"],
  [["snapshot", "--workdir", " "], "--workdir needs a value"],
  [["validate", "--description="], "--description needs a value"],
  [["snapshot", "--workdir", "w", "--eye=", "--look-at", "0,0,0"], "--eye needs a value"],
  [["snapshot", "--workdir", "w", "--eye", "1,2,3", "--look-at="], "--look-at needs a value"],
];

test("every usage problem names its command or option and exits 3 before any read or write", async () => {
  const built = await fakeBuilt();
  for (const [argv, named] of CASES) {
    const { pipeline, calls } = fakePipeline({ build: { ok: true, built } });
    const output = capture();
    const status = await run(argv, pipeline, output.streams);
    expect(status, argv.join(" ")).toBe(3);
    expect(output.err, argv.join(" ")).toHaveLength(2);
    expect(output.err[0], argv.join(" ")).toStartWith("level-cli: ");
    expect(output.err[0], argv.join(" ")).toContain(named);
    expect(output.err[1]).toStartWith("usage: level-cli ");
    expect(output.out).toEqual([]);
    expect(calls.reads).toEqual([]);
    // Every write follows a build, so no build proves no write.
    expect(calls.builds).toEqual([]);
  }
});
