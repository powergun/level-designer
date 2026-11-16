import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GAME_VALUES } from "@level-designer/sec111-gateway";

/** sec-111's sources that own the copied values; imported by path so no type follows them. */
const SEC111 = join(import.meta.dir, "../../../../sec-111");
const LOOK_SOURCE = join(SEC111, "engine/view/src/look/look.ts");
const TUNING_SOURCE = join(SEC111, "games/arena-sim/src/tuning/tuning.ts");

/** The private page constants: their source file and the text that holds each number. */
const PAGE_SOURCES = {
  pixelRatioCap: ["engine/view/src/render/start.ts", /pixelRatioCap: ([\d.]+)/],
  signatureSlots: ["engine/view/src/render/presenter.ts", /const SIGNATURE_CAPACITY = (\d+);/],
  frameClampRate: ["games/arena/src/frame/page-clock.ts", /const MAX_FRAME_SECONDS = 1 \/ (\d+);/],
  warmUpFrames: ["games/arena/src/boot/start.ts", /const WARM_UP_FRAMES = (\d+);/],
} as const;

/** The paths at which `copy` differs from `live`, compared value by value, deeply. */
function driftOf(copy: unknown, live: unknown, path = "$"): string[] {
  if (typeof copy !== "object" || copy === null || typeof live !== "object" || live === null) {
    return Object.is(copy, live) ? [] : [path];
  }
  const keys = new Set([...Object.keys(copy), ...Object.keys(live)]);
  return [...keys].flatMap((key) =>
    driftOf(Reflect.get(copy, key), Reflect.get(live, key), `${path}.${key}`),
  );
}

/** The number that `pattern` captures in one sec-111 source file. */
function matchedNumber(file: string, pattern: RegExp): number {
  const found = pattern.exec(readFileSync(join(SEC111, file), "utf8"));
  if (found?.[1] === undefined) throw new Error(`no ${pattern.source} in sec-111/${file}`);
  return Number(found[1]);
}

/** The live game values, read from sec-111's sources in the shape `GAME_VALUES` copies. */
async function liveValues(): Promise<unknown> {
  const look: unknown = await import(LOOK_SOURCE);
  const tuning: unknown = await import(TUNING_SOURCE);
  const arenaLook: unknown = Reflect.get(Object(look), "arenaLook");
  if (typeof arenaLook !== "function") throw new Error(`no arenaLook in ${LOOK_SOURCE}`);
  const live = Reflect.get(Object(tuning), "TUNING");
  const player = Reflect.get(Object(live), "player");
  const page = Object.fromEntries(
    Object.entries(PAGE_SOURCES).map(([name, [file, pattern]]) => [
      name,
      matchedNumber(file, pattern),
    ]),
  );
  return {
    lens: Reflect.get(Object(look), "CAMERA_LENS"),
    look: Reflect.apply(arenaLook, undefined, [1]),
    player: {
      walkSpeed: Reflect.get(Object(player), "walkSpeed"),
      sprintSpeed: Reflect.get(Object(player), "sprintSpeed"),
      eyeRatio: Reflect.get(Object(player), "eyeRatio"),
      maxPitch: Reflect.get(Object(player), "maxPitch"),
    },
    tickRate: Reflect.get(Object(live), "tickRate"),
    page,
  };
}

test("every game value equals sec-111's live value", async () => {
  expect(driftOf(GAME_VALUES, await liveValues())).toEqual([]);
});

test("a deliberately changed game value is reported with its path", async () => {
  const changed = {
    ...GAME_VALUES,
    lens: { ...GAME_VALUES.lens, fovDeg: 93 },
    look: { ...GAME_VALUES.look, bloomStrength: 0.71 },
    player: { ...GAME_VALUES.player, walkSpeed: 3.6 },
    page: { ...GAME_VALUES.page, warmUpFrames: 3 },
  };
  expect(driftOf(changed, await liveValues())).toEqual([
    "$.lens.fovDeg",
    "$.look.bloomStrength",
    "$.player.walkSpeed",
    "$.page.warmUpFrames",
  ]);
});
