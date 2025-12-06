import { MathUtils } from 'starry-math';
import { Object3D } from '@/objects/Object3D';
import { EObjectType, RenderObject } from '@/interfaces/ObjectType';

class Group extends Object3D {
  readonly children: (Group | RenderObject)[] = [];
  readonly type: EObjectType.groupObject = EObjectType.groupObject;

  addObject(object: Group | RenderObject) {
    if (object.getParent()) {
      return this;
    }

    object.setParent(this);
    object.updateWorldMatrix(false);
    this.children.push(object);

    return this;
  }

  removeObject(object: Group | RenderObject) {
    const index = this.children.indexOf(object);
    if (index === -1) {
      return this;
    }
    object.setParent(null);
    this.children.splice(index, 1);
    return this;
  }

  override updateWorldMatrix(updateParent?: boolean): this {
    super.updateWorldMatrix(updateParent);
    for (let i = 0; i < this.children.length; i += 1) {
      this.children[i].updateWorldMatrix(false);
    }
    return this;
  }

  sortObject() {
    MathUtils.mergeSort(this.children, (a, b) => a.renderOrder - b.renderOrder);
    for (let i = 0; i < this.children.length; i += 1) {
      const item = this.children[i];
      if (item.type === EObjectType.groupObject) {
        item.sortObject();
      }
    }
    return this;
  }

  clear() {
    for (let i = 0; i < this.children.length; i += 1) {
      this.children[i].setParent(null);
    }
    this.children.length = 0;
    return this;
  }
}

export { Group };
