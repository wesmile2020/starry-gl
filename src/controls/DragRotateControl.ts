import { Vector2 } from 'starry-math';
import { AbstractControl } from './AbstractControl';
import { PerspectiveControl } from './PerspectiveControl';

interface EventMap {
  changeStart: UIEvent;
  change: UIEvent;
  changeEnd: UIEvent;
}

class DragRotateControl extends AbstractControl<EventMap> {
  private _lastPoint?: Vector2;
  private _lastBearing: number = 0;
  private _currentPoint: Vector2 = new Vector2();
  private _event?: UIEvent;

  mousedown(e: MouseEvent) {
    if (e.buttons !== 2) return;
    this._lastPoint = new Vector2(e.clientX, e.clientY);
    this._currentPoint.set(e.clientX, e.clientY);
    this._lastBearing = this.control.getBearing();
    this._startFrameUpdate();
    this.fire('changeStart', e);
  }

  protected _frameUpdate(): void {
    const delta = this._currentPoint.clone().subtract(this._lastPoint!);
    const bearing = this._lastBearing + delta.x / 3;
    const inertiaBearing = PerspectiveControl.normalizeBearing(bearing, this._lastBearing);
    const pitch = this.control.getPitch() - delta.y / 3;
    this.control.set({ bearing, pitch });
    this._inertia.record({ bearing: inertiaBearing, pitch });
    this._lastBearing = inertiaBearing;
    this._lastPoint!.set(this._currentPoint.x, this._currentPoint.y);
    this.fire('change', this._event!);
  }

  mousemove(e: MouseEvent) {
    if (!this._lastPoint || e.buttons !== 2) return;
    this._currentPoint.set(e.clientX, e.clientY);
    this._event = e;
  }

  mouseup(e: MouseEvent) {
    this._stopFrameUpdate();
    if (!this._lastPoint) return;
    this.fire('changeEnd', e);
    delete this._lastPoint;
  }

  mouseleave(e: MouseEvent) {
    this._stopFrameUpdate();
    if (!this._lastPoint) return;
    this.fire('changeEnd', e);
    delete this._lastPoint;
  }
}

export { DragRotateControl };
