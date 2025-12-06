import { Vector2 } from 'starry-math';
import { AbstractControl } from './AbstractControl';
import { Inertia } from './Inertia';

interface DragEvent {
  point: Vector2;
  event: UIEvent;
}

interface EventMap {
  changeStart: DragEvent;
  change: DragEvent;
  changeEnd: DragEvent;
  click: DragEvent;
}

interface Options {
  clickThreshold: number;
}

const defaultOptions: Options = {
  clickThreshold: 2,
};

class DragPanControl extends AbstractControl<EventMap> {
  private _lastPoint?: Vector2 = new Vector2();
  private _startPoint: Vector2 = new Vector2();
  private _currentPoint: Vector2 = new Vector2();
  private _options: Options;
  private _event?: UIEvent;

  constructor(inertia: Inertia, options: Partial<Options> = {}) {
    super(inertia);
    this._options = { ...defaultOptions, ...options };
  }

  protected _frameUpdate(): void {
    const world = this.control.screenToWorld(this._lastPoint!);
    this.control.setCenterAtPoint(world, this._currentPoint!);
    this._lastPoint!.set(this._currentPoint.x, this._currentPoint.y);
    this._inertia.record({ drag: this._currentPoint.clone() });
    this.fire('change', { point: this._currentPoint, event: this._event! });
  }

  mousedown(e: MouseEvent) {
    if (e.buttons !== 1) return;
    this._lastPoint = new Vector2(e.clientX, e.clientY);
    this._startPoint.set(e.clientX, e.clientY);
    this._currentPoint.set(e.clientX, e.clientY);
    this._startFrameUpdate();
    this.fire('changeStart', { point: this._lastPoint.clone(), event: e });
  }

  mousemove(e: MouseEvent) {
    if (!this._lastPoint || e.buttons !== 1) return;
    this._currentPoint.set(e.clientX, e.clientY);
    this._event = e;
  }

  private _reset() {
    this._startPoint.set(0, 0);
    this._currentPoint.set(0, 0);
    delete this._lastPoint;
  }

  mouseup(e: MouseEvent) {
    this._stopFrameUpdate();
    if (!this._lastPoint) return;
    const point = new Vector2(e.clientX, e.clientY);
    this.fire('changeEnd', { point: point.clone(), event: e });
    const distance = this._startPoint.distanceTo(point);
    if (distance < this._options.clickThreshold) {
      this.fire('click', { point, event: e });
    }
    this._reset();
  }

  mouseleave(e: MouseEvent) {
    this._stopFrameUpdate();
    if (!this._lastPoint) return;
    this.fire('changeEnd', { point: this._lastPoint.clone(), event: e });
    this._reset();
  }
}

export { DragPanControl };
