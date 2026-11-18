/**
 * The frame rules that give a point of a face its pattern coordinates, its face's size and
 * its class: the slab's rule, on plain numbers, with the face classes by name; and the
 * hall's rule over the arithmetic interface, which gives the painter's face directly.
 */
export { type HallBox, hallFace, type Vec3 } from "./hall.js";
export { faceClass, slabFrame, type FaceClass, type SlabFace } from "./slab.js";
