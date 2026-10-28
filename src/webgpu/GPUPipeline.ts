import { Float32BufferAttribute } from "@/geometry/BufferAttribute";
import { buildAttributes, buildUniforms, getGPUVertexFormat } from "@/utils/gpu.utils";
import { GPUBindGroupAddress } from "@/interfaces/GeometryType";
import { BlendParameter, DrawMode, DrawSide, GPU_BlendMapping, GPU_CullModeMapping, GPU_DrawModeMapping, GPU_SAMPLE_COUNT } from "@/config/define";

class RenderPipelineState {
  needsUpdate: boolean = true;

  private _drawMode: DrawMode = DrawMode.points;
  private _drawSide: DrawSide = DrawSide.front;
  private _blend: boolean = false;
  private _srcRGB: BlendParameter = BlendParameter.srcAlpha;
  private _dstRGB: BlendParameter = BlendParameter.oneMinusSrcAlpha;
  private _srcAlpha: BlendParameter = BlendParameter.one;
  private _dstAlpha: BlendParameter = BlendParameter.oneMinusSrcAlpha;
  private _depthTest: boolean = false;
  private _depthFormat: GPUTextureFormat = 'depth24plus';
  private _depthFormatCode: number[] = [];

  private _list: number[] = [];

  get drawMode() {
    return this._drawMode;
  }

  set drawMode(input: DrawMode) {
    if (this._drawMode === input) {
      return;
    }
    this._drawMode = input;
    this.needsUpdate = true;
  }

  get drawSide() {
    return this._drawSide;
  }

  set drawSide(input: DrawSide) {
    if (this._drawSide === input) {
      return;
    }
    this._drawSide = input;
    this.needsUpdate = true;
  }

  get blend() {
    return this._blend;
  }

  set blend(input: boolean) {
    if (this._blend === input) {
      return;
    }
    this._blend = input;
    this.needsUpdate = true;
  }

  get srcRGB() {
    return this._srcRGB;
  }

  set srcRGB(input: BlendParameter) {
    if (this._srcRGB === input) {
      return;
    }
    this._srcRGB = input;
    this.needsUpdate = true;
  }

  get dstRGB() {
    return this._dstRGB;
  }

  set dstRGB(input: BlendParameter) {
    if (this._dstRGB === input) {
      return;
    }
    this._dstRGB = input;
    this.needsUpdate = true;
  }

  get srcAlpha() {
    return this._srcAlpha;
  }

  set srcAlpha(input: BlendParameter) {
    if (this._srcAlpha === input) {
      return;
    }
    this._srcAlpha = input;
    this.needsUpdate = true;
  }

  get dstAlpha() {
    return this._dstAlpha;
  }

  set dstAlpha(input: BlendParameter) {
    if (this._dstAlpha === input) {
      return;
    }
    this._dstAlpha = input;
    this.needsUpdate = true;
  }

  get depthTest() {
    return this._depthTest;
  }

  set depthTest(input: boolean) {
    if (this._depthTest === input) {
      return;
    }
    this._depthTest = input;
    this.needsUpdate = true;
  }

  get depthFormat() {
    return this._depthFormat;
  }

  set depthFormat(input: GPUTextureFormat) {
    if (this._depthFormat === input) {
      return;
    }
    this._depthFormat = input;
    this._depthFormatCode.length = 0;
    for (let i = 0; i < input.length; i += 1) {
      this._depthFormatCode.push(input.charCodeAt(i));
    }
    this.needsUpdate = true;
  }

