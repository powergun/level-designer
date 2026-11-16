import type { PreparedLevel } from "@level-designer/sec111-gateway";
import type { Finding } from "./finding/index.js";

/** The decimals of the advised `base.scale`, as many as the format document gives the message. */
const SCALE_DECIMALS = 6;

/**
 * `scale`: sec-111 measures the static scene at exactly scale 1. Otherwise the finding advises
 * `base.scale` times the measured scale.
 */
export function scale(baseScale: number, prepared: PreparedLevel): Finding[] {
  const measured = prepared.metrics.scale;
  if (measured === 1) {
    return [];
  }
  const value = (baseScale * measured).toFixed(SCALE_DECIMALS);
  const message = `sec-111 measures scale ${measured} on the static scene; set base.scale to ${value}`;
  return [{ rule: "scale", subject: "base.scale", message }];
}
