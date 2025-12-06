import { Ray, Vector3, MathUtils } from 'starry-math';
import { AbstractCamera } from '@/camera/AbstractCamera';
import { EObjectType, RenderObject } from '@/interfaces/ObjectType';
import { Coordinate2D } from '@/interfaces/GeometryType';
import { Group } from '@/objects/Group';

class RayCaster {
  private _ray: Ray;
  near: number;
  far: number;
  private _camera?: AbstractCamera;

  readonly params = {
    Line: { threshold: 1 },
    Point: { threshold: 1 },
  };

  constructor(origin?: Vector3, direction?: Vector3, near: number = 0, far: number = Infinity) {
    this._ray = new Ray(origin, direction);
    this.near = near;
    this.far = far;
  }

  set(origin: Vector3, direction: Vector3) {
    this._ray.set(origin, direction);
  }

  setFromCamera(point: Coordinate2D, camera: AbstractCamera) {
    if (camera.type === 'PerspectiveCamera') {
      this._camera = camera;
      const array = camera.viewMatrixInvert.toArray();
      this.ray.origin.set(array[12], array[13], array[14]);
      const direction = camera.unproject(new Vector3(point.x, point.y, 0.5));
      direction.subtract(this.ray.origin).unit();
      this.ray.direction.copy(direction);
    } else {
      console.error('RayCaster: Unsupported this camera');
    }
  }

  intersectObject(object: RenderObject) {
    if (!this._camera) return [];
    return object.cast(this);
  }

  intersectGroup(group: Group) {
    if (!group.visible) return [];
    const result = [];
    // depth first each
    const arr = [...group.children];
    while (arr.length !== 0) {
      const item = arr.shift()!;
      if (item.visible) {
        if (item.type === EObjectType.groupObject) {
          arr.unshift(...item.children);
        } else {
          const intersect = item.cast(this);
          result.push(...intersect);
        }
      }
    }
    MathUtils.mergeSort(result, (a, b) => a.distance - b.distance);
    return result;
  }

  get ray() {
    return this._ray;
  }

  get camera() {
    return this._camera;
  }
}

export { RayCaster };
