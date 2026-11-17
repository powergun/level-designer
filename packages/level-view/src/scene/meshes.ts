import { DoubleSide, type Material, Mesh, type Object3D, Texture } from "three/webgpu";

/** The texture filtering of every level material. */
const ANISOTROPY = 8;

/** Set anisotropy 8 on every texture the material holds, whatever its slot. */
function filterTextures(material: Material): void {
  for (const value of Object.values(material)) {
    if (value instanceof Texture) value.anisotropy = ANISOTROPY;
  }
}

/** Cast and receive the key's shadow with two-sided shadow faces; sidedness stays the GLB's. */
function applyToMesh(mesh: Mesh): void {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const material of materials) {
    material.shadowSide = DoubleSide;
    filterTextures(material);
  }
}

/**
 * Apply the generic mesh rules to a loaded level: every mesh casts and receives shadows with
 * two-sided shadow faces and filters its textures at anisotropy 8, then every matrix freezes.
 */
export function applyMeshRules(root: Object3D): void {
  root.traverse((object) => {
    if (object instanceof Mesh) applyToMesh(object);
  });
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    object.matrixAutoUpdate = false;
    object.matrixWorldAutoUpdate = false;
  });
}
