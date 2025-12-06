import {
  GPUBindGroupAddress,
  MatrixValue,
  UniformType,
  VectorValue,
} from "@/interfaces/GeometryType";
import { arrayEqual } from "@/utils/utils";

export abstract class GPUUniform<T = unknown> {
  protected _device: GPUDevice;
  protected _group: number;
  protected _binding: number;
  protected _buffer?: GPUBuffer;
  protected _cache?: T;
  protected abstract _type: UniformType;

  constructor(device: GPUDevice, address: GPUBindGroupAddress) {
    this._device = device;
    this._group = address.group;
    this._binding = address.binding;
  }

  protected abstract _equalCache(value: T): boolean;
  protected abstract _setValue(value: T): void;

  setValue(value: T) {
    if (this._cache && this._equalCache(value)) {
      return;
    }
    this._setValue(value);
  }

  get buffer() {
    return this._buffer;
  }

  get group() {
    return this._group;
  }

  get binding() {
    return this._binding;
  }

  get type() {
    return this._type;
  }

  destroy() {
    if (this._buffer) {
      this._buffer.destroy();
      delete this._buffer;
    }
  }
}

export class GPUIntUniform extends GPUUniform<number> {
  protected _type: UniformType = 'int';
  private _array: Int32Array = new Int32Array(1);

  protected _equalCache(value: number): boolean {
    return this._cache === value;
  }

  protected _setValue(value: number): void {
    this._cache = value;
    this._array[0] = value;
    if (!this._buffer) {
      this._buffer = this._device.createBuffer({
        size: this._array.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    }
    this._device.queue.writeBuffer(this._buffer, 0, this._array);
  }
}

export class GPUFloatUniform extends GPUUniform<number> {
  protected _type: UniformType = 'float';
  private _array: Float32Array = new Float32Array(1);

  protected _equalCache(value: number): boolean {
    return this._cache === value;
  }

  protected _setValue(value: number): void {
    this._cache = value;
    this._array[0] = value;
    if (!this._buffer) {
      this._buffer = this._device.createBuffer({
        size: this._array.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    }
    this._device.queue.writeBuffer(this._buffer, 0, this._array);
  }
}

export class GPUVectorUniform extends GPUUniform<VectorValue> {
  protected _type: UniformType = 'vector';
  private _array: Float32Array = new Float32Array(4);

  protected _equalCache(value: VectorValue): boolean {
    if (!this._cache) {
      return false;
    }
    return arrayEqual(this._cache, value);
  }

  protected _setValue(value: VectorValue): void {
    this._cache = [...value];
    this._array.set(value);
    if (!this._buffer) {
      this._buffer = this._device.createBuffer({
        size: this._array.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    }
    this._device.queue.writeBuffer(this._buffer, 0, this._array, 0, value.length);
  }
}

export class GPUMatrixUniform extends GPUUniform<MatrixValue> {
  protected _type: UniformType ='matrix';
  private _array: Float32Array = new Float32Array(16);

  protected _equalCache(value: MatrixValue): boolean {
    if (!this._cache) {
      return false;
    }
    return arrayEqual(this._cache, value);
  }

  protected _setValue(value: MatrixValue): void {
    this._cache = [...value];
    this._array.set(value);
    if (!this._buffer) {
      this._buffer = this._device.createBuffer({
        size: this._array.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    }
    this._device.queue.writeBuffer(this._buffer, 0, this._array, 0, value.length);
  }
}
