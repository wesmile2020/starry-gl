import { EBufferDataType } from "@/config/define";
import { AttributeDataType } from "@/geometry/BufferAttribute";

class WebGPUBuffer {
  private _device: GPUDevice;
  private _buffer?: GPUBuffer;

  constructor(device: GPUDevice) {
    this._device = device;
  }

  bufferData(size: number, usage: number, data: AttributeDataType, type: EBufferDataType, asyncWrite: boolean = false) {
    if (this._buffer) {
      this._buffer.destroy();
      delete this._buffer;
    }
    this._buffer = this._device.createBuffer({
      size,
      usage,
      mappedAtCreation: !asyncWrite,
    });
    if (asyncWrite) {
      this._device.queue.writeBuffer(this._buffer, 0, data.buffer);
    } else {
      if (type === EBufferDataType.float32) {
        new Float32Array(this._buffer.getMappedRange()).set(data);
      } else if (type === EBufferDataType.uint16) {
        new Uint16Array(this._buffer.getMappedRange()).set(data);
      } else if (type === EBufferDataType.uint32) {
        new Uint32Array(this._buffer.getMappedRange()).set(data);
      } else if (type === EBufferDataType.uint8) {
        new Uint8Array(this._buffer.getMappedRange()).set(data);
      }
      this._buffer.unmap();
    }
  }

  get buffer() {
    return this._buffer;
  }

  destroy() {
    if (this._buffer) {
      this._buffer.destroy();
      delete this._buffer;
    }
  }
}

export { WebGPUBuffer };
