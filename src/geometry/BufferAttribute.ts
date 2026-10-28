import { BufferDataType } from "@/config/define";
import { GLBuffer } from "@/webgl/GLBuffer";
import { WebGPUBuffer } from "@/webgpu/WebGPUBuffer";

export type AttributeDataType = Float32Array | Uint8Array | Uint16Array | Uint32Array;

interface InternalAttributeData {
  glBuffer?: GLBuffer;
  gpuBuffer?: WebGPUBuffer;
}

export type ItemSize = 1 | 2 | 3 | 4;
export abstract class BufferAttribute<T extends AttributeDataType = AttributeDataType> {
  private _itemSize: ItemSize;
  private _array: T;
  private _count: number;
  private _type: BufferDataType;

  needsUpdate: boolean = true;

  __internalAttributeData: InternalAttributeData = {};

  constructor(array: T, itemSize: ItemSize, type: BufferDataType) {
    this._array = array;
    this._itemSize = itemSize;
    this._count = array.length / itemSize;
    this._type = type;
  }

  updateSource(array: T, itemSize: ItemSize, type: BufferDataType) {
    this._array = array;
    this._itemSize = itemSize;
    this._count = array.length  / itemSize;
    this._type = type;
    this.needsUpdate = true;
  }

  get type() {
    return this._type;
  }

  get array() {
    return this._array;
  }

  get itemSize() {
    return this._itemSize;
  }

  get count() {
    return this._count;
  }

  destroy() {
    if (this.__internalAttributeData.glBuffer) {
      this.__internalAttributeData.glBuffer.destroy();
      delete this.__internalAttributeData.glBuffer;
    }
    if (this.__internalAttributeData.gpuBuffer) {
      this.__internalAttributeData.gpuBuffer.destroy();
      delete this.__internalAttributeData.gpuBuffer;
    }
  }

  private _setValue(index: number, value: number) {
    this._array[index] = value;
    this.needsUpdate = true;
  }

  getX(index: number) {
    return this._array[index * this._itemSize];
  }

  setX(index: number, num: number) {
    this._setValue(index * this._itemSize, num);
  }

  getY(index: number) {
    return this._array[index * this._itemSize + 1];
  }

  setY(index: number, num: number) {
    this._setValue(index * this._itemSize + 1, num);
  }

  getZ(index: number) {
    return this._array[index * this._itemSize + 2];
  }

  setZ(index: number, num: number) {
    this._setValue(index * this._itemSize + 2, num);
  }

  getW(index: number) {
    return this._array[index * this._itemSize + 3];
  }

  setW(index: number, num: number) {
    this._setValue(index * this._itemSize + 3, num);
  }
}

export class Float32BufferAttribute extends BufferAttribute<Float32Array> {
  constructor(array: ArrayLike<number>, itemSize: ItemSize) {
    super(new Float32Array(array), itemSize, BufferDataType.float32);
  }
}

export class Uint32BufferAttribute extends BufferAttribute<Uint32Array> {
  constructor(array: ArrayLike<number>, itemSize: ItemSize) {
    super(new Uint32Array(array), itemSize, BufferDataType.uint32);
  }
}

export class Uint16BufferAttribute extends BufferAttribute<Uint16Array> {
  constructor(array: ArrayLike<number>, itemSize: ItemSize) {
    super(new Uint16Array(array), itemSize, BufferDataType.uint16);
  }
}

export class Uint8BufferAttribute extends BufferAttribute<Uint8Array> {
  constructor(array: ArrayLike<number>, itemSize: ItemSize) {
    super(new Uint8Array(array), itemSize, BufferDataType.uint8);
  }
}
