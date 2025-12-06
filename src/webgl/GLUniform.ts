import { MatrixValue, UniformType, VectorValue } from "@/interfaces/GeometryType";
import { arrayEqual } from "@/utils/utils";

export abstract class GLUniform<T = unknown> {
  protected _gl: WebGLRenderingContext;
  protected _address: WebGLUniformLocation | null;
  protected _cache?: T;
  protected abstract _type: UniformType;

  constructor(gl: WebGLRenderingContext, address: WebGLUniformLocation | null) {
    this._gl = gl;
    this._address = address;
  }

  protected abstract _equalCache(value: T): boolean;
  protected abstract _setValue(value: T): void;

  setValue(value: T) {
    if (this._equalCache(value) || !this._address) return;
    this._setValue(value);
  }

  get type() {
    return this._type;
  }
}

export class GLIntUniform extends GLUniform<number> {
  protected _type: UniformType = 'int';

  protected _equalCache(value: number): boolean {
    return this._cache === value;
  }

  protected _setValue(value: number): void {
    this._cache = value;
    this._gl.uniform1i(this._address, value);
  }
}

export class GLFloatUniform extends GLUniform<number> {
  protected _type: UniformType = 'float';

  protected _equalCache(value: number): boolean {
    return this._cache === value;
  }

  protected _setValue(value: number): void {
    this._cache = value;
    this._gl.uniform1f(this._address, value);
  }
}

export class GLVectorUniform extends GLUniform<VectorValue> {
  protected _type: UniformType = 'vector';

  protected _equalCache(value: VectorValue): boolean {
    if (!this._cache) {
      return false;
    }
    return arrayEqual(this._cache, value);
  }

  protected _setValue(value: VectorValue): void {
    this._cache = [...value];
    if (value.length === 2) {
      this._gl.uniform2fv(this._address, value);
    } else if (value.length === 3) {
      this._gl.uniform3fv(this._address, value);
    } else if (value.length === 4) {
      this._gl.uniform4fv(this._address, value);
    }
  }
}

export class GLMatrixUniform extends GLUniform<MatrixValue> {
  protected _type: UniformType = 'matrix';

  protected _equalCache(value: MatrixValue): boolean {
    if (!this._cache) {
      return false;
    }
    return arrayEqual(this._cache, value);
  }

  protected _setValue(value: MatrixValue): void {
    this._cache = [...value];
    if (value.length === 9) {
      this._gl.uniformMatrix3fv(this._address, false, value);
    } else if (value.length === 16) {
      this._gl.uniformMatrix4fv(this._address, false, value);
    }
  }
}
