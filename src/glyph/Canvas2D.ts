import { createCanvas } from '@/utils/utils';



class Canvas2D {
  private _width: number;
  private _height: number;
  private _pixelRatio: number;
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;

  constructor(width: number, height: number, pixelRatio: number, settings?: CanvasRenderingContext2DSettings) {
    this._width = width;
    this._height = height;
    this._pixelRatio = pixelRatio;
    this._canvas = createCanvas([width, height], pixelRatio);
    this._ctx = this._canvas.getContext('2d', settings)!;
  }

  getContext() {
    return this._ctx;
  }

  getCanvas() {
    return this._canvas;
  }

  clear() {
    this._ctx.clearRect(0, 0, this._width * this._pixelRatio, this._height * this._pixelRatio);
  }

  getWidth() {
    return this._width;
  }

  getHeight() {
    return this._height;
  }

  getPixelRatio() {
    return this._pixelRatio;
  }
}

export { Canvas2D };
