import { Vector2, Vector3, Vector4, Matrix4, Color, MathUtils } from 'starry-math';
import { Texture } from '@/texture/Texture';
import { AbstractCamera } from '@/camera/AbstractCamera';
import { EBlendParameter, EDrawSide } from '@/config/define';

export type UniformValue = boolean | number | Vector2 | Vector3 | Vector4 | Matrix4 | Color;

export interface MaterialParameters {
  color: string;
  opacity: number;
  transparent: boolean;
  depthTest: boolean;
  side: EDrawSide;
}

abstract class AbstractMaterial {
  transparent: boolean = true;
  depthTest: boolean = true;
  color: Color = new Color();
  opacity: number = 1;
  srcRGB: EBlendParameter = EBlendParameter.srcAlpha;
  dstRGB: EBlendParameter = EBlendParameter.oneMinusSrcAlpha;
  srcAlpha: EBlendParameter = EBlendParameter.one;
  dstAlpha: EBlendParameter = EBlendParameter.oneMinusSrcAlpha;
  side: EDrawSide = EDrawSide.front;

  protected _uniforms: Map<string, UniformValue> = new Map();
  protected _defines: Map<string, number | boolean> = new Map();
  protected _shaderKey: number;
  protected _shaderType: number;
  private _map: Texture | null = null;

  constructor(shaderType: number) {
    this._shaderType = shaderType;
    this._shaderKey = this._calculateShaderKey();
  }

  get map(): Texture | null {
    return this._map;
  }

  set map(texture: Texture | null) {
    this._map = texture;
    if (texture) {
      this.setDefine('USE_TEXTURE', true);
    } else {
      this.deleteDefine('USE_TEXTURE');
    }
  }

  copy(source: AbstractMaterial) {
    this.transparent = source.transparent;
    this.depthTest = source.depthTest;
    this.color.copy(source.color);
    this.opacity = source.opacity;
    this.srcRGB = source.srcRGB;
    this.dstRGB = source.dstRGB;
    this.srcAlpha = source.srcAlpha;
    this.dstAlpha = source.dstAlpha;
    this.side = source.side;
    this._uniforms = new Map(source._uniforms.entries());
    this._defines = new Map(source._defines.entries());
    this._shaderType = source._shaderType;
    this._shaderKey = source._shaderKey;
    this._map = source.map;

    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBeforeRender(_camera: AbstractCamera) {
    this._uniforms.set('u_color', this.color);
    this._uniforms.set('u_opacity', this.opacity);
  }

  abstract clone(): AbstractMaterial;

  setValues(parameters: Partial<MaterialParameters>) {
    this.color.setStyle(parameters.color ?? '#000');
    this.opacity = parameters.opacity ?? 1;
    this.transparent = parameters.transparent ?? true;
    this.depthTest = parameters.depthTest ?? true;

    return this;
  }

  getDefineCode() {
    const arr = [];
    this._defines.forEach((value, key) => {
      if (value !== false) {
        arr.push(`#define ${key} ${value}`);
      }
    });
    arr.push('');
    return arr.join('\n');
  }

  setUniform(key: string, value: UniformValue) {
    this._uniforms.set(key, value);
    return this;
  }

  getUniform(key: string) {
    return this._uniforms.get(key);
  }

  getUniforms() {
    return this._uniforms;
  }

  setDefine(key: string, value: number | boolean) {
    this._defines.set(key, value);
    this._shaderKey = this._calculateShaderKey();
    return this;
  }

  getDefine(key: string) {
    return this._defines.get(key);
  }

  deleteDefine(key: string) {
    this._defines.delete(key);
    this._shaderKey = this._calculateShaderKey();
    return this;
  }

  getDefines() {
    return this._defines;
  }

  protected _calculateShaderKey() {
    const code = this._shaderType + '\n' + this.getDefineCode();
    return MathUtils.hashCode(code);
  }

  getShaderKey() {
    return this._shaderKey;
  }

  getShaderType() {
    return this._shaderType;
  }

  destroy() {
    if (this._map) {
      this._map.destroy();
      this._map = null;
    }
  }
}

export { AbstractMaterial };
