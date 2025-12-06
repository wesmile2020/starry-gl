import { Matrix4, Vector3, Vector2, Euler } from 'starry-math';

abstract class AbstractCamera {
  private static emptyVector3: Vector3 = new Vector3();

  abstract readonly type: 'PerspectiveCamera' | 'OrthographicCamera' | (string & {});

  viewMatrix: Matrix4 = new Matrix4();
  viewMatrixInvert: Matrix4 = new Matrix4();
  projectionMatrix: Matrix4 = new Matrix4();
  projectionMatrixInvert: Matrix4 = new Matrix4();

  position: Vector3 = new Vector3(0, 0, 100);
  up: Vector3 = new Vector3(0, 1, 0);
  target: Vector3 = new Vector3(0, 0, 0);

  resolution: Vector2 = new Vector2(1, 1);
  readonly rotation: Euler = new Euler();

  protected abstract _meterPerPixel: number;

  constructor() {
    this.updateViewMatrix();
  }

  get meterPerPixel() {
    return this._meterPerPixel;
  }

  lookAt(target: Vector3) {
    this.target.copy(target);
    this.updateViewMatrix();
    return this;
  }

  updateViewMatrix() {
    this.viewMatrix.lookAt(this.position, this.target, this.up);
    this.viewMatrixInvert = this.viewMatrix.clone().invert();
    this.viewMatrixInvert.decompose(AbstractCamera.emptyVector3, this.rotation, AbstractCamera.emptyVector3);
    return this;
  }

  project(vector: Vector3) {
    const result = vector.clone();
    result.applyMatrix4(this.viewMatrix).applyMatrix4(this.projectionMatrix);
    return result;
  }

  unproject(vector: Vector3) {
    const result = vector.clone();
    result.applyMatrix4(this.projectionMatrixInvert).applyMatrix4(this.viewMatrixInvert);
    return result;
  }
}

export { AbstractCamera };
