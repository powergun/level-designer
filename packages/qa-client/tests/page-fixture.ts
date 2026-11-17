import { encodeLevel, type Level, type LevelProp } from "@level-designer/level-format";
import { bootPage } from "@level-designer/qa-client";
import { LEVEL_FILES, type SessionAnswer } from "@level-designer/qa-client/protocol";
import {
  createTestPage,
  type TestPage,
  type TestPageOptions,
} from "@level-designer/qa-client/testing";
import { floorHeightAt, type PreparedLevel } from "@level-designer/sec111-gateway";
import { readCommittedFiles, readCommittedLevel } from "@level-designer/sec111-gateway/testing";
import { type LevelFileBytes, ProtocolFake } from "./protocol-fake.ts";

/** The real page document's text, read once. */
const PAGE_HTML = await Bun.file(new URL("../page/index.html", import.meta.url)).text();

/** sec-111's committed prepared level, typed and as its two files. */
export const COMMITTED: PreparedLevel = await readCommittedLevel();
const COMMITTED_FILES = await readCommittedFiles();

/** A lighting section with no key and no point light. */
const LIGHTING: Level["lighting"] = {
  environment: { intensity: 0.4, ambient: [0.02, 0.02, 0.03], overhead: [0.05, 0.05, 0.06] },
  points: [],
  haze: { density: 0.03, color: [0.01, 0.01, 0.02], glow: 0.5 },
  exposure: 1,
};

/** One slab of the walk level: its size, its base centre relative to the spawn, its yaw. */
interface SlabPlan {
  readonly size: readonly [number, number, number];
  /** Plan offset from the player spawn, and the base's height above the floor there. */
  readonly offset: readonly [number, number, number];
  readonly yawDeg: number;
}

/**
 * The walk level's slabs, in level order, relative to the player spawn (yaw 0 looks along +Z):
 *
 * - `across`: a 4 x 2 x 0.05 m panel 3 m ahead, which stops a walk along +Z;
 * - `overhead`: a panel 1 m ahead whose underside hangs at 2.3 m, which a walk passes under;
 * - `block`: a 2 x 2 x 1 m block 5 m behind, for a camera inside a slab;
 * - `slanted`: a panel at a yaw of 37 degrees to the -X side, which a strafe slides along.
 *
 * The slanted panel comes last, so a level whose slabs shared one blocker id would keep only it.
 */
export const WALK_SLABS = {
  across: { size: [4, 2, 0.05], offset: [0, 3, 0], yawDeg: 0 },
  overhead: { size: [4, 1, 0.05], offset: [0, 1, 2.3], yawDeg: 0 },
  block: { size: [2, 2, 1], offset: [0, -5, 0], yawDeg: 0 },
  slanted: { size: [4, 2, 0.05], offset: [-1.6, -1, 0], yawDeg: 37 },
} as const satisfies Record<string, SlabPlan>;

/** The world plan point of a slab's base centre. */
export function slabPoint(plan: SlabPlan): readonly [number, number] {
  const [x, , z] = COMMITTED.spawns.player;
  return [x + plan.offset[0], z + plan.offset[1]];
}

/** One slab of the plan, standing on the committed floor under its point. */
function slabOf(plan: SlabPlan): LevelProp["slabs"][number] {
  const [x, z] = slabPoint(plan);
  const y = floorHeightAt(COMMITTED, x, z) + plan.offset[2];
  const half = (plan.yawDeg * Math.PI) / 360;
  return {
    size: plan.size,
    material: "concrete",
    color: "#808080",
    position: [x, y, z],
    rotation: [0, Math.sin(half), 0, Math.cos(half)],
  };
}

/** The walk level: two props holding the four slabs of `WALK_SLABS` in their order. */
function pathLevel(): Level {
  const { across, overhead, block, slanted } = WALK_SLABS;
  return {
    props: [
      { id: "path", slabs: [slabOf(across), slabOf(overhead)] },
      { id: "side", slabs: [slabOf(block), slabOf(slanted)] },
    ],
    lighting: LIGHTING,
  };
}

/** The four level files of a level text: a stand-in GLB, the level and the committed pair. */
export function levelFiles(levelText: string = encodeLevel(pathLevel())): LevelFileBytes {
  const text = new TextEncoder();
  return {
    [LEVEL_FILES.glb]: text.encode("glTF stand-in"),
    [LEVEL_FILES.level]: text.encode(levelText),
    [LEVEL_FILES.prepared]: text.encode(COMMITTED_FILES.document),
    [LEVEL_FILES.navMesh]: COMMITTED_FILES.navMesh,
  };
}

/** A test page booting against the fake. */
export interface BootedPage extends TestPage {
  readonly fake: ProtocolFake;
  /** Settles when `bootPage` returns; a held answer keeps it open. */
  readonly booted: Promise<void>;
  /** The visible text of a region. */
  text(id: string): string;
}

/** What a test changes from the default boot. */
export interface BootOptions extends Partial<Omit<TestPageOptions, "html" | "fetch">> {
  readonly session?: SessionAnswer;
  readonly files?: LevelFileBytes;
  /** Scripts the fake before the boot starts. */
  readonly arrange?: (fake: ProtocolFake) => void;
}

/** Boot the real page entry on the real page document against the scripted fake. */
export function bootTestPage(options: BootOptions = {}): BootedPage {
  const fake = new ProtocolFake(options.files ?? levelFiles(), options.session);
  options.arrange?.(fake);
  const page = createTestPage({ ...options, html: PAGE_HTML, fetch: fake.fetch });
  const booted = bootPage(page.surroundings);
  return { ...page, fake, booted, text: (id) => page.document.visibleText(id) };
}

/** Boot to the running page: the status strip reads `ready` once the frame loop runs. */
export async function bootReady(options: BootOptions = {}): Promise<BootedPage> {
  const page = bootTestPage(options);
  await page.booted;
  return page;
}

/** The page document's text, for the page files test. */
export function pageHtml(): string {
  return PAGE_HTML;
}
