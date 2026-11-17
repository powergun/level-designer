/**
 * The thickness of every metal and wood panel, in metres. The game's collision was measured on
 * a 4 x 2 x 0.05 m panel, and a thicker panel only widens the dead edges a shot cannot open.
 */
export const PANEL = 0.05;

/**
 * The thickness of a concrete enclosure's panels: the thinnest partition the format admits, so
 * a blast hole shows cast concrete, not sheet.
 */
export const CONCRETE_PANEL = 0.1;

/**
 * The thickness of a glow slab and the depth of the eave that houses it. It keeps every face
 * within 0.03 m of the outline the parameters state, and a glow face flush with the eave edge.
 */
export const GLOW_DEPTH = 0.03;

/**
 * The face height of a conveyor's glow strip: a light bar a few centimetres tall, about four
 * pixels at 10 m, that stays a line on the lowest conveyor.
 */
export const CONVEYOR_STRIP_HEIGHT = 0.08;

/**
 * The height of an enclosure band's lower edge: chest height on the player, above the tallest
 * conveyor deck, so bands of enclosures of any height form one line along an assembly line.
 */
export const ENCLOSURE_BAND_BASE = 1.2;

/** The face height of an enclosure band: it reads as a band, not a window, on a 1.5 to 3.5 m machine. */
export const ENCLOSURE_BAND_HEIGHT = 0.1;

/**
 * The thickness of a light strip, a batten housing. Down a long hall the player sees its edge
 * more than its underside, so the edge is deeper than a panel.
 */
export const LIGHT_STRIP_DEPTH = 0.08;

/** The width of a container, fixed by the format. */
export const CONTAINER_WIDTH = 2.44;

/** The height of a container, fixed by the format. */
export const CONTAINER_HEIGHT = 2.59;

/**
 * The least height of a hanging part's underside above the floor under `at`. It clears the
 * 2.17 m that `support` reads over the hall's higher floor, 0.3241 m up, with room to spare.
 */
export const LEAST_HANG = 2.5;
