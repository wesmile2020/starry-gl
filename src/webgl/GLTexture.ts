import {
  TextureFilter,
  TextureFormat,
  TextureWrap,
  GL_TextureFilterMapping,
  GL_TextureFormatMapping,
  GL_TextureWrapMapping,
} from "@/config/define";
import { TextureDataType } from "@/texture/Texture";

class GLTexture {
  private _gl: WebGLRenderingContext;
  private _texture: WebGLTexture | null = null;
  private _wrapS: number = -1;
  private _wrapT: number = -1;
  private _magFilter: number = -1;
  private _minFilter: number = -1;

  constructor(gl: WebGLRenderingContext) {
    this._gl = gl;
    this._texture = gl.createTexture();
  }

  bind() {
    this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
  }

  texDataTexture(level: GLint, width: number, height: number, format: TextureFormat, data: TextureDataType) {
    const formatConfig = GL_TextureFormatMapping[format];
    this._gl.texImage2D(
      this._gl.TEXTURE_2D,
      level,
      formatConfig.internalFormat,
      width,
      height,
      0,
      formatConfig.format,
      formatConfig.type,
      data
    );
  }

  texImageTexture(level: GLint, format: TextureFormat, data: TexImageSource) {
    const formatConfig = GL_TextureFormatMapping[format];

    this._gl.texImage2D(
      this._gl.TEXTURE_2D,
      level,
      formatConfig.internalFormat,
      formatConfig.format,
      formatConfig.type,
      data
    );
  }

  texParameters(wrapS: TextureWrap, wrapT: TextureWrap, magFilter: TextureFilter, minFilter: TextureFilter) {
    if (wrapS !== this._wrapS) {
      this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, GL_TextureWrapMapping[wrapS]);
      this._wrapS = wrapS;
    }
    if (wrapT !== this._wrapT) {
      this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, GL_TextureWrapMapping[wrapT]);
      this._wrapT = wrapT;
    }
    if (magFilter !== this._magFilter) {
      this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, GL_TextureFilterMapping[magFilter]);
      this._magFilter = magFilter;
    }
    if (minFilter !== this._minFilter) {
      this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, GL_TextureFilterMapping[minFilter]);
      this._minFilter = minFilter;
    }
  }

  destroy() {
    if (this._texture) {
      this._gl.deleteTexture(this._texture);
      this._texture = null;
    }
  }
}

export { GLTexture };