  makeHashKey() {
    this._list[0] = this._drawMode;
    this._list[1] = this._drawSide;
    this._list[2] = Number(this._blend);
    this._list[3] = this._srcRGB;
    this._list[4] = this._dstRGB;
    this._list[5] = this._srcAlpha;
    this._list[6] = this._dstAlpha;
    this._list[7] = Number(this._depthTest);
    const seed = 0;
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < this._list.length; i += 1) {
      const ch = this._list[i]
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    for (let i = 0; i < this._depthFormatCode.length; i += 1) {
      const ch = this._depthFormatCode[i];
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
}

class GPUPipeline {
  private _device: GPUDevice;
  private _format: GPUTextureFormat;
  private _pipelineDescriptor: GPURenderPipelineDescriptor;

  private _pipeline?: GPURenderPipeline;
  private _bindGroupLayouts: GPUBindGroupLayout[] = [];
  private _attributes: Map<string, number> = new Map();
  private _vertexBinds: Map<string, GPUBindGroupAddress> = new Map();
  private _fragmentBinds: Map<string, GPUBindGroupAddress> = new Map();
  private _fragmentTextures: Map<string, GPUBindGroupAddress> = new Map();
  private _fragmentSamplers: Map<string, GPUBindGroupAddress> = new Map();

  private _vertexBufferLayouts: Map<string, GPUVertexBufferLayout> = new Map();

  private _state: RenderPipelineState = new RenderPipelineState();

  private _renderPipelineCache: Map<number, GPURenderPipeline> = new Map();

  constructor(device: GPUDevice, vertex: string, fragment: string, format: GPUTextureFormat) {
    this._device = device;

    const attributes = buildAttributes(vertex);
    for (let i = 0; i < attributes.length; i += 1) {
      this._attributes.set(attributes[i][0], attributes[i][1]);
    }
    const uniforms1 = buildUniforms(vertex);
    for (let i = 0; i < uniforms1.uniforms.length; i += 1) {
      this._vertexBinds.set(uniforms1.uniforms[i][0], uniforms1.uniforms[i][1]);
    }
    const uniforms2 = buildUniforms(fragment);
    for (let i = 0; i < uniforms2.uniforms.length; i += 1) {
      this._fragmentBinds.set(uniforms2.uniforms[i][0], uniforms2.uniforms[i][1]);
    }
    for (let i = 0; i < uniforms2.textures.length; i += 1) {
      this._fragmentTextures.set(uniforms2.textures[i][0], uniforms2.textures[i][1]);
    }
    for (let i = 0; i < uniforms2.samplers.length; i += 1) {
      this._fragmentSamplers.set(uniforms2.samplers[i][0], uniforms2.samplers[i][1]);
    }

    const vertexModule = device.createShaderModule({
      code: vertex,
    });
    const fragmentModule = device.createShaderModule({
      code: fragment,
    });

    this._format = format;
    this._pipelineDescriptor = {
      layout: 'auto',
      vertex: {
        module: vertexModule,
        entryPoint: 'main',
        buffers: [],
      },
      fragment: {
        module: fragmentModule,
        entryPoint: 'main',
        targets: [],
      },
      multisample: {
        count: GPU_SAMPLE_COUNT,
      },
    };

    this._initBindGroupLayouts();
  }

  private _initBindGroupLayouts() {
    this._bindGroupLayouts.length = 0;
    const descriptors: GPUBindGroupLayoutDescriptor[] = [];

    this._vertexBinds.forEach((value) => {
      if (!descriptors[value.group]) {
        descriptors[value.group] = {
          entries: [],
        };
      }
      (descriptors[value.group].entries as GPUBindGroupLayoutEntry[]).push({
        binding: value.binding,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'uniform' },
      });
    });

    this._fragmentBinds.forEach((value) => {
      if (!descriptors[value.group]) {
        descriptors[value.group] = {
          entries: [],
        };
      }
      (descriptors[value.group].entries as GPUBindGroupLayoutEntry[]).push({
        binding: value.binding,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      })
    });

    this._fragmentTextures.forEach((value) => {
      if (!descriptors[value.group]) {
        descriptors[value.group] = {
          entries: [],
        };
      }
      (descriptors[value.group].entries as GPUBindGroupLayoutEntry[]).push({
        binding: value.binding,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {},
      });
    });

    this._fragmentSamplers.forEach((value) => {
      if (!descriptors[value.group]) {
        descriptors[value.group] = {
          entries: [],
        };
      }
      (descriptors[value.group].entries as GPUBindGroupLayoutEntry[]).push({
        binding: value.binding,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {},
      });
    })
    for (let i = 0; i < descriptors.length; i += 1) {
      const layout = this._device.createBindGroupLayout(descriptors[i]);
      this._bindGroupLayouts.push(layout);
    }
  }

  setDrawMode(drawMode: DrawMode) {
    this._state.drawMode = drawMode;
  }

  setDrawSide(drawSide: DrawSide) {
    this._state.drawSide = drawSide;
  }

  setBlend(blend: boolean) {
    this._state.blend = blend;
  }

  blendSeparated(srcRGB: BlendParameter, dstRGB: BlendParameter, srcAlpha: BlendParameter, dstAlpha: BlendParameter) {
    this._state.srcRGB = srcRGB;
    this._state.dstRGB = dstRGB;
    this._state.srcAlpha = srcAlpha;
    this._state.dstAlpha = dstAlpha;
  }

  setDepthTest(depthTest: boolean, depthFormat: GPUTextureFormat) {
    this._state.depthTest = depthTest;
    this._state.depthFormat = depthFormat;
  }

  addGPUVertexBufferLayout(name: string, attribute: Float32BufferAttribute) {
    const location = this.getAttributeLocation(name);
    if (location === -1) {
      return;
    }
    const format = getGPUVertexFormat(attribute.itemSize);
    if (this._vertexBufferLayouts.has(name)) {
      const layout = this._vertexBufferLayouts.get(name)!;
      if (format === (layout.attributes as GPUVertexAttribute[])[0].format) {
        return;
      }
    }
    this._state.needsUpdate = true;
    this._vertexBufferLayouts.set(name, {
      arrayStride: attribute.itemSize * attribute.array.BYTES_PER_ELEMENT,
      attributes: [{
        shaderLocation: location,
        offset: 0,
        format,
      }],
    });
  }

  private _createRenderPipeline() {
    // build pipeline layout
    this._pipelineDescriptor.layout = this._device.createPipelineLayout({
      bindGroupLayouts: this._bindGroupLayouts,
    });

    // build vertex buffers
    const buffers: GPUVertexBufferLayout[] = [];
    this._vertexBufferLayouts.forEach((value) => {
      buffers.push(value);
    });
    this._pipelineDescriptor.vertex.buffers = buffers;
    this._pipelineDescriptor.primitive = {
      topology: GPU_DrawModeMapping[this._state.drawMode],
      frontFace: 'ccw',
      cullMode: GPU_CullModeMapping[this._state.drawSide],
    };
    const targetState: GPUColorTargetState = {
      format: this._format,
    };
    if (this._state.blend) {
      targetState.blend = {
        color: {
          srcFactor: GPU_BlendMapping[this._state.srcRGB],
          dstFactor: GPU_BlendMapping[this._state.dstRGB],
          operation: 'add',
        },
        alpha: {
          srcFactor: GPU_BlendMapping[this._state.srcAlpha],
          dstFactor: GPU_BlendMapping[this._state.dstAlpha],
          operation: 'add',
        }
      };
    }
    this._pipelineDescriptor.depthStencil = {
      depthWriteEnabled: this._state.depthTest,
      format: this._state.depthFormat,
      depthCompare: 'less-equal',
    };
    this._pipelineDescriptor.fragment!.targets = [targetState];

    return this._device.createRenderPipeline(this._pipelineDescriptor);
  }

  buildPipeline() {
    if (this._state.needsUpdate || !this._pipeline) {
      const key = this._state.makeHashKey();
      this._state.needsUpdate = false;

      if (this._renderPipelineCache.has(key)) {
        this._pipeline = this._renderPipelineCache.get(key)!;
        return this._pipeline;
      }

      this._pipeline = this._createRenderPipeline();
      this._renderPipelineCache.set(key, this._pipeline);
    }

    return this._pipeline;
  }

  getAttributeLocation(name: string) {
    return this._attributes.get(name) ?? -1;
  }

  getUniformLocation(name: string) {
    let uniform = this._vertexBinds.get(name);
    if (uniform) {
      return uniform;
    }
    uniform = this._fragmentBinds.get(name);
    if (uniform) {
      return uniform;
    }
    uniform = this._fragmentTextures.get(name);
    if (uniform) {
      return uniform;
    }
    uniform = this._fragmentSamplers.get(name);
    if (uniform) {
      return uniform;
    }
    return null;
  }

  get bindGroupLayouts() {
    return this._bindGroupLayouts;
  }
}

export { GPUPipeline };
