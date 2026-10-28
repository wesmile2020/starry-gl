import { MathUtils } from 'starry-math';
import { Group } from '@/objects/Group';
import { ObjectType, RenderObject } from '@/interfaces/ObjectType';

type SceneObject = Group | RenderObject;

class Scene {
  private _children: SceneObject[] = [];

  add(object: SceneObject) {
    this._children.push(object);
    return this;
  }

  remove(object: SceneObject) {
    const index = this._children.indexOf(object);
    if (index === -1) {
      return;
    }
    this._children.splice(index, 1);
    return this;
  }

  sortObject() {
    for (let i = 0; i < this._children.length; i += 1) {
      const item = this._children[i];
      if (item.type === ObjectType.groupObject) {
        item.sortObject();
      }
    }
    MathUtils.mergeSort(this._children, (a, b) => a.renderOrder - b.renderOrder);
    return this;
  }

  get children() {
    return this._children;
  }

  clear() {
    this._children.length = 0;
  }
}

export { Scene };
