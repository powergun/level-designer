import {
  MeshStandardNodeMaterial,
  type NodeBuilder,
  type NodeMaterialObserver,
} from "three/webgpu";

/** The builder-context nodes for which three always refreshes a draw in full. */
const PER_DRAW_CONTEXT = ["modelViewMatrix", "modelNormalViewMatrix", "getAO", "getShadow"];

/** True when the untyped builder context carries any per-draw context node. */
function injectsPerDrawNodes(context: unknown): boolean {
  if (typeof context !== "object" || context === null) return false;
  return PER_DRAW_CONTEXT.some((name) => Boolean(Reflect.get(context, name)));
}

/**
 * A standard node material for a static graph, after Wall Lab's: three refreshes every draw of
 * a node material in full each frame, and this observer reports no node to refresh unless the
 * build injects a per-draw node. Its graph reads only geometry attributes and constants.
 */
export class StaticNodeMaterial extends MeshStandardNodeMaterial {
  /** Ignore only this material's own node properties; keep every other refresh reason. */
  override setupObserver(builder: NodeBuilder): NodeMaterialObserver {
    const observer = super.setupObserver(builder);
    observer.hasNode = injectsPerDrawNodes(builder.context);
    return observer;
  }
}
