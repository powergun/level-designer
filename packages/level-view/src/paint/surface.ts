import type { SlabVertex, Vec3 } from "@level-designer/finish-paint";
import {
  attribute,
  float,
  max,
  modelNormalMatrix,
  normalLocal,
  positionWorld,
  varying,
  vec2,
} from "three/tsl";
import { InterpolationSamplingType, type VaryingNode } from "three/webgpu";
import type { FloatNode } from "./node-arithmetic.js";

/** The smallest footprint: the layer kinds require a positive one. */
const MIN_FOOTPRINT = 1e-6;

/** A varying of a vertex attribute without interpolation, for a face's constants. */
function flat<T extends "vec2" | "vec4">(name: string, type: T, label: string): VaryingNode<T> {
  const node = varying(attribute(name, type), label);
  node.setInterpolation(InterpolationSamplingType.FLAT);
  return node;
}

/**
 * A painted slab's or box's vertex data as scalar nodes. The pattern coordinates (`uv`)
 * interpolate. The face's size (`uv1`) and the slab numbers (`_slab`: number, seed, wear,
 * class) reach the painter through flat varyings, because a face's constants must not
 * interpolate.
 */
export function slabVertexNodes(): SlabVertex<FloatNode> {
  const pattern = attribute("uv", "vec2");
  const size = flat("uv1", "vec2", "vFaceSize");
  const slab = flat("_slab", "vec4", "vSlab");
  return {
    x: pattern.x,
    y: pattern.y,
    width: size.x,
    height: size.y,
    faceClass: slab.w,
    seed: slab.y,
    wear: slab.z,
  };
}

/** What the hall's frame rule reads of a stage surface, in the level frame. */
export interface HallVertex {
  readonly position: Vec3<FloatNode>;
  readonly normal: Vec3<FloatNode>;
}

/**
 * A stage surface's position and normal in the level frame, the GLB scene's world frame: the
 * mesh's frozen world matrix composes the `stage` scale. The normal is the geometry's, never
 * the normal map's, interpolated and normalised per pixel for the hall's 0.7 limit.
 */
export function hallVertexNodes(): HallVertex {
  const position = positionWorld;
  const normal = varying(modelNormalMatrix.mul(normalLocal), "vHallNormal").normalize();
  return {
    position: [position.x, position.y, position.z],
    normal: [normal.x, normal.y, normal.z],
  };
}

/** The metres of pattern one pixel covers: the longer screen derivative of the coordinates. */
export function footprintNode(x: FloatNode, y: FloatNode): FloatNode {
  const pattern = vec2(x, y);
  return max(max(pattern.dFdx().length(), pattern.dFdy().length()), float(MIN_FOOTPRINT));
}
