import { Ray, Vector3 } from 'starry-math';
import { Object3D } from '@/objects/Object3D';
import { BufferGeometry } from '@/geometry/BufferGeometry';
import { AbstractMaterial } from '@/material/AbstractMaterial';
import { RenderObject, Intersection, EObjectType, InternalRenderObjectData } from '@/interfaces/ObjectType';
import { MeshMaterial } from '@/material/MeshMaterial';
import { RayCaster } from '@/objects/RayCaster';
import { EDrawMode } from '@/config/define';

class Line extends Object3D implements RenderObject {
  __internalObjectData: InternalRenderObjectData = {};

  geometry: BufferGeometry;
  material: AbstractMaterial;

  readonly type: EObjectType.renderObject = EObjectType.renderObject;
  readonly drawMode: EDrawMode = EDrawMode.lines;

  constructor(geometry: BufferGeometry = new BufferGeometry(), material: AbstractMaterial = new MeshMaterial()) {
    super();
    this.geometry = geometry;
    this.material = material;
  }

  private _checkIntersect(rayCaster: RayCaster, ray: Ray, index: [number, number], localSqThreshold: number) {
    const position = this.geometry.getAttribute('a_position')!;
    const [a, b] = index;
    const p0 = new Vector3(position.getX(a), position.getY(a), position.getZ(a));
    const p1 = new Vector3(position.getX(b), position.getY(b), position.getZ(b));

    const interRay = new Vector3();
    const interSegment = new Vector3();

    const distanceSq = ray.distanceSqToSegment(p0, p1, interRay, interSegment);
    if (distanceSq <= localSqThreshold) {
      interRay.applyMatrix4(this.worldMatrix);

      const distance = rayCaster.ray.origin.distanceTo(interRay);

      if (distance < rayCaster.near || distance > rayCaster.far) return null;

      return {
        point: interSegment.applyMatrix4(this.worldMatrix),
        distance,
        index: b,
        object: this,
      };
    }
    return null;
  }

  cast(rayCaster: RayCaster): Intersection[] {
    const result: Intersection[] = [];
    const position = this.geometry.getAttribute('a_position');
    if (!this.visible || !position) return result;

    const { threshold } = rayCaster.params.Line;
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
      for (let i = 0; i < index.count - 1; i += 2) {
        const a = index.array[i];
        const b = index.array[i + 1];
        const check = this._checkIntersect(rayCaster, ray, [a, b], localSqThreshold);
        if (check) {
          result.push(check);
        }
      }
    } else {
      for (let i = 0; i < position.count - 1; i += 2) {
        const checked = this._checkIntersect(rayCaster, ray, [i, i + 1], localSqThreshold);
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

export { Line };
