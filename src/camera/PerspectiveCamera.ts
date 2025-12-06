import { AbstractCamera } from './AbstractCamera';

class PerspectiveCamera extends AbstractCamera {
  readonly type = 'PerspectiveCamera';

  fov: number;
  aspect: number;
  near: number;
  far: number;

  protected _meterPerPixel: number = 1;

  constructor(fov: number = 45, aspect: number = 1, near: number = 0.1, far: number = 2000) {
    super();

    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;

    this.updateProjectionMatrix();
  }

  updateProjectionMatrix() {
    this.projectionMatrix.perspective(this.fov, this.aspect, this.near, this.far);
    this.projectionMatrixInvert = this.projectionMatrix.clone().invert();
    return this;
  }

  override updateViewMatrix() {
    super.updateViewMatrix();
    const distance = this.target.distanceTo(this.position);
    const halfFov = this.fov / 2 / 180 * Math.PI;
    const worldHeight = distance * Math.tan(halfFov) * 2;
    this._meterPerPixel = worldHeight / this.resolution.y;
    return this;
  }
}

export { PerspectiveCamera };
