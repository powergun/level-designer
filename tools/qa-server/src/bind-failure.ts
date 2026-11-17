/**
 * The reason of a failed bind on `host`:`port`. Bun reports a port held by another program and
 * a port inside a range the host reserves (Windows) alike, as `EADDRINUSE`; both name the port
 * and say the server never moves to another. Any other error names the address and its message.
 */
export function bindFailure(host: string, port: number, error: unknown): string {
  if (error instanceof Error && "code" in error && error.code === "EADDRINUSE") {
    return `port ${port} is taken or reserved; the server never moves to another port: stop the program that holds it or pass --port <n>`;
  }
  return `cannot listen on ${host}:${port}: ${error instanceof Error ? error.message : String(error)}`;
}
