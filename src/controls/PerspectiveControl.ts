import { MathUtils, EulerOrder, Vector2, Vector3 } from 'starry-math';
import { PerspectiveCamera } from '@/camera/PerspectiveCamera';
import { Coordinate2D, Coordinate3D } from '@/interfaces/GeometryType';

export interface ChangeOptions {
  zoom?: number;
  center?: Coordinate3D;
  bearing?: number;
  pitch?: number;
}

const EARTH_RADIUS = 6371008.8;
const EARTH_CIRCUMFERENCE = Math.PI * 2 * EARTH_RADIUS;
const MAX_PITCH = 85;

class PerspectiveControl {
  private _camera: PerspectiveCamera;
  private _width: number;
  private _height: number;
  private _center: Vector3 = new Vector3();
  private _zoom: number = 15;
  private _bearing: number = 0;
  private _pitch: number = 0;
  private _minZoom: number = 10;
  private _maxZoom: number = 22;
  private _minPitch: number = 0;
  private _maxPitch: number = MAX_PITCH;

  constructor(camera: PerspectiveCamera, width: number, height: number) {
    this._width = width;
    this._height = height;

    this._camera = camera;
    this._camera.rotation.order = EulerOrder.ZYX;
    this._camera.resolution.set(width, height);

    this._calculate();

    console.log(this._camera);
  }

  getWidth() {
    return this._width;
  }

  getHeight() {
    return this._height;
  }

  get centerPoint() {
    return new Vector2(this._width / 2, this._height / 2);
  }

  setSize(width: number, height: number) {
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._camera.resolution.set(width, height);
    this._width = width;
    this._height = height;
    this._calculate();
    return this;
  }

  getZoom() {
    return this._zoom;
  }

  getBearing() {
    return this._bearing;
  }

  getPitch() {
    return this._pitch;
  }

  getCenter() {
    return this._center.clone();
  }

  setMinZoom(minZoom: number) {
    this._minZoom = Math.max(minZoom, 0);
    if (this._zoom < this._minZoom) {
      this.set({ zoom: this._minZoom });
    }
    return this;
  }

  getMinZoom() {
    return this._minZoom;
  }

  setMaxZoom(maxZoom: number) {
    this._maxZoom = maxZoom;
    if (this._zoom > this._maxZoom) {
      this.set({ zoom: this._maxZoom });
    }
    return this;
  }

  getMaxZoom() {
    return this._maxZoom;
  }

  setMinPitch(minPitch: number) {
    this._minPitch = Math.max(minPitch, 0);
    if (this._pitch < this._minPitch) {
      this.set({ pitch: this._minPitch });
    }
    return this;
  }

  getMinPitch() {
    return this._minPitch;
  }

  setMaxPitch(maxPitch: number) {
    this._maxPitch = Math.min(maxPitch, 85);
    if (this._pitch > this._maxPitch) {
      this.set({ pitch: this._maxPitch });
    }
    return this;
  }

  getMaxPitch() {
    return this._maxPitch;
  }

  get meterPerPixel() {
    return this._camera.meterPerPixel;
  }

  screenToWorld(point: Coordinate2D, z: number = 0) {
    const x = (point.x / this._width) * 2 - 1;
    const y = -(point.y / this._height) * 2 + 1;

    const v0 = this._camera.unproject(new Vector3(x, y, -1));
    const v1 = this._camera.unproject(new Vector3(x, y, -10));

    const worldX = (z - v0.z) * (v0.x - v1.x) / (v0.z - v1.z) + v0.x;
    const worldY = (z - v0.z) * (v0.y - v1.y) / (v0.z - v1.z) + v0.y;

    return new Vector3(worldX, worldY, z);
  }

  worldToScreen(world: Coordinate3D) {
    const vector = new Vector3(world.x, world.y, world.z);
    const point = this._camera.project(vector);
    const x = (point.x + 1) / 2 * this._width;
    const y = -(point.y - 1) / 2 * this._height;
    return new Vector2(x, y);
  }

  set(options: ChangeOptions) {
    if (typeof options.bearing === 'number') {
      this._bearing = PerspectiveControl.processBearing(options.bearing);
    }
    if (typeof options.zoom === 'number') {
      this._zoom = MathUtils.clamp(options.zoom, this._minZoom, this._maxZoom);
    }
    if (typeof options.pitch === 'number') {
      this._pitch = MathUtils.clamp(options.pitch, this._minPitch, this._maxPitch);
    }
    if (options.center) {
      this._center.set(options.center.x, options.center.y, options.center.z);
    }
    this._calculate();
    return this;
  }

  private _calculate() {
    const worldSize = 2 ** this._zoom * 512;
    const pixelsPerMeter = 1 / EARTH_CIRCUMFERENCE * worldSize;
    const worldHeight = this._height / 2 / pixelsPerMeter;

    const pitchRad = this._pitch / 180 * Math.PI;
    const halfFov = this._camera.fov / 2 / 180 * Math.PI;
    const tanFov = Math.tan(halfFov);
    const distance = worldHeight / tanFov;

    const groundAngle = Math.PI / 2 + pitchRad;
    const cameraToCenterDistance = this._height / 2 / tanFov;

    const cameraToSeaLevelDistance = cameraToCenterDistance + distance;
    const clapNum = MathUtils.clamp(Math.PI - groundAngle - halfFov, 0.01, Math.PI - 0.01);
    const topHalfSurfaceDistance = Math.sin(halfFov) * cameraToSeaLevelDistance / Math.sin(clapNum);
    const horizonDistance = cameraToSeaLevelDistance * 10;
    const furthestDistance = Math.cos(Math.PI / 2 - pitchRad) * topHalfSurfaceDistance + cameraToSeaLevelDistance;

    const farZ = Math.min(furthestDistance * 1.01, horizonDistance);
    this._camera.far = farZ;
    this._camera.updateProjectionMatrix();

    const { eye, target, up } = PerspectiveControl.calculateView(this._bearing, this._pitch, distance);
    this._camera.position.copy(eye.add(this._center));
    this._camera.target.copy(target.add(this._center));
    this._camera.up.copy(up);
    this._camera.updateViewMatrix();
  }

  getCamera() {
    return this._camera;
  }

  setCenterAtPoint(world: Coordinate3D, point: Coordinate2D) {
    const a = this.screenToWorld(point);
    const x = world.x - (a.x - this._center.x);
    const y = world.y - (a.y - this._center.y);
    const z = world.z - (a.z - this._center.z);
    this._center.set(x, y, z);
    this._calculate();
    return this;
  }

  static calculateView(bearing: number, pitch: number, distance: number) {
    const target = new Vector3();

    const p = -pitch / 180 * Math.PI;
    const r = -bearing / 180 * Math.PI;
    const k = new Vector3(0, 0, 1);

    const vy = distance * Math.sin(p);
    const vz = distance * Math.cos(p);

    const eye = new Vector3(0, vy, vz);
    eye.rotate(r, k);
    const up = new Vector3(0, vz, -vy);
    up.rotate(r, k);

    return { eye, target, up };
  }

  static processBearing(bearing: number) {
    const max = 180, min = -180;
    const d = max - min;
    const w = ((bearing - min) % d + d) % d + min;
    return (w === min) ? max : w;
  }

  static normalizeBearing(bearing: number, curBearing: number) {
    let result = PerspectiveControl.processBearing(bearing);
    const diff = Math.abs(result - curBearing);
    if (Math.abs(result - 360 - curBearing) < diff) {
      result -= 360;
    }
    if (Math.abs(result + 360 - curBearing) < diff) {
      result += 360;
    }
    return result;
  }
}

export { PerspectiveControl };
