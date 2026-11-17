/** The host names that name loopback for this server, which binds 127.0.0.1 only. */
const LOOPBACK = new Set(["127.0.0.1", "localhost"]);

/** The host name of a `Host` header value: lowercased, without the port. */
function hostName(value: string): string {
  return value.toLowerCase().replace(/:\d*$/, "");
}

/** Whether an `Origin` header value is an `http:` origin on a loopback host name. */
function loopbackOrigin(value: string): boolean {
  if (!URL.canParse(value)) return false;
  const origin = new URL(value);
  return origin.protocol === "http:" && LOOPBACK.has(origin.hostname);
}

/**
 * The breach of the loopback rule, or null: `Host` must be present and name loopback, and
 * `Origin`, when present, too. The breach names the header and its value.
 */
export function foreignHost(headers: Headers): string | null {
  const host = headers.get("host");
  if (host === null) return "the request has no Host header";
  if (!LOOPBACK.has(hostName(host))) return `Host "${host}" names no loopback host`;
  const origin = headers.get("origin");
  if (origin !== null && !loopbackOrigin(origin)) {
    return `Origin "${origin}" names no loopback host`;
  }
  return null;
}
