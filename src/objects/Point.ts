import { Vector3, Ray } from 'starry-math';
import { Object3D } from '@/objects/Object3D';
import { BufferGeometry } from '@/geometry/BufferGeometry';
import { AbstractMaterial } from '@/material/AbstractMaterial';
import { Intersection, ObjectType, RenderObject, InternalRenderObjectData } from '@/interfaces/ObjectType';
import { PointMaterial } from '@/material/PointMaterial';
import { RayCaster } from '@/objects/RayCaster';
import { DrawMode } from '@/config/define';

class Point extends Object3D implements RenderObject {
  __internalObjectData: InternalRenderObjectData = {};

  geometry: BufferGeometry;
  material: PointMaterial;
  readonly type: ObjectType.renderObject = ObjectType.renderObject;
  readonly drawMode: DrawMode = DrawMode.points;

  constructor(geometry: BufferGeometry = new BufferGeometry(), material: PointMaterial = new PointMaterial()) {
    super();
    this.geometry = geometry;
    this.material = material;
  }

  private _checkIntersect(rayCaster: RayCaster, ray: Ray, index: number, localSqThreshold: number) {
    const position = this.geometry.getAttribute('a_position')!;
    const p0 = new Vector3(position.getX(index), position.getY(index), position.getZ(index));
    const distanceSq = ray.distanceSqToPoint(p0);
    if (distanceSq <= localSqThreshold) {
      const point = ray.closestPointToPoint(p0);
      point.applyMatrix4(this.worldMatrix);
      const distance = rayCaster.ray.origin.distanceTo(point);
      if (distance < rayCaster.near || distance > rayCaster.far) return null;

      return { point, distance, index, object: this };
    }
    return null;
  }

  cast(rayCaster: RayCaster): Intersection[] {
    const result: Intersection[] = [];

    const position = this.geometry.getAttribute('a_position');
    if (!this.visible || !position) return result;

    const { threshold } = rayCaster.params.Point;
    const invertMatrix = this.worldMatrix.clone().invert();
    const ray = rayCaster.ray.clone().applyMatrix4(invertMatrix);

    if (!this.geometry.boundingBox) {
      this.geometry.computeBoundingBox();
    }
    if (this.geometry.boundingBox) {
      const box = this.geometry.boundingBox.clone().expandByNumber(threshold);
      if (!ray.intersectBox(box)) return result;
    }

    const scale = (this.scale.x + this.scale.y + this.scale.z) / 3;
    const localSqThreshold = (threshold / scale) ** 2;

    const index = this.geometry.getIndex();
    if (index) {
      for (let i = 0; i < index.count; i += 1) {
        const a = index.array[i];
        const checked = this._checkIntersect(rayCaster, ray, a, localSqThreshold);
        if (checked) {
          result.push(checked);
        }
      }
    } else {
      for (let i = 0; i < position.count; i += 1) {
        const checked = this._checkIntersect(rayCaster, ray, i, localSqThreshold);
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

export { Point };
