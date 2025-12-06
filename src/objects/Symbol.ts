import { Vector3, Vector2, Matrix4 } from 'starry-math';
import { Object3D } from '@/objects/Object3D';
import { SymbolGeometry } from '@/geometry/SymbolGeometry';
import { Intersection, EObjectType, RenderObject, InternalRenderObjectData } from '@/interfaces/ObjectType';
import { SymbolMaterial } from '@/material/SymbolMaterial';
import { RayCaster } from '@/objects/RayCaster';
import { BufferGeometry } from '@/geometry/BufferGeometry';
import { EDrawMode } from '@/config/define';

class Symbol extends Object3D implements RenderObject {
  __internalObjectData: InternalRenderObjectData = {};

  geometry: BufferGeometry;
  material: SymbolMaterial;
  readonly type: EObjectType.renderObject = EObjectType.renderObject;
  readonly drawMode: EDrawMode = EDrawMode.triangles;

  constructor(geometry?: SymbolGeometry, material: SymbolMaterial = new SymbolMaterial()) {
    super();
    this.geometry = geometry || new BufferGeometry();
    this.material = material;
  }

  private _projectPoint(rayCaster: RayCaster, point: Vector3, center: Vector3, rotationMatrix: Matrix4) {
    const resolution = this.material.getUniform('u_resolution') as Vector2;
    const halfWidth = resolution.x / 2;
    const halfHeight = resolution.y / 2;

    const location = new Vector3(point.x / halfWidth, point.y / halfHeight);
    location.applyMatrix4(rotationMatrix);
    location.y *= halfWidth / halfHeight;

    const { z } = point;
    const camera = rayCaster.camera!;

    const size = this.material.getUniform('u_size') as number;

    const x = center.x + location.x * size;
    const y = center.y + location.y * size;

    const v0 = camera.unproject(new Vector3(x, y, -1));
    const v1 = camera.unproject(new Vector3(x, y, -10));

    const worldX = (z - v0.z) * (v0.x - v1.x) / (v0.z - v1.z) + v0.x;
    const worldY = (z - v0.z) * (v0.y - v1.y) / (v0.z - v1.z) + v0.y;

    return new Vector3(worldX, worldY, 0);
  }

  private _checkIntersect(rayCaster: RayCaster, center: Vector3, rotationMatrix: Matrix4, index: [number, number, number]) {
    const [a, b, c] = index;
    const position = this.geometry.getAttribute('a_position')!;

    let p0 = new Vector3(position.getX(a), position.getY(a), position.getZ(a));
    p0 = this._projectPoint(rayCaster, p0, center, rotationMatrix);
    let p1 = new Vector3(position.getX(b), position.getY(b), position.getZ(b));
    p1 = this._projectPoint(rayCaster, p1, center, rotationMatrix);
    let p2 = new Vector3(position.getX(c), position.getY(c), position.getZ(c));
    p2 = this._projectPoint(rayCaster, p2, center, rotationMatrix);

    const cross = rayCaster.ray.intersectTriangle(p0, p1, p2, false);
    if (cross) {
      const distance = rayCaster.ray.origin.distanceTo(cross);
      if (distance < rayCaster.near || distance > rayCaster.far) return null;

      return { point: cross, distance, index: c, object: this };
    }
    return null;
  }

  cast(rayCaster: RayCaster): Intersection[] {
    const result: Intersection[] = [];
    const camera = rayCaster.camera;
    const position = this.geometry.getAttribute('a_position');
    if (!this.visible || !position || !camera) return result;

    const index = this.geometry.getIndex();

    let center = new Vector3().applyMatrix4(this.worldMatrix);
    center = camera.project(center);

    const rotationMatrix = new Matrix4().rotateFromEuler(this.material.rotation);

    if (index) {
      for (let i = 0; i < index.count - 1; i += 3) {
        const a = index.array[i];
        const b = index.array[i + 1];
        const c = index.array[i + 2];

        const checked = this._checkIntersect(rayCaster, center, rotationMatrix, [a, b, c]);
        if (checked) {
          result.push(checked);
        }
      }
    }

    return result;
  }

  destroy(): void {
    this.geometry.destroy();
    this.material.destroy();
    if (this.__internalObjectData.gpuBindGroup) {
      this.__internalObjectData.gpuBindGroup.destroy();
      delete this.__internalObjectData.gpuBindGroup;
    }
  }
}

export { Symbol };
