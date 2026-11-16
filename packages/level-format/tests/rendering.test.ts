import { expect, test } from "bun:test";
import { describeValue, keyPath } from "@level-designer/level-format";

test("keyPath puts a plain key after a dot and quotes any other key in brackets", () => {
  expect(keyPath("props[3].params", "length")).toBe("props[3].params.length");
  expect(keyPath("", "props")).toBe("props");
  expect(keyPath("props[3].params", "2nd length")).toBe('props[3].params["2nd length"]');
});

test("describeValue shows each kind of value as the shape messages do", () => {
  const long = "x".repeat(41);
  const shown = [
    undefined,
    "red",
    long,
    [0, 0.5, 1],
    [1, 2, 3, 4, 5],
    ["a", "b"],
    { a: 1 },
    1.5,
    true,
    null,
  ].map(describeValue);
  expect(shown).toEqual([
    "nothing",
    '"red"',
    `"${"x".repeat(40)}..."`,
    "[0, 0.5, 1]",
    "an array of 5 items",
    "an array of 2 items",
    "an object",
    "1.5",
    "true",
    "null",
  ]);
});
