import { Vector2, Vector3 } from 'starry-math';
import { EventDispatcher } from '@/event/EventDispatcher';
import { Animator } from '@/animator/Animator';
import { easeOutCirc } from '@/animator/AnimateFunction';
import { PerspectiveControl } from './PerspectiveControl';

interface InertiaOptions {
  linearity: number;
  maxSpeed: number;
  deceleration: number;
}

const DRAG_INERTIA_OPTIONS: InertiaOptions = {
  linearity: 0.3,
  maxSpeed: 1400,
  deceleration: 2500,
};

const BEARING_INERTIA_OPTIONS: InertiaOptions = {
  linearity: 0.25,
  maxSpeed: 180,
  deceleration: 720,
};

const PITCH_INERTIA_OPTIONS: InertiaOptions = {
  linearity: 0.3,
  maxSpeed: 180,
  deceleration: 800,
};

const ZOOM_INERTIA_OPTIONS: InertiaOptions = {
  linearity: 0.15,
  maxSpeed: 2.5,
  deceleration: 12,
};

interface InertiaData {
  drag?: Vector2;
  bearing?: number;
  pitch?: number;
  zoom?: number;
  center?: Vector2;
  around?: Vector3;
}

interface InertiaItem {
  time: number;
  data: InertiaData;
}

type EventName = 'drag' | 'bearing' | 'pitch' | 'zoom';

interface EventMap {
  changeStart: EventName[];
  change: EventName[];
  changeEnd: EventName[];
}

class Inertia extends EventDispatcher<EventMap> {
  private _inertias: InertiaItem[] = [];
  private _animator?: Animator<{ num: number }>;
  private _control: PerspectiveControl;

  constructor(control: PerspectiveControl) {
    super();
    this._control = control;
  }

  get control() {
    return this._control;
  }

  record(data: InertiaData) {
    this._inertias.push({ time: Date.now(), data });
  }

  stop() {
    this._animator?.stop();
    delete this._animator;
  }

  private _drainInertias() {
    const now = Date.now();

    let index = -1;
    for (let i = this._inertias.length - 1; i >= 0; i -= 1) {
      if (now - this._inertias[i].time > 160) {
        index = i;
        break;
      }
    }
    if (index !== -1) {
      this._inertias = this._inertias.slice(index + 1);
    }
  }

  inertiaEasing() {
    this._drainInertias();
    if (this._inertias.length < 2) return;
    const start = this._inertias[0];
    const end = this._inertias[this._inertias.length - 1];
    this._inertias.length = 0;
    let duration = 0;
    let offset = new Vector2(0, 0);

    const eventName: EventName[] = [];

    const dragInertia = Inertia.initDragInertia(start, end);
    if (dragInertia) {
      offset = dragInertia.dragDelta;
      duration = Math.max(duration, dragInertia.duration);
      eventName.push('drag');
    }
    let bearingDelta = 0;
    const bearingInertial = Inertia.initBearingInertia(start, end);
    if (bearingInertial) {
      bearingDelta = bearingInertial.bearingDelta;
      duration = Math.max(duration, bearingInertial.duration);
      eventName.push('bearing');
    }
    let pitchDelta = 0;
    const pitchInertia = Inertia.initPitchInertia(start, end);
    if (pitchInertia) {
      pitchDelta = pitchInertia.pitchDelta;
      duration = Math.max(duration, pitchInertia.duration);
      eventName.push('pitch');
    }
    let zoomDelta = 0;
    const zoomInertia = Inertia.initZoomInertia(start, end);
    if (zoomInertia) {
      zoomDelta = zoomInertia.zoomDelta;
      duration = Math.max(duration, zoomInertia.duration);
      eventName.push('zoom');
    }

    if (duration === 0) {
      this.fire('changeEnd', eventName);
      return;
    }
    const pointAtOffset = this._control.centerPoint.clone().add(offset);
    const from = this._control.screenToWorld(pointAtOffset);
    const centerDelta = this._control.getCenter().clone().subtract(from);
    const startBearing = this._control.getBearing();
    const startPitch = this._control.getPitch();
    const startZoom = this._control.getZoom();
    this.fire('changeStart', eventName);
    this._animator = new Animator({ num: 0 }, { num: 1 }, duration * 1000).easing(easeOutCirc);
    this._animator.on('update', ({ num }) => {
      this._control.set({
        bearing: startBearing + bearingDelta * num,
        pitch: startPitch + pitchDelta * num,
        zoom: startZoom + zoomDelta * num,
      });
      if (end.data.around && end.data.center) {
        this._control.setCenterAtPoint(end.data.around, end.data.center);
      } else {
        const delta = centerDelta.clone().multiplyScalar(num);
        const newCenter = from.clone().add(delta);
        this._control.setCenterAtPoint(newCenter, pointAtOffset);
      }
      this.fire('change', eventName);
    }).on('complete', () => {
      delete this._animator;
      this.fire('changeEnd', eventName);
    }).on('stop', () => {
      delete this._animator;
      this.fire('changeEnd', eventName);
    }).play();
  }

