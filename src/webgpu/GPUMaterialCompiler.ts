import { AbstractMaterial } from '@/material/AbstractMaterial';
import { GPUPipeline } from './GPUPipeline';
import { ShaderSourceType } from '@/config/ShaderSourceType';
import { ShaderSource } from './shaders/ShaderSource';
import { ShaderMaterial } from '@/material/ShaderMaterial';
import { preprocessor } from '@/utils/gpu.utils';
import { WebGPUTexture } from './WebGPUTexture';
import { DataTexture } from '@/texture/DataTexture';
import { ImageTexture } from '@/texture/ImageTexture';

class GPUMaterialCompiler {
  private _device: GPUDevice;
  private _pipelineCache: Map<number, GPUPipeline> = new Map();
  private _format: GPUTextureFormat;
  private _errorShaderSet: Set<number> = new Set();

  constructor(device: GPUDevice, format: GPUTextureFormat) {
    this._device = device;
    this._format = format;
  }

  compiler(material: AbstractMaterial) {
    const key = material.getShaderKey();
    let pipeline = this._pipelineCache.get(key);
    if (!pipeline) {
      let vertex = '';
      let fragment = '';
      const shaderType = material.getShaderType();
      if (shaderType !== ShaderSourceType.custom) {
        vertex = ShaderSource[shaderType].vertex;
        fragment = ShaderSource[shaderType].fragment;
      } else {
        vertex = (material as ShaderMaterial).getVertex();
        fragment = (material as ShaderMaterial).getFragment();
      }
      vertex = preprocessor(vertex, material.getDefines());
      fragment = preprocessor(fragment, material.getDefines());
      if (typeof process!== 'undefined' && process.env.NODE_ENV === 'development') {
        if (!vertex || !fragment) {
          if (!this._errorShaderSet.has(shaderType)) {
            console.error(`GPUMaterialCompiler.compile: shader type ${shaderType} vertex or fragment is empty`);
          }
          this._errorShaderSet.add(shaderType);
          return null;
        }
      }
      pipeline = new GPUPipeline(this._device, vertex, fragment, this._format);
      this._pipelineCache.set(key, pipeline);
    }
    this._compilerTexture(material);
    return pipeline;
  }

  private _compilerTexture(material: AbstractMaterial) {
    const { map } = material;
    if (!map) {
      return;
    }
    let { gpuTexture } = map.__internalTextureData;
    if (!gpuTexture) {
      gpuTexture = new WebGPUTexture(this._device);
      map.__internalTextureData.gpuTexture = gpuTexture;
    }
    if (map.needsUpdate) {
      if (map.type === 'data') {
        const { width, height, source, format } = map as DataTexture;
        gpuTexture.texDataTexture(
          width,
          height,
          format,
          source,
        );
      } else if (map.type === 'image') {
        const { width, height, source, format } = map as ImageTexture;
        gpuTexture.texImageTexture(
          width,
          height,
          format,
          source,
        );
      }
      map.needsUpdate = false;
    }

    gpuTexture.texParameters(map.wrapS, map.wrapT, map.magFilter, map.minFilter)
  }
}

export { GPUMaterialCompiler };
