/** One rule id of the validator; a caller branches on it, never on the message. */
type RuleId =
  | "scale"
  | "triangles"
  | "light-inside"
  | "light-floor"
  | "material"
  | "texture"
  | "interior"
  | "support"
  | "floor"
  | "ramp"
  | "low-top"
  | "overlap"
  | "seal"
  | "static"
  | "gap"
  | "spawn"
  | "lane"
  | "destructible"
  | "proxies";

/**
 * One finding of the validator: its rule, the subject an author changes (a prop, seal, static
 * object or mesh name, a point light's path, `base.scale`, a spawn name or `level`) and the message.
 */
export interface Finding {
  readonly rule: RuleId;
  readonly subject: string;
  readonly message: string;
}
