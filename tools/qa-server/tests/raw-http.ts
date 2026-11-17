import { connect } from "node:net";

/** A raw HTTP answer: its status and its body text. */
export interface RawAnswer {
  readonly status: number;
  readonly body: string;
}

/**
 * Sends `request` as raw bytes to the loopback port of `address` and reads the answer until
 * the server closes the connection. Reaches requests that `fetch` cannot send, such as an
 * HTTP/1.0 request without `Host`.
 */
export function rawRequest(address: string, request: string): Promise<RawAnswer> {
  const { port } = new URL(address);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const socket = connect(Number(port), "127.0.0.1", () => socket.write(request));
    socket.on("data", (chunk: Buffer) => chunks.push(chunk));
    socket.on("error", reject);
    socket.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8");
      const split = text.indexOf("\r\n\r\n");
      const status = Number(/^HTTP\/1\.[01] (\d{3})/.exec(text)?.[1] ?? "0");
      resolve({ status, body: split < 0 ? "" : text.slice(split + 4) });
    });
  });
}

/**
 * Sends the head of a POST of `length` bytes and only part of its body, then closes the
 * connection: the page reloading while a batch or a mark is in flight.
 */
export function abandonedPost(address: string, path: string): Promise<void> {
  const { port } = new URL(address);
  return new Promise((resolve, reject) => {
    const socket = connect(Number(port), "127.0.0.1", () => {
      const head = `POST ${path} HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nContent-Length: 100\r\n\r\n`;
      socket.write(`${head}{"run":`, () => socket.destroy());
    });
    socket.on("error", reject);
    socket.on("close", () => resolve());
  });
}
