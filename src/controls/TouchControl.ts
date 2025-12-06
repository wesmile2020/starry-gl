import { Vector2, Vector3 } from 'starry-math';
import { WXTouchEvent, getPointsFromTouch, findNearPointIndex } from '@/utils/control.utils';
import { AbstractControl } from './AbstractControl';
import { PerspectiveControl } from './PerspectiveControl';
import { Inertia } from './Inertia';

export type TouchType = 'zoom-bearing' | 'pitch' | 'drag';

interface EventItem {
  event: UIEvent | WXTouchEvent;
  type: TouchType;
}

interface EventMap {
  changeStart: EventItem;
  change: EventItem;
  changeEnd: EventItem;
  click: {
    point: Vector2;
    event: UIEvent | WXTouchEvent;
  };
}

function getEventData(start: Vector2[], end: Vector2[]) {
  const lastVector = start[1].clone().subtract(start[0]);
  const curVector = end[1].clone().subtract(end[0]);

  const center = end[0].clone().add(end[1]).divideScalar(2);

  const bearing = curVector.angleTo(lastVector) / Math.PI * 180;
  const zoom = curVector.length() / lastVector.length();
  const deltaY1 = end[0].y - start[0].y;
  const deltaY2 = end[1].y - start[1].y;

  let pitch = 0;
  if (deltaY1 * deltaY2 >= 0 && Math.abs(deltaY1 - deltaY2) < 32) {
    pitch = (deltaY1 + deltaY2) / -4;
  }
  return { center, bearing, zoom, pitch };
}

interface Options {
  clickThreshold: number;
}

const defaultOptions: Options = {
  clickThreshold: 2,
};

class TouchControl extends AbstractControl<EventMap> {
  private _startTouches?: Vector2[];
  private _lastTouches?: Vector2[];
  private _currentTouches?: Vector2[];
  private _isHasDiff: boolean = false;
  private _isHasRecordFirst: boolean = false;
  private _firstTime: number = 0;
  private _worldAround?: Vector3;
  private _lastBearing: number = 0;
  private _event?: UIEvent | WXTouchEvent;
  private _mode: 'init' | TouchType = 'init';
  private _options: Options;

  constructor(inertia: Inertia, options?: Partial<Options>) {
    super(inertia);

    this._options = { ...defaultOptions, ...options };
  }

  touchstart(e: TouchEvent | WXTouchEvent) {
    const points = getPointsFromTouch(e);
    const start = points[0];
    this._startTouches = [start];
    this._lastTouches = [start];
    this._currentTouches = [start];
    if (points.length > 1) {
      const end = points[points.length - 1];
      this._startTouches.push(end);
      this._lastTouches.push(end);
      this._currentTouches.push(end);
      const around = start.clone().add(end).divideScalar(2);
      this._worldAround = this.control.screenToWorld(around);
    }
    this._lastBearing = this.control.getBearing();
  }

  private _zoomRotateHandle() {
    const data = getEventData(this._lastTouches!, this._currentTouches!);
    this._lastTouches = this._currentTouches;
    let zoom = this.control.getZoom();
    zoom = Math.log2(2 ** zoom * data.zoom);
    const bearing = this._lastBearing + data.bearing;
    const inertiaBearing = PerspectiveControl.normalizeBearing(bearing, this._lastBearing);
    const pitch = this.control.getPitch() + data.pitch;
    this._lastBearing = inertiaBearing;

    if (this._mode === 'pitch') {
      this.control.set({ pitch });
      this._inertia.record({ pitch });
    }
    if (this._mode === 'zoom-bearing') {
      this.control.set({ zoom, bearing });
      this.control.setCenterAtPoint(this._worldAround!, data.center);
      this._inertia.record({
        zoom,
        bearing,
        pitch,
        center: data.center,
        around: this._worldAround!,
      });
    }
  }

  private _dragHandle() {
    const world = this.control.screenToWorld(this._lastTouches![0]);
    this._lastTouches = this._currentTouches;
    this.control.setCenterAtPoint(world, this._currentTouches![0]);
    this._inertia.record({ drag: this._currentTouches![0] });
  }

  protected _frameUpdate(): void {
    if (this._mode === 'drag') {
      this._dragHandle();
    }
    if (this._mode === 'zoom-bearing' || this._mode === 'pitch') {
      this._zoomRotateHandle();
    }
    this.fire('change', { event: this._event!, type: this._mode as TouchType });
  }

  private _diff(touches: Vector2[]) {
    if (this._isHasDiff) return;

    if (!this._isHasRecordFirst) {
      this._isHasRecordFirst = true;
      this._firstTime = Date.now();
    } else if (Date.now() - this._firstTime > 32) {
      this._isHasDiff = true;
      if (this._startTouches!.length > 1 && touches.length > 1) {
        const { zoom, bearing, pitch } = getEventData(this._startTouches!, touches);
        const isPitch = (Math.abs(1 - zoom) < 0.1 && Math.abs(bearing) < 5 && Math.abs(pitch) > 0.5);
        this._mode = isPitch ? 'pitch' : 'zoom-bearing';
      } else {
        this._mode = 'drag';
      }
      this.fire('changeStart', { event: this._event!, type: this._mode as TouchType });
      this._startFrameUpdate();
    }
  }

  touchmove(e: TouchEvent | WXTouchEvent) {
    if (!this._lastTouches) return;
    const points = getPointsFromTouch(e);
    const result = [];
    for (let i = 0; i < this._lastTouches.length; i += 1) {
      const nearIndex = findNearPointIndex(this._lastTouches[i], points);
      result.push(points[nearIndex]);
      points.splice(nearIndex, 1);
    }
    this._currentTouches = result;
    this._diff(this._currentTouches);
    this._event = e;
  }

  touchend(e: TouchEvent | WXTouchEvent) {
    this._stopFrameUpdate();
    if (!this._lastTouches || !this._startTouches) return;
    if (this._lastTouches.length === 1 && this._startTouches.length === 1) {
      const distance = this._lastTouches[0].distanceTo(this._startTouches[0]);
      if (distance < this._options.clickThreshold) {
        this.fire('click', {
          point: this._lastTouches[0],
          event: e,
        });
      }
    }
    this._isHasDiff = false;
    this._isHasRecordFirst = false;
    delete this._lastTouches;
    delete this._currentTouches;
    delete this._startTouches;
    this.fire('changeEnd', { event: e, type: this._mode as TouchType });
    this._mode = 'init';
  }
}

export { TouchControl };
