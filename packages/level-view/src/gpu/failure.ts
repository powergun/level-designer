/** A renderer failure after the start: the GPU device was lost or reported an error. */
export interface ViewFailure {
  readonly kind: "device-lost" | "gpu-error";
  readonly message: string;
}

/** The caller's receiver of renderer failures. */
export type FailureCallback = (failure: ViewFailure) => void;

/** The text of a string field of an opaque value, or nothing. */
function field(value: unknown, key: string): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const found: unknown = Reflect.get(value, key);
  return typeof found === "string" && found !== "" ? found : undefined;
}

/**
 * Read the argument of three's error hook once. Its type package declares a string, while the
 * WebGPU backend passes `{ api, type, message }`, so the argument crosses as `unknown`.
 */
export function describeGpuError(info: unknown): string {
  if (typeof info === "string" && info !== "") return info;
  const message = field(info, "message") ?? "no message";
  const type = field(info, "type");
  return type === undefined ? message : `${type}: ${message}`;
}
