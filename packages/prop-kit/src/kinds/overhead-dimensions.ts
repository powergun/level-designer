/** The width of a beam's bottom flange: an I-beam that reads from the floor at 10 m. */
export const BEAM_FLANGE_WIDTH = 0.3;

/** A runway web's height: with its flange a beam 0.55 m deep, as on the overhead-crane reference. */
export const RUNWAY_WEB_HEIGHT = 0.5;

/** An end truck's width across the runway: as wide as the flange it rides over. */
export const END_TRUCK_WIDTH = 0.3;

/** An end truck's height on the runway web. */
export const END_TRUCK_HEIGHT = 0.4;

/** An end truck's length along the runway: it carries both girders and the trolley. */
export const END_TRUCK_LENGTH = 3;

/** A girder web's height: the bridge's main member, deeper than a runway web. */
export const GIRDER_WEB_HEIGHT = 0.6;

/** The distance between the two girder webs' centres: a double-girder bridge, as on the reference. */
export const GIRDER_SPACING = 1.5;

/** The trolley's width across the girders: a hoist housing that reads as a box. */
export const TROLLEY_WIDTH = 1.2;

/** The trolley's height on the girder webs; with it the crane rises 1.7 m above `railHeight`. */
export const TROLLEY_HEIGHT = 0.5;

/** The hook block's width, height and thickness: a block a player recognises under the trolley. */
export const HOOK_BLOCK = { width: 0.4, height: 0.5, thickness: 0.3 } as const;

/** A jib plinth's side: a footing wider than the mast, and the crane's whole standing footprint. */
export const JIB_PLINTH_SIDE = 0.8;

/** A jib plinth's height: above the 0.55 m least top, clear of `low-top`. */
export const JIB_PLINTH_HEIGHT = 0.6;

/** A jib mast's side: a column inside the plinth's outline. */
export const JIB_MAST_SIDE = 0.5;

/** How far the mast rises above the boom's underside: room for the tie's anchor. */
export const JIB_MAST_HEAD = 1.4;

/** A jib boom web's height: a boom shallower than a girder, for a lighter crane. */
export const JIB_BOOM_WEB_HEIGHT = 0.4;

/** The tie's width, its anchor's drop under the mast top, and its foot's share of the boom: a top brace. */
export const JIB_TIE = { width: 0.1, drop: 0.15, share: 0.7 } as const;

/**
 * The hoist's width across the boom, its length along it, its drop under the boom, at most the
 * format's 0.5 m, and its setback from the boom's tip.
 */
export const JIB_HOIST = { width: 0.3, length: 0.4, drop: 0.4, setback: 0.1 } as const;
