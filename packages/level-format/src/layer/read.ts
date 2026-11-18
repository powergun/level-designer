import { readOptional } from "../shape/index.js";
import type { ShapeNode } from "../shape/index.js";
import type { Clip, Effects, Face, Jitter, Layer, Pattern } from "./layer.js";
import { readLengthPair, ZERO } from "../length/index.js";
import type { Kind } from "./pattern.js";
import { KIND_KEYS, KINDS, readPattern } from "./pattern.js";

/** The faces a layer may name, in the format's order. */
const FACES = [
  "outside",
  "inside",
  "sides",
  "top",
  "bottom",
  "end+",
  "end-",
  "ends",
  "edges",
  "all",
] as const satisfies readonly Face[];

/** The keys every layer may hold, in the canonical order. */
const COMMON_KEYS = ["on", "across", "up", "clip", "detail", "wear", "amount"] as const;

/** The effects, in the order a painter mixes them. */
const EFFECT_KEYS = ["shade", "paint", "color", "metalness", "roughness", "lit", "jitter"] as const;

/** A layer's `color`: `#rrggbb` sRGB text, or the surface's glow. */
const EFFECT_COLOR = /^(?:#[0-9a-fA-F]{6}|glow)$/;

/** Every key of every kind, so a layer of an unknown kind reports only its kind. */
const ANY_KIND_KEYS = KINDS.flatMap((kind) => [
  ...KIND_KEYS[kind].required,
  ...KIND_KEYS[kind].optional,
]);

/** A layer's kind, when its record names one the format admits. */
function statedKind(node: ShapeNode): Kind | undefined {
  const value = node.optionalField("kind")?.value;
  return KINDS.find((kind) => kind === value);
}

/** A cell's `jitter`, its two factors from 0 to 4; on any other kind it is refused. */
function readJitter(node: ShapeNode, kind: Kind): Jitter {
  if (kind !== "cells") {
    node.fail("no jitter outside a cells layer");
    return { low: 1, high: 1 };
  }
  node.record(["low", "high"]);
  return { low: node.field("low").numberIn(0, 4), high: node.field("high").numberIn(0, 4) };
}

/**
 * The effects of a layer, at least one: factors from 0 to 4, the others from 0 to 1. A
 * refused `jitter` still counts as stated, so it yields one problem.
 */
function readEffects(node: ShapeNode, kind: Kind): Effects {
  const effects: { -readonly [K in keyof Effects]: Effects[K] } = {};
  const [shade, paint, color, metalness, roughness, lit, jitter] = EFFECT_KEYS.map((key) =>
    node.optionalField(key),
  );
  if (shade !== undefined) effects.shade = shade.numberIn(0, 4);
  if (paint !== undefined) effects.paint = paint.numberIn(0, 4);
  if (color !== undefined)
    effects.color = color.matching(EFFECT_COLOR, 'a #rrggbb colour or "glow"');
  if (metalness !== undefined) effects.metalness = metalness.numberIn(0, 1);
  if (roughness !== undefined) effects.roughness = roughness.numberIn(0, 1);
  if (lit !== undefined) effects.lit = lit.numberIn(0, 1);
  if (jitter !== undefined) effects.jitter = readJitter(jitter, kind);
  if (Object.keys(effects).length === 0) {
    node.fail(`at least one effect of ${EFFECT_KEYS.join(", ")}`);
  }
  return effects;
}

/** The corners that bound a layer. */
function readClip(node: ShapeNode): Clip {
  node.record(["from", "to"]);
  return {
    from: readLengthPair(node.field("from"), "position"),
    to: readLengthPair(node.field("to"), "position"),
  };
}

/**
 * A layer's `across` or `up`. A border takes neither: under `ends` or `out` its frame
 * would draw a line down the centre, and under `top` its top and base widths would swap.
 */
function readAxis<T extends string>(
  node: ShapeNode,
  choices: readonly [T, ...T[]],
  kind: Kind | undefined,
): T {
  if (kind !== "border") {
    return node.oneOf(choices);
  }
  node.fail("no across or up on a border");
  return choices[0];
}

/** The common keys of a layer; an absent key takes the format's default or stays absent. */
function readCommon(node: ShapeNode, kind?: Kind): Omit<Layer, "pattern" | "effects"> {
  const across = node.optionalField("across");
  const up = node.optionalField("up");
  const clip = node.optionalField("clip");
  const detail = node.optionalField("detail");
  return {
    on: readOptional(node, "on", (n) => n.oneOf(FACES), "outside"),
    ...(across === undefined ? {} : { across: readAxis(across, ["ends", "out"] as const, kind) }),
    ...(up === undefined ? {} : { up: readAxis(up, ["top"] as const, kind) }),
    ...(clip === undefined ? {} : { clip: readClip(clip) }),
    ...(detail === undefined ? {} : { detail: detail.oneOf(["medium", "fine"] as const) }),
    wear: readOptional(node, "wear", (n) => n.boolean(), false),
    amount: readOptional(node, "amount", (n) => n.numberIn(0, 1), 1),
  };
}

/**
 * The pattern of a layer whose kind is missing or unknown: the kind's problem is recorded,
 * and the kind's keys are not read, so one fault yields one problem.
 */
function unknownKind(node: ShapeNode): Pattern {
  node.record(["kind"], [...ANY_KIND_KEYS, ...COMMON_KEYS, ...EFFECT_KEYS]);
  node.field("kind").oneOf(KINDS);
  return { kind: "rectangle", from: [ZERO, ZERO], to: [ZERO, ZERO] };
}

/**
 * One layer: its kind's keys, the common keys and at least one effect. A layer of a missing
 * or unknown kind reports its kind and no effect count, so one fault yields one problem.
 */
export function readLayer(node: ShapeNode): Layer {
  if (typeof node.value !== "object" || node.value === null || Array.isArray(node.value)) {
    return { pattern: unknownKind(node), on: "outside", wear: false, amount: 1, effects: {} };
  }
  const kind = statedKind(node);
  if (kind === undefined) {
    return { pattern: unknownKind(node), ...readCommon(node), effects: {} };
  }
  const keys = KIND_KEYS[kind];
  node.record(["kind", ...keys.required], [...keys.optional, ...COMMON_KEYS, ...EFFECT_KEYS]);
  const pattern = readPattern(kind, node);
  return { pattern, ...readCommon(node, kind), effects: readEffects(node, kind) };
}
