import { expect, test } from "bun:test";
import { bindFailure } from "./bind-failure.js";

/** A bind error as Bun throws it, with its system code. */
function bindError(code: string, message: string): Error {
  return Object.assign(new Error(message), { code, syscall: "listen" });
}

test("a taken or reserved port names the port; another bind error names the address", () => {
  // Bun reports both a held port and a port in a range Windows reserves as EADDRINUSE.
  const taken = bindFailure("127.0.0.1", 3900, bindError("EADDRINUSE", "Is port 3900 in use?"));
  expect(taken).toStartWith(
    "port 3900 is taken or reserved; the server never moves to another port",
  );
  const denied = bindFailure("127.0.0.1", 80, bindError("EACCES", "permission denied"));
  expect(denied).toBe("cannot listen on 127.0.0.1:80: permission denied");
});
