import { formatLength } from "@level-designer/level-format";
import type { Finding } from "../finding/index.js";
import { under } from "../finding/index.js";
import type { Footprint } from "./footprint.js";
import { gapTo } from "./footprint.js";
import { planOf } from "./hall.js";
import type { NamedSpawn } from "./hall.js";

/** The plan distance every standing footprint keeps from every spawn. */
const SPAWN_CLEARANCE = 6;

/** `spawn`: every standing footprint keeps 6 m from every spawn. */
export function spawn(standing: readonly Footprint[], spawns: readonly NamedSpawn[]): Finding[] {
  return standing.flatMap((a) =>
    spawns.flatMap((s): Finding[] => {
      const distance = gapTo(a, [planOf(s)]).distance;
      if (!under(distance, SPAWN_CLEARANCE)) {
        return [];
      }
      const message = `prop ${a.id} stands ${formatLength(distance)} m from the ${s.name} spawn; keep ${formatLength(SPAWN_CLEARANCE)} m`;
      return [{ rule: "spawn", subject: a.id, message }];
    }),
  );
}
