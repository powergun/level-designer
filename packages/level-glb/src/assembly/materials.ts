import type { GltfMaterial } from "../container/index.js";
import { EMISSIVE_STRENGTH } from "../container/index.js";
import type { Glow, Rgb, SealBox, SlabLooks, SlabMesh } from "./inputs.js";

/** One sRGB channel from 0 to 1 decoded to linear, as glTF colour factors store it. */
function linearChannel(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** A `#rrggbb` sRGB colour as a linear RGB triple. */
function linearColor(hex: string): Rgb {
  const channel = (at: number): number =>
    linearChannel(Number.parseInt(hex.slice(at, at + 2), 16) / 255);
  return [channel(1), channel(3), channel(5)];
}

/** The emissive fields of a glow: its colour, and its strength through the extension. */
export function emission(glow: Glow): Pick<GltfMaterial, "emissiveFactor" | "extensions"> {
  return {
    emissiveFactor: [...glow.color],
    extensions: { [EMISSIVE_STRENGTH]: { emissiveStrength: glow.strength } },
  };
}

/** A seal's single-sided flat material, named `seal/<id>`. */
export function sealMaterial(seal: SealBox): GltfMaterial {
  return {
    name: `seal/${seal.id}`,
    pbrMetallicRoughness: {
      baseColorFactor: [...linearColor(seal.color), 1],
      metallicFactor: seal.metalness,
      roughnessFactor: seal.roughness,
    },
  };
}

/** Look up a named entry the prop expansion has admitted; a miss is a programming error. */
function admitted<T>(entry: T | undefined, name: string, kind: string): T {
  if (entry === undefined) throw new Error(`level scene: no ${kind} named "${name}"`);
  return entry;
}

/**
 * The flat fallback of a finish path and its optional glow, named `finish/<path>` with
 * `/glow/<glow>` after it; its `extras` join it to its recipe and keep a glow's unscaled
 * strength for the painter. Its base colour is white, so the vertex colours show unchanged,
 * and a glow emits at its strength times the body's `lit`.
 */
export function slabMaterial(
  slab: Pick<SlabMesh, "finish" | "glow">,
  looks: SlabLooks,
): GltfMaterial {
  const body = admitted(looks.bodies.get(slab.finish), slab.finish, "finish path");
  const look: GltfMaterial = {
    name: `finish/${slab.finish}`,
    extras: { finish: slab.finish },
    pbrMetallicRoughness: {
      baseColorFactor: [1, 1, 1, 1],
      metallicFactor: body.metalness,
      roughnessFactor: body.roughness,
    },
  };
  if (slab.glow === undefined) return look;
  const glow = admitted(looks.glows.get(slab.glow), slab.glow, "glow");
  return {
    ...look,
    name: `${look.name}/glow/${slab.glow}`,
    extras: { finish: slab.finish, glow: slab.glow, glowStrength: glow.strength },
    ...emission({ color: glow.color, strength: glow.strength * body.lit }),
  };
}
