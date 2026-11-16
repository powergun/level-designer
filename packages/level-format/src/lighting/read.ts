import { isUnit, readLinearRgb, readVec3 } from "../shape/index.js";
import type { ShapeNode, Vec3 } from "../shape/index.js";
import type { Environment, Haze, KeyLight, Lighting, PointLight, Shadow } from "./lighting.js";

/** The most point lights a level holds. */
export const MAX_POINT_LIGHTS = 8;

/** A direction from the hall toward the key: a unit vector with positive y. */
function readDirection(node: ShapeNode): Vec3 {
  const direction = readVec3(node);
  const read = direction.every((component) => !Number.isNaN(component));
  if (read && !(isUnit(direction) && direction[1] > 0)) {
    node.fail("a unit vector with positive y");
  }
  return direction;
}

/** The environment record. */
function readEnvironment(node: ShapeNode): Environment {
  node.record(["intensity", "ambient", "overhead"]);
  return {
    intensity: node.field("intensity").numberAtLeast(0),
    ambient: readLinearRgb(node.field("ambient")),
    overhead: readLinearRgb(node.field("overhead")),
  };
}

/** The key's shadow record. */
function readShadow(node: ShapeNode): Shadow {
  node.record(["mapSize", "bias", "normalBias", "radius"]);
  return {
    mapSize: node.field("mapSize").oneOf([1024, 2048, 4096]),
    bias: node.field("bias").numberIn(-0.01, 0.01),
    normalBias: node.field("normalBias").numberIn(0, 1),
    radius: node.field("radius").numberIn(0, 16),
  };
}

/** The key light record. */
function readKey(node: ShapeNode): KeyLight {
  node.record(["color", "intensity", "direction", "shadow"]);
  return {
    color: readLinearRgb(node.field("color")),
    intensity: node.field("intensity").numberAtLeast(0),
    direction: readDirection(node.field("direction")),
    shadow: readShadow(node.field("shadow")),
  };
}

/** One point light record. */
function readPoint(node: ShapeNode): PointLight {
  node.record(["position", "color", "intensity", "range"]);
  return {
    position: readVec3(node.field("position")),
    color: readLinearRgb(node.field("color")),
    intensity: node.field("intensity").numberAtLeast(0),
    range: node.field("range").numberAtLeast(0),
  };
}

/** The haze record. */
function readHaze(node: ShapeNode): Haze {
  node.record(["density", "color", "glow"]);
  return {
    density: node.field("density").numberAtLeast(0),
    color: readLinearRgb(node.field("color")),
    glow: node.field("glow").numberAtLeast(0),
  };
}

/** The one admission of the lighting section, for the description and the level `.json`. */
export function readLighting(node: ShapeNode): Lighting {
  node.record(["environment", "points", "haze", "exposure"], ["key"]);
  const key = node.optionalField("key");
  return {
    environment: readEnvironment(node.field("environment")),
    ...(key === undefined ? {} : { key: readKey(key) }),
    points: node.field("points").list(MAX_POINT_LIGHTS).map(readPoint),
    haze: readHaze(node.field("haze")),
    exposure: node.field("exposure").positive(),
  };
}
