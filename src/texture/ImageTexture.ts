import { TextureFormat } from '@/config/define';
import { Texture } from './Texture';

class ImageTexture extends Texture<'image'> {
  protected _width: number;
  protected _height: number;

  constructor(image: TexImageSource, width: number, height: number) {
    super('image', image);

    this._width = width;
    this._height = height;

    this.format = TextureFormat.rgba8;
  }

  updateSource(image: TexImageSource, width: number, height: number) {
    this._source = image;
    this._width = width;
    this._height = height;
    this.needsUpdate = true;
  }
}

export { ImageTexture };
