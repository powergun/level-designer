/**
 * The pedestal's width and the thickness of the shoulder and every link, so the arm's standing
 * footprint is one straight-sided strip between the pedestal's side planes.
 */
export const ARM_WIDTH = 0.4;

/** The pedestal's length along the reach: twice its width, a base that reads as a footing. */
export const ARM_PEDESTAL_LENGTH = 0.8;

/** The pedestal's height: about bench high, so the shoulder stands above a conveyor deck. */
export const ARM_PEDESTAL_HEIGHT = 0.9;

/** The shoulder block's length along the reach: it carries the upper arm at every angle. */
export const ARM_SHOULDER_LENGTH = 0.6;

/**
 * The shoulder block's height. The hinge stands 1.3 m up, so the largest arm's lowest head
 * point, 1.3 m less 0.325 of the reach, stays 0.16 m above the floor.
 */
export const ARM_SHOULDER_HEIGHT = 0.4;

/** How far the shoulder hinge sits ahead of the pedestal's centre, so an upright upper arm stays on the block. */
export const ARM_HINGE_OFFSET = 0.1;

/** The shares of `reach` that the upper arm, the forearm and the head take; they sum to 1. */
export const ARM_SHARES = { upper: 0.45, fore: 0.4, head: 0.15 } as const;

/** The widths of the upper arm, the forearm and the head: a tapering arm with a wider tool head. */
export const ARM_WIDTHS = { upper: 0.3, fore: 0.25, head: 0.35 } as const;

/** The glow accent's share of the head's length, centred on it: a light on the tool. */
export const ARM_ACCENT_SHARE = 0.6;

/** The glow accent's width on the head's mid line, inside the head's face. */
export const ARM_ACCENT_WIDTH = 0.1;
