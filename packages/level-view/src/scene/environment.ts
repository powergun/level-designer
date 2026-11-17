import type { Environment, LinearRgb } from "@level-designer/level-format";
import {
  BackSide,
  Float32BufferAttribute,
  Mesh,
  MeshBasicNodeMaterial,
  PMREMGenerator,
  Scene,
  SphereGeometry,
  type Texture,
  type WebGPURenderer,
} from "three/webgpu";

/** The environment sphere's radius in metres, its segments around and from pole to pole. */
const SPHERE = { radius: 10, widthSegments: 64, heightSegments: 32 } as const;

/** The PMREM blur of the environment bake. */
const BAKE_BLUR = 0.04;

/** Hermite step from 0 at `edge0` to 1 at `edge1`, as GLSL and TSL define it. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * The environment's linear colour toward a unit direction with height `y`:
 * `ambient * (0.4 + 0.6 * smoothstep(-0.7, 0.05, y)) + overhead * smoothstep(-0.1, 0.9, y)`.
 */
export function environmentColor(environment: Environment, y: number): LinearRgb {
  const floor = 0.4 + 0.6 * smoothstep(-0.7, 0.05, y);
  const sky = smoothstep(-0.1, 0.9, y);
  const { ambient, overhead } = environment;
  return [
    ambient[0] * floor + overhead[0] * sky,
    ambient[1] * floor + overhead[1] * sky,
    ambient[2] * floor + overhead[2] * sky,
  ];
}

/**
 * The scene the bake reads: a back-faced sphere whose vertex colours are `environmentColor` at
 * each vertex's unit direction. Vertex colours are linear working-space values, as three reads
 * a float colour attribute.
 */
export function buildEnvironmentScene(environment: Environment): Scene {
  const geometry = new SphereGeometry(SPHERE.radius, SPHERE.widthSegments, SPHERE.heightSegments);
  const positions = geometry.getAttribute("position");
  const colors: number[] = [];
  for (let index = 0; index < positions.count; index += 1) {
    colors.push(...environmentColor(environment, positions.getY(index) / SPHERE.radius));
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  const material = new MeshBasicNodeMaterial({ side: BackSide, vertexColors: true });
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));
  return scene;
}

/** Bake the environment once into a filtered PMREM texture and release the sphere. */
export function bakeEnvironment(renderer: WebGPURenderer, environment: Environment): Texture {
  const scene = buildEnvironmentScene(environment);
  const generator = new PMREMGenerator(renderer);
  const target = generator.fromScene(scene, BAKE_BLUR);
  generator.dispose();
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    const material: unknown = object.material;
    if (material instanceof MeshBasicNodeMaterial) material.dispose();
  });
  return target.texture;
}
