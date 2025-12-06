import { EventDispatcher } from '@/event/EventDispatcher';
import { WebGLRendererOptions, defaultWebGLRendererOptions } from '@/interfaces/RendererType';
import { bindAll, createCanvas } from '@/utils/utils';
import { GLContext } from './GLContext';
import { AbstractCamera } from '@/camera/AbstractCamera';
import { Scene } from '@/objects/Scene';
import { EObjectType } from '@/interfaces/ObjectType';

class WebGLRenderer extends EventDispatcher {
  autoClear: boolean = true;
  private _options: WebGLRendererOptions;
  private _canvas: HTMLCanvasElement;
  private _context: GLContext;
  private _isContextlost: boolean = false;
  private _isFirstDrawAfterContextRestore: boolean = false;
  private _gl: WebGLRenderingContext;

  constructor(options: Partial<WebGLRendererOptions>) {
    super();
    bindAll([
      '_oncontextlost',
      '_oncontextrestored'
    ], this);

    this._options = { ...defaultWebGLRendererOptions, ...options };
    const { size, pixelRatio, attributes } = this._options;
    this._canvas = this._options.canvas || createCanvas(size, pixelRatio);
    let gl = this._options.gl || null;
    if (!gl) {
      gl = this._canvas.getContext('webgl2', attributes) || this._canvas.getContext('webgl', attributes);
    }
    if (!gl) {
      throw new Error('Your browser is not support webgl');
    }
    this._gl = gl;

    this._context = new GLContext(gl);
    this._context.setSize(size[0] * pixelRatio, size[1] * pixelRatio);

    this._canvas.addEventListener('webglcontextlost', this._oncontextlost);
    this._canvas.addEventListener('webglcontextrestored', this._oncontextrestored);
  }

  private _oncontextlost() {
    console.log('StarryGL: WebGLContext lost');
    this._isContextlost = true;
  }

  private _oncontextrestored() {
    console.log('StarryGL: WebGLContext restore');
    this._isContextlost = false;
    this._isFirstDrawAfterContextRestore = true;
    this._context.destroy();

    const { size, pixelRatio } = this._options;
    this._context = new GLContext(this._gl);
    this._context.setSize(size[0] * pixelRatio, size[1] * pixelRatio);
  }

  setSize(width: number, height: number) {
    this._options.size = [width, height];
    const { pixelRatio } = this._options;
    this._canvas.width = width * pixelRatio;
    this._canvas.height = height * pixelRatio;
    this._canvas.style.width = `${width}px`;
    this._canvas.style.height = `${height}px`;
    this._context.setSize(width * pixelRatio, height * pixelRatio);
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
    if (this._isContextlost) {
      return;
    }

    if (this.autoClear) {
      this._context.clear();
    }

    // depth first each
    const queue = [...scene.children];
    while (queue.length > 0) {
      const item = queue.shift()!;
      if (item.visible) {
        if (item.type === EObjectType.groupObject) {
          queue.unshift(...item.children);
        } else {
          this._context.drawObject(camera, item, this._isFirstDrawAfterContextRestore);
        }
      }
    }
    this._isFirstDrawAfterContextRestore = false;
  }

  get domElement() {
    return this._canvas;
  }

  get gl() {
    return this._gl;
  }
}

export { WebGLRenderer };