  static initDragInertia(start: InertiaItem, end: InertiaItem) {
    const startPan = start.data.drag;
    const endPan = end.data.drag;
    if (!startPan || !endPan) return null;
    const flingOffset = endPan.clone().subtract(startPan);
    const flingDuration = (end.time - start.time) / 1000;
    const inertiaResult = Inertia.initVectorInertia(flingOffset, flingDuration, DRAG_INERTIA_OPTIONS);
    if (!inertiaResult) {
      return { dragDelta: new Vector2(0, 0), duration: 0 };
    }
    return { dragDelta: inertiaResult.offset, duration: inertiaResult.duration };
  }

  static initBearingInertia(start: InertiaItem, end: InertiaItem) {
    const startBearing = start.data.bearing;
    const endBearing = end.data.bearing;
    if (typeof startBearing !== 'number' || typeof endBearing !== 'number') return null;
    const flingOffset = endBearing - startBearing;
    const flingDuration = (end.time - start.time) / 1000;
    const inertiaResult = Inertia.initNumberInertia(flingOffset, flingDuration, BEARING_INERTIA_OPTIONS);
    if (!inertiaResult) {
      return { bearingDelta: 0, duration: 0 };
    }
    return { bearingDelta: inertiaResult.offset, duration: inertiaResult.duration };
  }

  static initPitchInertia(start: InertiaItem, end: InertiaItem) {
    const startPitch = start.data.pitch;
    const endPitch = end.data.pitch;
    if (typeof startPitch !== 'number' || typeof endPitch !== 'number') return null;
    const flingOffset = endPitch - startPitch;
    const flingDuration = (end.time - start.time) / 1000;
    const inertiaResult = Inertia.initNumberInertia(flingOffset, flingDuration, PITCH_INERTIA_OPTIONS);
    if (!inertiaResult) {
      return { pitchDelta: 0, duration: 0 };
    }
    return { pitchDelta: inertiaResult.offset, duration: inertiaResult.duration };
  }

  static initZoomInertia(start: InertiaItem, end: InertiaItem) {
    const startZoom = start.data.zoom;
    const endZoom = end.data.zoom;
    if (typeof startZoom !== 'number' || typeof endZoom !== 'number') return null;
    const flingOffset = endZoom - startZoom;
    const flingDuration = (end.time - start.time) / 1000;
    const inertiaResult = Inertia.initNumberInertia(flingOffset, flingDuration, ZOOM_INERTIA_OPTIONS);
    if (!inertiaResult) {
      return { zoomDelta: 0, duration: 0 };
    }
    return { zoomDelta: inertiaResult.offset, duration: inertiaResult.duration };
  }

  static initNumberInertia(flingOffset: number, flingDuration: number, options: InertiaOptions) {
    if (flingDuration === 0 || flingOffset === 0) return null;
    const sign = flingOffset < 0 ? -1 : 1;
    let speed = Math.abs(flingOffset * options.linearity / flingDuration);
    speed = Math.min(options.maxSpeed, speed);
    const duration = speed / (options.deceleration * options.linearity);
    const offset = sign * speed * (duration / 2);
    return { duration, offset };
  }

  static initVectorInertia(flingOffset: Vector2, flingDuration: number, options: InertiaOptions) {
    if (flingOffset.length() === 0) return null;
    const velocity = flingOffset.multiplyScalar(options.linearity / flingDuration);
    const length = velocity.length();
    let speed = length;
    if (speed > options.maxSpeed) {
      speed = options.maxSpeed;
      velocity.multiplyScalar(speed / length);
    }
    const duration = speed / (options.deceleration * options.linearity);
    const offset = velocity.multiplyScalar(duration / 2);
    return { duration, offset };
  }
}

export { Inertia };
