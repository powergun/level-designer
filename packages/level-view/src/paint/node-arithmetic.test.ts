import { describe, expect, test } from "bun:test";
import { attribute } from "three/tsl";
import { ConstNode, MathNode, type Node, OperatorNode, VarNode } from "three/webgpu";
import { type FloatNode, nodeArithmetic as a } from "./node-arithmetic.js";

/** Three distinct float inputs, so each operand's place is visible. */
const p = attribute("uv", "vec2").x;
const q = attribute("uv", "vec2").y;
const r = attribute("position", "vec3").z;

/** The node an operation made: TSL wraps each result in a variable node that holds it. */
function made(result: FloatNode): Node {
  return result instanceof VarNode ? result.node : result;
}

/** The operator or method of a node made by an operation, and its operands in order. */
function shapeOf(result: FloatNode): { readonly name: string; readonly operands: unknown[] } {
  const node = made(result);
  if (node instanceof OperatorNode) return { name: node.op, operands: [node.aNode, node.bNode] };
  if (node instanceof MathNode) {
    const operands = [node.aNode, node.bNode, node.cNode].filter((operand) => operand !== null);
    return { name: node.method, operands };
  }
  throw new Error("Expected a math or an operator node");
}

describe("the node back end", () => {
  test("lifts a number into a float constant", () => {
    const node = made(a.constant(0.25));
    expect(node).toBeInstanceOf(ConstNode);
    expect(node instanceof ConstNode ? node.value : undefined).toBe(0.25);
  });

  test("gives each operation the shader node of its meaning, its operands in order", () => {
    const cases: readonly [FloatNode, string, readonly FloatNode[]][] = [
      [a.add(p, q), "+", [p, q]],
      [a.sub(p, q), "-", [p, q]],
      [a.mul(p, q), "*", [p, q]],
      [a.div(p, q), "/", [p, q]],
      [a.min(p, q), "min", [p, q]],
      [a.max(p, q), "max", [p, q]],
      [a.abs(p), "abs", [p]],
      [a.floor(p), "floor", [p]],
      [a.fract(p), "fract", [p]],
      [a.sqrt(p), "sqrt", [p]],
      [a.mix(p, q, r), "mix", [p, q, r]],
      [a.step(p, q), "step", [p, q]],
      [a.smoothstep(p, q, r), "smoothstep", [p, q, r]],
    ];
    for (const [node, name, operands] of cases) {
      expect(shapeOf(node)).toEqual({ name, operands: [...operands] });
    }
  });
});
