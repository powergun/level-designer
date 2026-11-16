import { describeValue, keyPath } from "@level-designer/level-format";
import { listed } from "./text.js";

/** The build error rules this component owns. */
type PropRule = "kind" | "param";

/**
 * One reason a prop is refused: its rule, the path of the offending value and the message an
 * author reads, which starts with that path.
 */
export interface PropProblem {
  readonly rule: PropRule;
  readonly path: string;
  readonly message: string;
}

/** The `kind` problem of the prop at `propPath`, which names a kind that does not exist. */
export function unknownKind(propPath: string, kind: string, kinds: readonly string[]): PropProblem {
  const path = keyPath(propPath, "kind");
  return {
    rule: "kind",
    path,
    message: `${path}: unknown kind ${describeValue(kind)}; the kinds are ${listed(kinds, "and")}`,
  };
}
