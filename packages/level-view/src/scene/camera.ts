import type { Vec3 } from "@level-designer/level-format";
import { GAME_VALUES } from "@level-designer/sec111-gateway";
import { PerspectiveCamera } from "three/webgpu";

/**
 * A camera pose in radians: yaw 0 looks along +Z and grows toward +X, a positive pitch looks
 * up; `eye` is in scaled metres.
 */
export interface ViewPose {
  readonly eye: Vec3;
  readonly yaw: number;
  readonly pitch: number;
}

/** The game's first-person lens with rotation order YXZ; the window resize sets its aspect. */
export function createCamera(): PerspectiveCamera {
  const { fovDeg, near, far } = GAME_VALUES.lens;
  const camera = new PerspectiveCamera(fovDeg, 1, near, far);
  camera.rotation.order = "YXZ";
  return camera;
}

/** Put the camera at the pose and update its matrices. three's camera looks along -Z at rest. */
export function poseCamera(camera: PerspectiveCamera, pose: ViewPose): void {
  camera.position.set(...pose.eye);
  camera.rotation.set(pose.pitch, Math.PI + pose.yaw, 0);
  camera.updateMatrixWorld(true);
}
