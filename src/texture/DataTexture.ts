import { Texture, TextureDataType } from './Texture';

class DataTexture extends Texture<'data'> {
  protected _width: number;
  protected _height: number;

  constructor(data: TextureDataType, width: number, height: number) {
    super('data', data);
    this._width = width;
    this._height = height;
  }

  updateSource(data: TextureDataType, width: number, height: number) {
    this._source = data;
    this._width = width;
    this._height = height;
    this.needsUpdate = true;
  }
}

export { DataTexture };
