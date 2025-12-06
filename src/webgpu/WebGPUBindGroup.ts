import { GPUBindGroupAddress } from '@/interfaces/GeometryType';
import {
  GPUUniform,
  GPUFloatUniform,
  GPUIntUniform,
  GPUMatrixUniform,
  GPUVectorUniform,
} from './GPUUniform';
import { UniformValue } from '@/material/AbstractMaterial';
import { WebGPUTexture } from './WebGPUTexture';

class WebGPUBindGroup {
  private _device: GPUDevice;
  private _uniforms: Map<string, GPUUniform> = new Map();
  private _bindGroups: GPUBindGroup[] = [];
  private _textureEntries: [number, GPUBindGroupEntry][] = [];
  private _needsUpdate: boolean = false;

  constructor(device: GPUDevice) {
    this._device = device;
  }

  applyUniform(key: string, address: GPUBindGroupAddress, value: UniformValue) {
    let uniform = this._uniforms.get(key);
    if (!uniform) {
      if (typeof value === 'boolean') {
        uniform = new GPUIntUniform(this._device, address);
      } else if (typeof value === 'number') {
        uniform = new GPUFloatUniform(this._device, address);
      } else {
        const array = value.toArray();
        if (array.length === 16) {
          uniform = new GPUMatrixUniform(this._device, address);
        } else {
          uniform = new GPUVectorUniform(this._device, address);
        }
      }
      this._uniforms.set(key, uniform);

      this._needsUpdate = true;
    }
    if (typeof value === 'boolean') {
      (uniform as GPUIntUniform).setValue(value ? 1 : 0);
    } else if (typeof value === 'number') {
      (uniform as GPUFloatUniform).setValue(value);
    } else {
      const array = value.toArray();
      if (array.length === 16) {
        (uniform as GPUMatrixUniform).setValue(array);
      } else {
        (uniform as GPUVectorUniform).setValue(array);
      }
    }
  }

  applyTexture(textureAddress: GPUBindGroupAddress, sampleAddress: GPUBindGroupAddress, texture: WebGPUTexture) {
    if (!texture.needsUpdate) {
      return;
    }
    this._textureEntries = texture.buildBindEntries(textureAddress, sampleAddress);
    this._needsUpdate = true;
  }

  buildBindGroups(renderPipeLine: GPURenderPipeline) {
    if (this._needsUpdate) {
      const bindEntries: GPUBindGroupEntry[][] = [];
      this._uniforms.forEach((value) => {
        let list = bindEntries[value.group];
        if (!list) {
          list = [];
          bindEntries[value.group] = list;
        }
        if (value.buffer) {
          list.push({
            binding: value.binding,
            resource: { buffer: value.buffer },
          });
        }
      });
      for (let i = 0; i < this._textureEntries.length; i += 1) {
        const [group, entry] = this._textureEntries[i];
        let list = bindEntries[group];
        if (!list) {
          list = [];
          bindEntries[group] = list;
        }
        list.push(entry);
      }

      this._bindGroups.length = 0;
      for (let i = 0; i < bindEntries.length; i += 1) {
        const bindGroup = this._device.createBindGroup({
          layout: renderPipeLine.getBindGroupLayout(i),
          entries: bindEntries[i],
        });
        this._bindGroups.push(bindGroup);
      }

      this._needsUpdate = false;
    }
    return this._bindGroups;
  }

  destroy() {
    this._uniforms.forEach((value) => {
      value.destroy();
    });
    this._uniforms.clear();
  }

  copyUniform(key: string, uniform: GPUUniform) {
    this._uniforms.set(key, uniform);
  }

  copyTextureEntries(entries: [number, GPUBindGroupEntry][]) {
    this._textureEntries = entries;
  }

  get uniforms() {
    return this._uniforms;
  }

  get textureEntries() {
    return this._textureEntries;
  }
}

export { WebGPUBindGroup };
