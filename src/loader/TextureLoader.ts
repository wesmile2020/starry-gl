import { ImageTexture } from '@/texture/ImageTexture';
import { createCanvas } from '@/utils/utils';
import { DataTexture } from '@/texture/DataTexture';
import { ETextureWrap } from '@/config/define';

interface TextureOptions {
  repeat: boolean;
}

class TextureLoader {
  private _width: number = 1080;
  private _height: number = 960;
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;

  constructor(canvas?: HTMLCanvasElement) {
    this._canvas = canvas || createCanvas([this._width, this._height], 1);
    this._ctx = this._canvas.getContext('2d')!;
  }

  async load(url: string, options: Partial<TextureOptions> = {}) {
    const img = new Image();
    return new Promise<ImageTexture | DataTexture>((resolve, reject) => {
      img.src = url;
      img.decode().then(() => {
        if (options.repeat) {
          resolve(this._clampImage(img));
        } else {
          const texture = new ImageTexture(img, img.width, img.height);
          resolve(texture);
        }
      }).catch((reason) => {
        reject(new Error(`TextureLoader.load: load ${url} failed ${reason}`));
      });
    });
  }

  private _clampImage(img: HTMLImageElement) {
    const width = 2 ** Math.round(Math.log2(img.width));
    const height = 2 ** Math.round(Math.log2(img.height));
    this._ctx.drawImage(img, 0, 0, width, height);

    const imgData = this._ctx.getImageData(0, 0, width, height);
    const texture = new DataTexture(imgData.data, imgData.width, imgData.height);
    texture.wrapS = ETextureWrap.repeat;
    texture.wrapT = ETextureWrap.repeat;
    return texture;
  }
}

export { TextureLoader };
