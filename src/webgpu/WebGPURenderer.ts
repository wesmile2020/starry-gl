import { EventDispatcher } from '@/event/EventDispatcher';
import { defaultWebGPURendererOptions, WebGPURendererOptions } from '@/interfaces/RendererType';
import { createCanvas, requestGPUDevice } from '@/utils/utils';
import { GPUContext } from './GPUContext';
import { Scene } from '@/objects/Scene';
import { AbstractCamera } from '@/camera/AbstractCamera';
import { EObjectType } from '@/interfaces/ObjectType';

class WebGPURenderer extends EventDispatcher {
  autoClear: boolean = true;
  private _options: WebGPURendererOptions;
  private _canvas: HTMLCanvasElement;
  private _context?: GPUContext;

  constructor(options: Partial<WebGPURendererOptions>) {
    super();
    this._options = { ...defaultWebGPURendererOptions, ...options };
    const { size, pixelRatio } = this._options;
    this._canvas = this._options.canvas || createCanvas(size, pixelRatio);
    let context = this._options.context || null;
    if (!context) {
      context = this._canvas.getContext("webgpu");
    }
    if (!context) {
      throw new Error("StarryGL: You browser is not support WebGPU");
    }
    if (this._options.device) {
      this._context = new GPUContext(context, this._options.device);
    } else {
      requestGPUDevice().then((device) => {
        if (device) {
          this._context = new GPUContext(context, device);
        }
      });
    }
  }

  setSize(width: number, height: number) {
    this._options.size = [width, height];
    const { pixelRatio } = this._options;
    this._canvas.width = width * pixelRatio;
    this._canvas.height = height * pixelRatio;
    this._canvas.style.width = `${width}px`;
    this._canvas.style.height = `${height}px`

    this._context?.setSize(width * pixelRatio, height * pixelRatio);
  }

  setPixelRatio(ratio: number) {
    this._options.pixelRatio = ratio;
    const [width, height] = this._options.size;
    this.setSize(width, height);
  }

  getOptions() {
    return this._options;
  }

  render(scene: Scene, camera: AbstractCamera) {
    if (!this._context) {
      return;
    }
    this._context.setClearFlag(this.autoClear);
    this._context.drawBegin();
    // depth first each
    const queue = [...scene.children];
    while (queue.length > 0) {
      const item = queue.shift()!;
      if (item.visible) {
        if (item.type === EObjectType.groupObject) {
          queue.unshift(...item.children);
        } else {
          this._context.drawObject(camera, item);
        }
      }
    }
    this._context.drawEnd();
  }

  get domElement() {
    return this._canvas;
  }
}

export { WebGPURenderer };
