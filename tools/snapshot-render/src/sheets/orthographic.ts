import type { Frame, HalfSpace, View } from "../render/index.js";

/** The scale of every orthographic tile. */
export const PIXELS_PER_METRE = 20;
/** The least margin around the interior box on an orthographic tile, metres. */
const MARGIN = 2;

/** A tile's extent along one axis, whole metres. */
export interface Span {
  readonly low: number;
  readonly high: number;
}

/** The interior's extent from `min` to `max` grown by the margin and snapped to whole metres. */
export function spanOf(min: number, max: number): Span {
  return { low: Math.floor(min - MARGIN), high: Math.ceil(max + MARGIN) };
}

/**
 * The orthographic tile whose frame origin is its top left corner on the cut plane, `across` and
 * `above` metres wide and high. The first kept half-space is the cut.
 */
export function orthographicView(
  frame: Frame,
  across: Span,
  above: Span,
  keep: readonly HalfSpace[],
): View {
  return {
    width: (across.high - across.low) * PIXELS_PER_METRE,
    height: (above.high - above.low) * PIXELS_PER_METRE,
    frame,
    projection: { kind: "orthographic", pixelsPerMetre: PIXELS_PER_METRE },
    keep,
    cut: true,
  };
}
