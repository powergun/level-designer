import { type Arithmetic, type CoreArithmetic, latticeHash } from "@level-designer/finish-paint";
import {
  abs,
  add,
  div,
  float,
  floor,
  Fn,
  fract,
  max,
  min,
  mix,
  mul,
  smoothstep,
  sqrt,
  step,
  sub,
} from "three/tsl";
import type { Node as ShaderNode } from "three/webgpu";

/** A float shader node, the scalar of the node back end. */
export type FloatNode = ShaderNode<"float">;

/** The fourteen operations as three's shader nodes of the same meaning and argument order. */
const core: CoreArithmetic<FloatNode> = {
  constant: (value) => float(value),
  add: (a, b) => add(a, b),
  sub: (a, b) => sub(a, b),
  mul: (a, b) => mul(a, b),
  div: (a, b) => div(a, b),
  min: (a, b) => min(a, b),
  max: (a, b) => max(a, b),
  abs: (a) => abs(a),
  floor: (a) => floor(a),
  fract: (a) => fract(a),
  sqrt: (a) => sqrt(a),
  mix: (a, b, t) => mix(a, b, t),
  step: (edge, x) => step(edge, x),
  smoothstep: (edge0, edge1, x) => smoothstep(edge0, edge1, x),
};

/** The lattice hash as one shader function, so a program declares it once and calls it. */
const latticeHashFn = Fn(([x, y, z]: [FloatNode, FloatNode, FloatNode]) =>
  latticeHash(core, x, y, z),
).setLayout({
  name: "finishLatticeHash",
  type: "float",
  inputs: [
    { name: "x", type: "float" },
    { name: "y", type: "float" },
    { name: "z", type: "float" },
  ],
});

/** The node back end: the fourteen shader nodes and the hash built from `latticeHash` over them. */
export const nodeArithmetic: Arithmetic<FloatNode> = {
  ...core,
  hash: (x, y, z) => latticeHashFn(x, y, z),
};
