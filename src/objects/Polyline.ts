import { Vector2, Vector3, Ray } from 'starry-math';
import { Object3D } from '@/objects/Object3D';
import { Intersection, EObjectType, RenderObject, InternalRenderObjectData } from '@/interfaces/ObjectType';
import { RayCaster } from '@/objects/RayCaster';
import { PolylineMaterial } from '@/material/PolylineMaterial';
import { PolylineGeometry } from '@/geometry/PolylineGeometry';
import { EDrawMode } from '@/config/define';

class Polyline extends Object3D implements RenderObject {
  __internalObjectData: InternalRenderObjectData = {};

  geometry: PolylineGeometry;
  material: PolylineMaterial;

  readonly type: EObjectType.renderObject = EObjectType.renderObject;
  readonly drawMode: EDrawMode = EDrawMode.triangles;

  constructor(geometry: PolylineGeometry = new PolylineGeometry(), material: PolylineMaterial = new PolylineMaterial()) {
    super();
    this.geometry = geometry;
    this.material = material;
  }

  private _checkIntersect(rayCaster: RayCaster, ray: Ray) {
    const index = this.geometry.getIndex();
    if (!index) {
      return [];
    }
    const intersects: Intersection[] = [];

    const scale = this.material.lineWidth / 2 * rayCaster.camera!.meterPerPixel;
    for (let i = 0; i < index.count - 1; i += 3) {
      const p1 = this._getPointVector(index.getX(i), scale);
      const p2 = this._getPointVector(index.getX(i + 1), scale);
      const p3 = this._getPointVector(index.getX(i + 2), scale);
      const faceIndex = i / 3;
      const cross = ray.intersectTriangle(p3, p2, p1, false);
      if (cross) {
        let isInClip = true;
        // 判断是否在 lineJoin 的圆形裁剪 区域
        const join = this.geometry.getAttribute('a_join')!;
        const joinVector = new Vector2(join.getX(index.getX(i)), join.getY(index.getX(i)));
        if (joinVector.length() > 1) {
          const point = this._getPointVector(index.getX(i), 0);
          const distance = point.distanceTo(cross);
          if (distance > scale) {
            isInClip = false;
          }
        }
        cross.applyMatrix4(this.worldMatrix);
        const distance = rayCaster.ray.origin.distanceTo(cross);
        if (isInClip && distance >= rayCaster.near && distance <= rayCaster.far) {
          intersects.push({
            distance,
            point: cross,
            index: faceIndex,
            object: this,
          });
        }
      }
    }

    return intersects;
  }

  private _getPointVector(index: number, scale: number) {
    const position = this.geometry.getAttribute('a_position')!;
    const normal = this.geometry.getAttribute('a_normal')!;
    const v = new Vector3(position.getX(index), position.getY(index), position.getZ(index));
    const n = new Vector3(normal.getX(index), normal.getY(index), normal.getZ(index));
    n.multiplyScalar(scale);
    v.x += n.x;
    v.y += n.y;
    return v;
  }

  cast(rayCaster: RayCaster): Intersection[] {
    const result: Intersection[] = [];

    const position = this.geometry.getAttribute('a_position');
    if (!this.visible || !position) return result;
    const invertMatrix = this.worldMatrix.clone().invert();
    const ray = rayCaster.ray.clone().applyMatrix4(invertMatrix);

    if (!this.geometry.boundingBox) {
      this.geometry.computeBoundingBox();
    }
    if (this.geometry.boundingBox) {
      const expandValue = this.material.lineWidth * rayCaster.camera!.meterPerPixel;
      const box = this.geometry.boundingBox.clone().expandByNumber(expandValue);
      if (!ray.intersectBox(box)) return result;
    }

    return this._checkIntersect(rayCaster, ray);
  }

  destroy(): void {
    this.material.destroy();
    this.geometry.destroy();
    if (this.__internalObjectData.gpuBindGroup) {
      this.__internalObjectData.gpuBindGroup.destroy();
      delete this.__internalObjectData.gpuBindGroup;
    }
  }
}

export { Polyline };
