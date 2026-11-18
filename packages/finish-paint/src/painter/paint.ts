import type { Body, DrawnRecipe, Effects } from "@level-designer/level-format";
import type { Arithmetic } from "../arithmetic/index.js";
import { saturate } from "../kinds/index.js";
import { linearFromSrgbHex } from "./color.js";
import type { Rgb, Shade, Surface } from "./face.js";
import { type LayerCoverage, layerCoverage } from "./layer.js";

/** The base shade of a slab or a box: the tint times the body's shade, and the body's values. */
export function bodyShade<S>(a: Arithmetic<S>, body: Body, tint: Rgb<S>): Shade<S> {
  const shade = a.constant(body.shade);
  return {
    albedo: [a.mul(tint[0], shade), a.mul(tint[1], shade), a.mul(tint[2], shade)],
    metalness: a.constant(body.metalness),
    roughness: a.constant(body.roughness),
    emission: a.constant(body.lit),
  };
}

/** Each channel of `from` moved toward `to` by `t`. */
function mixRgb<S>(a: Arithmetic<S>, from: Rgb<S>, to: Rgb<S>, t: S): Rgb<S> {
  return [a.mix(from[0], to[0], t), a.mix(from[1], to[1], t), a.mix(from[2], to[2], t)];
}

/** Each channel of a colour times one factor. */
function scaleRgb<S>(a: Arithmetic<S>, rgb: Rgb<S>, factor: number): Rgb<S> {
  const f = a.constant(factor);
  return [a.mul(rgb[0], f), a.mul(rgb[1], f), a.mul(rgb[2], f)];
}

/** The colour a `color` effect moves toward: the surface's light for `"glow"`, else its text. */
function targetColor<S>(a: Arithmetic<S>, text: string, s: Surface<S>): Rgb<S> {
  if (text === "glow") {
    return s.light;
  }
  const [r, g, b] = linearFromSrgbHex(text);
  return [a.constant(r), a.constant(g), a.constant(b)];
}

/** A scalar moved toward a stated value by `t`, or kept when the effect is absent. */
function mixValue<S>(a: Arithmetic<S>, from: S, to: number | undefined, t: S): S {
  return to === undefined ? from : a.mix(from, a.constant(to), t);
}

/**
 * One layer's effects mixed into a shade by its coverage, in the format's order; `jitter`
 * last, by its own weight.
 */
function mixEffects<S>(
  a: Arithmetic<S>,
  e: Effects,
  c: LayerCoverage<S>,
  shade: Shade<S>,
  s: Surface<S>,
): Shade<S> {
  const t = c.coverage;
  let albedo = shade.albedo;
  if (e.shade !== undefined) {
    albedo = mixRgb(a, albedo, scaleRgb(a, albedo, e.shade), t);
  }
  if (e.paint !== undefined) {
    albedo = mixRgb(a, albedo, scaleRgb(a, s.tint, e.paint), t);
  }
  if (e.color !== undefined) {
    albedo = mixRgb(a, albedo, targetColor(a, e.color, s), t);
  }
  if (c.jitter !== undefined) {
    const { factor, weight } = c.jitter;
    const jittered: Rgb<S> = [
      a.mul(albedo[0], factor),
      a.mul(albedo[1], factor),
      a.mul(albedo[2], factor),
    ];
    albedo = mixRgb(a, albedo, jittered, weight);
  }
  return {
    albedo,
    metalness: mixValue(a, shade.metalness, e.metalness, t),
    roughness: mixValue(a, shade.roughness, e.roughness, t),
    emission: mixValue(a, shade.emission, e.lit, t),
  };
}

/**
 * The painter: a drawn recipe at one point of a face, from the caller's base shade. Each
 * layer mixes its effects in by its coverage, in order; the albedo is clamped to 0 to 1 at
 * the end. The recipe is constant, so on shader nodes one call builds one static graph.
 */
export function paintFace<S>(
  a: Arithmetic<S>,
  recipe: DrawnRecipe,
  base: Shade<S>,
  surface: Surface<S>,
): Shade<S> {
  let shade = base;
  for (const layer of recipe.layers) {
    shade = mixEffects(a, layer.effects, layerCoverage(a, layer, surface), shade, surface);
  }
  const [r, g, b] = shade.albedo;
  return { ...shade, albedo: [saturate(a, r), saturate(a, g), saturate(a, b)] };
}
