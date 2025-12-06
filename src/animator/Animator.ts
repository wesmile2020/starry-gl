import { EventDispatcher } from '@/event/EventDispatcher';
import { bindAll } from '@/utils/utils';
import { linear } from '@/animator/AnimateFunction';
import { browser } from '@/utils/browser';

interface AnimatorEvent<T> {
  update: T;
  stop: T;
  complete: T;
}

type Easing = (e: number) => number;

class Animator<T extends Record<string, number> = Record<string, number>> extends EventDispatcher<AnimatorEvent<T>> {
  private _start: T;
  private _end: T;
  private _current: T;
  private _duration: number;
  private _timer?: number;
  private _startTime: number = 0;
  private _progress: number = 0;
  private _easing: Easing = linear;

  constructor(start: T, end: T, duration: number) {
    super();
    bindAll([
      '_frame',
    ], this);
    this._start = start;
    this._end = end;
    this._duration = duration;
    this._current = { ...this._start };
  }

  private _frame<K extends keyof T>() {
    const now = Date.now();
    this._progress = (now - this._startTime) / this._duration;
    if (this._progress >= 1) {
      this.fire('update', this._end);
      this.fire('complete', this._end);
    } else {
      this._timer = browser.requestAnimationFrame(this._frame);
      const percent = this._easing(this._progress);
      const keys = Object.keys(this._end);
      for (let i = 0; i < keys.length; i += 1) {
        const step = this._end[keys[i]] - this._start[keys[i]];
        const key: K = keys[i] as K;
        this._current[key] = this._start[keys[i]] + step * percent as T[K];
      }
      this.fire('update', this._current);
    }
  }

  play() {
    if (this._duration <= 0) {
      this.fire('complete', this._end);
      return this;
    }
    if (this._timer || this._progress >= 1) return this;
    this._startTime = Date.now() - this._progress * this._duration;
    this._frame();
    return this;
  }

  stop() {
    this._stopFrameUpdate();
    this.fire('stop', this._current);
    this.clearRegister();
    return this;
  }

  pause() {
    this._stopFrameUpdate();
    return this;
  }

  private _stopFrameUpdate() {
    if (this._timer) {
      browser.cancelAnimationFrame(this._timer);
      delete this._timer;
    }
  }

  easing(easing: (e: number) => number) {
    this._easing = easing;
    return this;
  }
}

export { Animator };
