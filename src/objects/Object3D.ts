import { Vector3, Euler, Matrix4, MathUtils } from 'starry-math';

class Object3D {
  readonly id: string = MathUtils.generateUUID();

  renderOrder: number = 0;
  visible: boolean = true;
  readonly position: Vector3 = new Vector3();
  readonly rotation: Euler = new Euler();
  readonly scale: Vector3 = new Vector3(1, 1, 1);
  readonly matrix: Matrix4 = new Matrix4();
  readonly worldMatrix: Matrix4 = new Matrix4();

  private _parent: Object3D | null = null;

  updateMatrix() {
    this.matrix.compose(this.position, this.rotation, this.scale);

    this.updateWorldMatrix();
    return this;
  }

  updateWorldMatrix(updateParent: boolean = false) {
    if (updateParent) {
      this._parent?.updateWorldMatrix();
    }
    if (!this._parent) {
      this.worldMatrix.copy(this.matrix);
    } else {
      this.worldMatrix.multiplyMatrices(this._parent.worldMatrix, this.matrix);
    }
    return this;
  }

  applyMatrix4(matrix: Matrix4) {
    this.matrix.compose(this.position, this.rotation, this.scale);

    this.matrix.premultiply(matrix);
    this.matrix.decompose(this.position, this.rotation, this.scale);
    this.updateWorldMatrix();
    return this;
  }

  setParent(parent: Object3D | null) {
    this._parent = parent;
    this.updateMatrix();
    return this;
  }

  getParent() {
    return this._parent;
  }
}

export { Object3D };
