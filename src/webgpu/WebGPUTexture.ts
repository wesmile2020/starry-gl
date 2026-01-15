import {
  ETextureFilter,
  ETextureFormat,
  ETextureWrap,
  GPU_TextureChannelMapping,
  GPU_TextureFilterMapping,
  GPU_TextureFormatMapping,
  GPU_TextureWrapMapping,
} from "@/config/define";
import { GPUBindGroupAddress } from "@/interfaces/GeometryType";
import { TextureDataType } from "@/texture/Texture";

class WebGPUTexture {
  private _device: GPUDevice;
  private _texture?: GPUTexture;
  private _sampler?: GPUSampler;

  private _wrapS: number = -1;
  private _wrapT: number = -1;
  private _magFilter: number = -1;
  private _minFilter: number = -1;

  private _bindEntries: [number, GPUBindGroupEntry][] = [];

  private _needsUpdate: boolean = true;

  constructor(device: GPUDevice) {
    this._device = device;
  }

  get texture() {
    return this._texture;
  }

  get sampler() {
    return this._sampler;
  }

  texImageTexture(width: number, height: number, format: ETextureFormat, data: GPUCopyExternalImageSource) {
    this._texture = this._device.createTexture({
      size: [width, height],
      format: GPU_TextureFormatMapping[format],
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this._device.queue.copyExternalImageToTexture(
      { source: data },
      { texture: this._texture },
      [width, height],
    );

    this._needsUpdate = true;
  }

  texDataTexture(width: number, height: number, format: ETextureFormat, data: TextureDataType) {
    this._texture = this._device.createTexture({
      size: [width, height],
      format: GPU_TextureFormatMapping[format],
      usage:  GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const channel = GPU_TextureChannelMapping[format];

    this._device.queue.writeTexture(
      { texture: this._texture },
      data.buffer,
      { bytesPerRow: width * channel * data.BYTES_PER_ELEMENT },
      [width, height],
    );

    this._needsUpdate = true;
  }

  texParameters(wrapS: ETextureWrap, wrapT: ETextureWrap, magFilter: ETextureFilter, minFilter: ETextureFilter) {
    const needsUpdate = wrapS !== this._wrapS ||
      wrapT !== this._wrapT ||
      magFilter !== this._magFilter ||
      minFilter !== this._minFilter;

    if (!needsUpdate) {
      return;
    }
    this._wrapS = wrapS;
    this._wrapT = wrapT;
    this._magFilter = magFilter;
    this._minFilter = minFilter;

    this._sampler = this._device.createSampler({
      magFilter: GPU_TextureFilterMapping[magFilter],
      minFilter: GPU_TextureFilterMapping[minFilter],
      addressModeU: GPU_TextureWrapMapping[wrapS],
      addressModeV: GPU_TextureWrapMapping[wrapT],
    });

    this._needsUpdate = true;
  }

  buildBindEntries(texture: GPUBindGroupAddress, sampler: GPUBindGroupAddress) {
    if (!this._needsUpdate || !this._texture || !this._sampler) {
      return this._bindEntries;
    }
    this._needsUpdate = false;
    this._bindEntries.length = 0;
    this._bindEntries.push([
      texture.group,
      {
        binding: texture.binding,
        resource: this._texture.createView(),
      }
    ]);

    this._bindEntries.push([
      sampler.group,
      {
        binding: sampler.binding,
        resource: this._sampler,
      }
    ]);
    return this._bindEntries;
  }

  destroy() {
    if (this._texture) {
      this._texture.destroy();
      delete this._texture;
    }
    if (this._sampler) {
      delete this._sampler;
    }
  }

  get needsUpdate() {
    return this._needsUpdate;
  }
}

export { WebGPUTexture };
