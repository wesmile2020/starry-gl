import {
  TextureFilter,
  TextureFormat,
  TextureWrap,
} from '@/config/define';
import { GLTexture } from '@/webgl/GLTexture';
import { WebGPUTexture } from '@/webgpu/WebGPUTexture';

export type TextureDataType = Uint8Array | Uint8ClampedArray | Int8Array | Uint16Array | Int16Array
| Uint32Array | Int32Array | Float32Array | Float64Array;

interface TextureData {
  data: TextureDataType;
  image: TexImageSource;
}

interface InternalTextureData {
  glTexture?: GLTexture;
  gpuTexture?: WebGPUTexture;
}

abstract class Texture<T extends keyof TextureData = 'data' | 'image'> {
  private _type: T;
  protected _source: TextureData[T];

  magFilter: TextureFilter = TextureFilter.linear;
  minFilter: TextureFilter = TextureFilter.linear;
  wrapS: TextureWrap = TextureWrap.clamToEdge;
  wrapT: TextureWrap = TextureWrap.clamToEdge;
  format: TextureFormat = TextureFormat.rgba8;
  level: number = 0;

  needsUpdate: boolean = true;
  __internalTextureData: InternalTextureData = {};

  protected abstract _width: number;
  protected abstract _height: number;

  constructor(type: T, source: TextureData[T]) {
    this._type = type;
    this._source = source;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get source() {
    return this._source;
  }

  get type() {
    return this._type;
  }

  destroy() {
    if (this.__internalTextureData.glTexture) {
      this.__internalTextureData.glTexture.destroy();
      delete this.__internalTextureData.glTexture;
    }
    if (this.__internalTextureData.gpuTexture) {
      this.__internalTextureData.gpuTexture.destroy();
      delete this.__internalTextureData.gpuTexture;
    }
  }
}

export { Texture };
