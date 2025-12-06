import { Vector2, Vector3 } from 'starry-math';
import { bindAll } from '@/utils/utils';
import { AbstractControl } from './AbstractControl';
import { Inertia } from './Inertia';

interface EventMap {
  changeStart: UIEvent;
  change: UIEvent;
  changeEnd: UIEvent;
}

class ScrollZoomControl extends AbstractControl<EventMap> {
  private _stopTimer?: number;
  private _around?: Vector2;
  private _world?: Vector3;
  private _targetZoom: number = 0;
  private _event?: UIEvent;

  constructor(inertia: Inertia) {
    super(inertia);
    bindAll([
      'stop',
    ], this);
  }

  protected _frameUpdate(): void {
    this._targetZoom /= 2;
    const zoom = this.control.getZoom() + this._targetZoom;
    this.control.set({ zoom });
    this.control.setCenterAtPoint(this._world!, this._around!);
    this.fire('change', this._event!);
  }

  wheel(e: WheelEvent) {
    if (e.deltaY === 0) return;
    this._event = e;
    if (this._stopTimer) {
      clearTimeout(this._stopTimer);
      delete this._stopTimer;
    }
    this._around = new Vector2(e.clientX, e.clientY);
    this._world = this.control.screenToWorld(this._around);
    const sign = e.deltaY > 0 ? -1 : 1;
    this._targetZoom = Math.log10(Math.abs(e.deltaY)) / 10 * sign;
    if (typeof this._timer !== 'number') {
      this.fire('changeStart', e);
      this._startFrameUpdate();
    }
    this._stopTimer = window.setTimeout(this.stop, 300);
  }

  stop() {
    this._stopFrameUpdate();
    this.fire('changeEnd', this._event!);
  }
}

export { ScrollZoomControl };
