/**
 * transport: one request to the page's own server with the 15 s timeout on the injected timers,
 * and its outcome as a value: answered with status and body, no answer, or failed.
 */
export { getJson, messageOf, postJson, request, unanswered } from "./request.js";
export type { Transport } from "./request.js";
