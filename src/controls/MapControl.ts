import { Vector2 } from 'starry-math';
import { EventDispatcher } from '@/event/EventDispatcher';
import { DragPanControl } from './DragPanControl';
import { DragRotateControl } from './DragRotateControl';
import { TouchControl, TouchType } from './TouchControl';
import { ScrollZoomControl } from './ScrollZoomControl';
import { bindAll } from '@/utils/utils';
import { PerspectiveControl } from './PerspectiveControl';
import { Inertia } from './Inertia';

type EventName = 'drag' | 'bearing' | 'pitch' | 'zoom';

function touchTypeToArray(type: TouchType): EventName[] {
  if (type === 'zoom-bearing') {
    return ['zoom', 'bearing'];
  }
  return [type];
}

interface EventItem {
  event?: UIEvent;
  point?: Vector2;
  names: EventName[];
}

interface ControlEventMap {
  changeStart: EventItem;
  change: EventItem;
  changeEnd: EventItem;
  click: Omit<EventItem, 'names'>;
}

class MapControl extends EventDispatcher<ControlEventMap> {
  private _container: HTMLElement;
  private _dragPan: DragPanControl;
  private _dragRotate: DragRotateControl;
  private _touch: TouchControl;
  private _scrollZoom: ScrollZoomControl;
  private _control: PerspectiveControl;
  private _inertia: Inertia;

  constructor(container: HTMLElement, control: PerspectiveControl) {
    super();
    bindAll([
      '_onmousedown',
      '_onmousemove',
      '_onmouseup',
      '_onmouseleave',
      '_onwheel',
      '_ontouchstart',
      '_ontouchmove',
      '_ontouchend',
    ], this);
    this._container = container;
    this._control = control;
    this._register();
    this._inertia = new Inertia(this._control);

    this._dragPan = new DragPanControl(this._inertia);
    this._dragRotate = new DragRotateControl(this._inertia);
    this._scrollZoom = new ScrollZoomControl(this._inertia);
    this._touch = new TouchControl(this._inertia);

    this._registerEvent();
  }

  private _registerEvent() {
    let lastEvent: Omit<EventItem, 'names'>;
    this._dragPan.on('changeStart', (e) => {
      this.fire('changeStart', {
        ...e,
        names: ['drag'],
      });
    }).on('change', (e) => {
      this.fire('change', {
        ...e,
        names: ['drag'],
      });
    }).on('changeEnd', (e) => {
      lastEvent = e;
    }).on('click', (e) => {
      this.fire('click', e);
    });

    this._dragRotate.on('changeStart', (e) => {
      this.fire('changeStart', {
        event: e,
        names: ['bearing', 'pitch'],
      });
    }).on('change', (e) => {
      this.fire('change', {
        event: e,
        names: ['bearing', 'pitch'],
      });
    }).on('changeEnd', (e) => {
      lastEvent = { event: e };
    });

    this._scrollZoom.on('changeStart', (e) => {
      this.fire('changeStart', {
        event: e,
        names: ['zoom'],
      });
    }).on('change', (e) => {
      this.fire('change', {
        event: e,
        names: ['zoom'],
      });
    }).on('changeEnd', (e) => {
      this.fire('changeEnd', {
        event: e,
        names: ['zoom'],
      });
    });

    this._touch.on('changeStart', (e) => {
      this.fire('changeStart', {
        event: e.event as UIEvent,
        names: touchTypeToArray(e.type),
      });
    }).on('change', (e) => {
      this.fire('change', {
        event: e.event as UIEvent,
        names: touchTypeToArray(e.type),
      });
    }).on('changeEnd', (e) => {
      lastEvent = { event: e.event as UIEvent };
    });

    this._inertia.on('changeStart', (e) => {
      this.fire('change', {
        ...lastEvent,
        names: e,
      });
    }).on('change', (e) => {
      this.fire('change', {
        ...lastEvent,
        names: e,
      });
    }).on('changeEnd', (e) => {
      this.fire('changeEnd', {
        ...lastEvent,
        names: e,
      });
    });
  }

  private _register() {
    this._container.addEventListener('mousedown', this._onmousedown);
    this._container.addEventListener('mousemove', this._onmousemove);
    this._container.addEventListener('mouseup', this._onmouseup);
    this._container.addEventListener('mouseleave', this._onmouseleave);
    this._container.addEventListener('wheel', this._onwheel);
    this._container.addEventListener('touchstart', this._ontouchstart);
    this._container.addEventListener('touchmove', this._ontouchmove);
    this._container.addEventListener('touchend', this._ontouchend);
    this._container.addEventListener('contextmenu', MapControl.stopEvent);
  }

  private _unregister() {
    this._container.removeEventListener('mousedown', this._onmousedown);
    this._container.removeEventListener('mousemove', this._onmousemove);
    this._container.removeEventListener('mouseup', this._onmouseup);
    this._container.removeEventListener('mouseleave', this._onmouseleave);
    this._container.removeEventListener('wheel', this._onwheel);
    this._container.removeEventListener('touchstart', this._ontouchstart);
    this._container.removeEventListener('touchmove', this._ontouchmove);
    this._container.removeEventListener('touchend', this._ontouchend);
    this._container.removeEventListener('contextmenu', MapControl.stopEvent);
  }

  private _onmousedown(e: MouseEvent) {
    MapControl.stopEvent(e);
    this._dragPan.mousedown(e);
    this._dragRotate.mousedown(e);
    this._inertia.stop();
  }

  private _onmousemove(e: MouseEvent) {
    MapControl.stopEvent(e);
    this._dragPan.mousemove(e);
    this._dragRotate.mousemove(e);
  }

  private _onmouseup(e: MouseEvent) {
    MapControl.stopEvent(e);
    this._dragPan.mouseup(e);
    this._dragRotate.mouseup(e);
    this._inertia.inertiaEasing();
  }

  private _onmouseleave(e: MouseEvent) {
    MapControl.stopEvent(e);
    this._dragPan.mouseleave(e);
    this._dragRotate.mouseleave(e);
    this._inertia.inertiaEasing();
  }

  private _onwheel(e: WheelEvent) {
    MapControl.stopEvent(e);
    this._scrollZoom.wheel(e);
    this._inertia.stop();
  }

  private _ontouchstart(e: TouchEvent) {
    MapControl.stopEvent(e);
    this._touch.touchstart(e);
    this._inertia.stop();
  }

  private _ontouchmove(e: TouchEvent) {
    MapControl.stopEvent(e);
    this._touch.touchmove(e);
  }

  private _ontouchend(e: TouchEvent) {
    MapControl.stopEvent(e);
    this._touch.touchend(e);
    this._inertia.inertiaEasing();
  }

  destroy() {
    this._unregister();
    this._dragPan.clearRegister();
    this._dragRotate.clearRegister();
    this._touch.clearRegister();
    this._scrollZoom.clearRegister();
    this._inertia.clearRegister();
    this._inertia.clearRegister();
  }

  static stopEvent(e: TouchEvent | MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
  }
}

export { MapControl };
