import { EventDispatcher } from '@/event/EventDispatcher';
import { Inertia } from './Inertia';
import { bindAll } from '@/utils/utils';
import { browser } from '@/utils/browser';

abstract class AbstractControl<T> extends EventDispatcher<T> {
  protected _inertia: Inertia;
  protected _timer?: number;
  protected _isEnabled: boolean = true;

  constructor(inertia: Inertia) {
    super();
    bindAll([
      '_update',
    ], this);
    this._inertia = inertia;
  }

  enable() {
    this._isEnabled = true;
  }

  disable() {
    this._isEnabled = false;
  }

  protected abstract _frameUpdate(): void;

  private _update() {
    this._frameUpdate();
    this._timer = browser.requestAnimationFrame(this._update);
  }

  protected _startFrameUpdate() {
    if (typeof this._timer !== 'number') {
      this._update();
    }
  }

  protected _stopFrameUpdate() {
    if (typeof this._timer === 'number') {
      browser.cancelAnimationFrame(this._timer);
      delete this._timer;
    }
  }

  get control() {
    return this._inertia.control;
  }
}

export { AbstractControl };
