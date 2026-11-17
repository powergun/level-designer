import type { KeyLight, PointLight as LevelPoint } from "@level-designer/level-format";
import type { PreparedLevel } from "@level-designer/sec111-gateway";
import { Color, DirectionalLight, PointLight, Vector3 } from "three/webgpu";

/** The interior box of the prepared static level, in scaled metres. */
export type InteriorBox = PreparedLevel["metrics"]["interior"];

/** The physical decay of every point light. */
const POINT_DECAY = 2;

/** The interior's eight corners, corner `k` on the max side of X, Y, Z for bits 0, 1, 2. */
function corners(interior: InteriorBox): Vector3[] {
  const { min, max } = interior;
  return Array.from(
    { length: 8 },
    (_, k) =>
      new Vector3(k & 1 ? max[0] : min[0], k & 2 ? max[1] : min[1], k & 4 ? max[2] : min[2]),
  );
}

/**
 * Fit the key's orthographic shadow camera to the interior box in light space, with no pad: its
 * frustum bounds are the bounds of the eight corners, seen as three's shadow update sees them.
 */
function fitShadow(light: DirectionalLight, interior: InteriorBox): void {
  const camera = light.shadow.camera;
  camera.position.copy(light.position);
  camera.lookAt(light.target.position);
  camera.updateMatrixWorld(true);
  const lo = new Vector3(Infinity, Infinity, Infinity);
  const hi = new Vector3(-Infinity, -Infinity, -Infinity);
  for (const corner of corners(interior)) {
    corner.applyMatrix4(camera.matrixWorldInverse);
    lo.min(corner);
    hi.max(corner);
  }
  camera.left = lo.x;
  camera.right = hi.x;
  camera.bottom = lo.y;
  camera.top = hi.y;
  camera.near = -hi.z;
  camera.far = -lo.z;
  camera.updateProjectionMatrix();
}

/**
 * The key: a directional light along `direction`, aimed at the interior centre from outside the
 * box, with a static PCF shadow fitted to the box and rendered once.
 */
export function createKeyLight(key: KeyLight, interior: InteriorBox): DirectionalLight {
  const light = new DirectionalLight(new Color(...key.color), key.intensity);
  light.name = "key";
  const min = new Vector3(...interior.min);
  const max = new Vector3(...interior.max);
  const centre = min.clone().add(max).multiplyScalar(0.5);
  const reach = min.distanceTo(max) / 2;
  light.target.position.copy(centre);
  light.position.copy(centre).addScaledVector(new Vector3(...key.direction), reach);
  light.castShadow = true;
  const shadow = light.shadow;
  shadow.mapSize.set(key.shadow.mapSize, key.shadow.mapSize);
  shadow.bias = key.shadow.bias;
  shadow.normalBias = key.shadow.normalBias;
  shadow.radius = key.shadow.radius;
  shadow.autoUpdate = false;
  shadow.needsUpdate = true;
  fitShadow(light, interior);
  return light;
}

/** One unshadowed point light of the given colour, candela intensity and range, decay 2. */
export function createPointLight(point: LevelPoint): PointLight {
  const light = new PointLight(
    new Color(...point.color),
    point.intensity,
    point.range,
    POINT_DECAY,
  );
  light.name = "point";
  light.position.set(...point.position);
  light.castShadow = false;
  return light;
}
