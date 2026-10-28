import { Vector3, Ray } from 'starry-math';
import { Object3D } from '@/objects/Object3D';
import { BufferGeometry } from '@/geometry/BufferGeometry';
import { AbstractMaterial } from '@/material/AbstractMaterial';
import { Intersection, ObjectType, RenderObject, InternalRenderObjectData } from '@/interfaces/ObjectType';
import { MeshMaterial } from '@/material/MeshMaterial';
import { RayCaster } from '@/objects/RayCaster';
import { ArrayPoint } from '@/interfaces/GeometryType';
import { DrawMode } from '@/config/define';

class Mesh extends Object3D implements RenderObject {
  __internalObjectData: InternalRenderObjectData = {};

  geometry: BufferGeometry;
  material: AbstractMaterial;
  readonly type: ObjectType.renderObject = ObjectType.renderObject;
  readonly drawMode: DrawMode = DrawMode.triangles;

  constructor(geometry: BufferGeometry = new BufferGeometry(), material: AbstractMaterial = new MeshMaterial()) {
    super();
    this.geometry = geometry;
    this.material = material;
  }

  private _checkIntersect(rayCaster: RayCaster, ray: Ray, index: ArrayPoint) {
    const [a, b, c] = index;
    const position = this.geometry.getAttribute('a_position')!;
    const p0 = new Vector3(position.getX(a), position.getY(a), position.getZ(a));
    const p1 = new Vector3(position.getX(b), position.getY(b), position.getZ(b));
    const p2 = new Vector3(position.getX(c), position.getY(c), position.getZ(c));
    const cross = ray.intersectTriangle(p0, p1, p2, false);
    if (cross) {
      cross.applyMatrix4(this.worldMatrix);
      const distance = rayCaster.ray.origin.distanceTo(cross);
      if (distance < rayCaster.near || distance > rayCaster.far) {
        return null;
      }

      return { point: cross, distance, index: c, object: this };
    }
    return null;
  }

  cast(rayCaster: RayCaster): Intersection[] {
    const result: Intersection[] = [];

    const position = this.geometry.getAttribute('a_position');
    if (!this.visible || !position) {
      return result;
    }

    const invertMatrix = this.worldMatrix.clone().invert();
    const ray = rayCaster.ray.clone().applyMatrix4(invertMatrix);

    if (!this.geometry.boundingBox) {
      this.geometry.computeBoundingBox();
    }
    if (this.geometry.boundingBox) {
      if (!ray.intersectBox(this.geometry.boundingBox)) {
        return result;
      }
    }

    const index = this.geometry.getIndex();
    if (index) {
      for (let i = 0; i < index.count - 1; i += 3) {
        const a = index.array[i];
        const b = index.array[i + 1];
        const c = index.array[i + 2];

        const checked = this._checkIntersect(rayCaster, ray, [a, b, c]);
        if (checked) {
          result.push(checked);
        }
      }
    } else {
      for (let i = 0; i < position.count - 1; i += 3) {
        const checked = this._checkIntersect(rayCaster, ray, [i, i + 1, i + 2]);
        if (checked) {
          result.push(checked);
        }
      }
    }
    result.sort((a, b) => a.distance - b.distance);
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

export { Mesh };
