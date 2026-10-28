import { Matrix4, Color } from 'starry-math';
import { AbstractCamera } from "@/camera/AbstractCamera";
import { RenderObject } from "@/interfaces/ObjectType";
import { GPUMaterialCompiler } from "./GPUMaterialCompiler";
import { GPUPipeline } from "./GPUPipeline";
import { BufferAttribute, Float32BufferAttribute } from "@/geometry/BufferAttribute";
import { BufferGeometry } from "@/geometry/BufferGeometry";
import { AbstractMaterial, UniformValue } from "@/material/AbstractMaterial";
import { BufferDataType, GPU_SAMPLE_COUNT } from "@/config/define";
import { WebGPUBuffer } from "./WebGPUBuffer";
import { WebGPUBindGroup } from "./WebGPUBindGroup";

class GPUContext {
  private _compiler: GPUMaterialCompiler;
  private _context: GPUCanvasContext;
  private _device: GPUDevice;
  private _format: GPUTextureFormat;
  private _msaaTexture: GPUTexture;
  private _depthTexture: GPUTexture;
  private _depthFormat: GPUTextureFormat = 'depth24plus';

  private _loadOp: GPULoadOp = 'clear';
  private _background: Color = new Color('#fff');
  private _activePipeline: GPUPipeline | null = null;
  private _passEncoder?: GPURenderPassEncoder;
  private _commandEncoder?: GPUCommandEncoder;

  constructor(context: GPUCanvasContext, device: GPUDevice) {
    this._format = navigator.gpu.getPreferredCanvasFormat();

    this._context = context;
    this._device = device;
    this._context.configure({
      format: this._format,
      device: this._device,
    });

    // use msaa 抗锯齿
    this._msaaTexture = this._device.createTexture({
      size: [context.canvas.width, context.canvas.height],
      format: this._format,
      sampleCount: GPU_SAMPLE_COUNT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // 添加深度检测支持
    this._depthTexture = this._device.createTexture({
      size: [context.canvas.width, context.canvas.height],
      format: this._depthFormat,
      sampleCount: GPU_SAMPLE_COUNT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this._compiler = new GPUMaterialCompiler(this._device, this._format);
  }

  setSize(width: number, height: number) {
    this._msaaTexture.destroy();
    this._msaaTexture = this._device.createTexture({
      size: [width, height],
      format: this._format,
      sampleCount: GPU_SAMPLE_COUNT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this._depthTexture.destroy();
    this._depthTexture = this._device.createTexture({
      size: [width, height],
      format: this._depthFormat,
      sampleCount: GPU_SAMPLE_COUNT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  setClearFlag(mode: boolean) {
    this._loadOp = mode ? 'clear' : 'load';
  }

  drawBegin() {
    this._commandEncoder = this._device.createCommandEncoder();
    const view = this._context.getCurrentTexture().createView();
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [{
        view: this._msaaTexture.createView(),
        resolveTarget: view,
        loadOp: this._loadOp,
        storeOp: 'store',
        clearValue: this._background,
      }],
      depthStencilAttachment: {
        view: this._depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: this._loadOp,
        depthStoreOp: 'store',
      }
    };
    this._passEncoder = this._commandEncoder.beginRenderPass(renderPassDescriptor);
  }

  drawObject(camera: AbstractCamera, object: RenderObject) {
    if (!this._passEncoder || object.geometry.getAttributes().size === 0) {
      return;
    }
    object.material.onBeforeRender(camera);

    const pipeline = this._compiler.compiler(object.material);
    if (!pipeline) {
      return;
    }
    if (this._activePipeline !== pipeline) {
      this._activePipeline = pipeline;
    }

    let { gpuBindGroup } = object.__internalObjectData;
    if (!gpuBindGroup) {
      gpuBindGroup = new WebGPUBindGroup(this._device);
      object.__internalObjectData.gpuBindGroup = gpuBindGroup;
    }

    this.applyMaterial(object.material, gpuBindGroup);
    this.applyCamera(camera, object.worldMatrix, gpuBindGroup);
    this.applyGeometry(object.geometry);

    this._activePipeline.setDrawMode(object.drawMode);

    const renderPipeline = this._activePipeline.buildPipeline();
    this._passEncoder.setPipeline(renderPipeline);

    const bindGroups = gpuBindGroup.buildBindGroups(renderPipeline);
    for (let i = 0; i < bindGroups.length; i++) {
      this._passEncoder.setBindGroup(i, bindGroups[i]);
    }

    if (object.renderOnGPU) {
      object.renderOnGPU(this);
    } else {
      const index = object.geometry.getIndex();
      const position = object.geometry.getAttribute('a_position');
      if (index) {
        this.applyIndex(index);
        this._passEncoder.drawIndexed(index.count);
      } else if (position) {
        this._passEncoder.draw(position.count);
      }
    }
  }

  drawEnd() {
    if (!this._commandEncoder || !this._passEncoder) {
      return;
    }
    this._passEncoder.end();
    this._device.queue.submit([this._commandEncoder.finish()]);
  }

  applyIndex(index: BufferAttribute) {
    if (!this._passEncoder) {
      return;
    }
    let { gpuBuffer } = index.__internalAttributeData;
    let needsUpdate = index.needsUpdate;
    if (!gpuBuffer) {
      needsUpdate = true;
      gpuBuffer = new WebGPUBuffer(this._device);
      index.__internalAttributeData.gpuBuffer = gpuBuffer;
    }
    if (needsUpdate) {
      gpuBuffer.bufferData(
        index.array.length * Uint32Array.BYTES_PER_ELEMENT,
        GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        index.array,
        BufferDataType.uint32,
      );
      index.needsUpdate = false;
    }
    if (gpuBuffer.buffer) {
      this._passEncoder.setIndexBuffer(gpuBuffer.buffer, 'uint32');
    }
  }

  applyUniform(key: string, value: UniformValue, bindGroup: WebGPUBindGroup) {
    if (!this._activePipeline) {
      return;
    }
    const address = this._activePipeline.getUniformLocation(key);
    if (address) {
      bindGroup.applyUniform(key, address, value);
    }
  }

  applyMaterial(material: AbstractMaterial, bindGroup: WebGPUBindGroup) {
    if (!this._activePipeline) {
      return;
    }
    this._activePipeline.setDrawSide(material.side);
    this._activePipeline.setBlend(material.transparent);
    this._activePipeline.blendSeparated(material.srcRGB, material.dstRGB, material.srcAlpha, material.dstAlpha);

    const uniforms = material.getUniforms();
    uniforms.forEach((value, key) => {
      this.applyUniform(key, value, bindGroup);
    });
    this._activePipeline.setDepthTest(material.depthTest, this._depthFormat);

    // setup texture bindGroup
    if (material.map?.__internalTextureData.gpuTexture) {
      const textureAddress = this._activePipeline.getUniformLocation('u_texture');
      const sampleAddress = this._activePipeline.getUniformLocation('u_sampler');
      if (textureAddress && sampleAddress) {
        bindGroup.applyTexture(textureAddress, sampleAddress, material.map.__internalTextureData.gpuTexture);
      }
    }
  }

  applyCamera(camera: AbstractCamera, modelMatrix: Matrix4, bindGroup: WebGPUBindGroup) {
    if (!this._activePipeline) {
      return;
    }
    const projectionAddress = this._activePipeline.getUniformLocation('u_projectionMatrix');
    if (projectionAddress) {
      bindGroup.applyUniform('u_projectionMatrix', projectionAddress, camera.projectionMatrix);
    }
    const modelViewAddress = this._activePipeline.getUniformLocation('u_modelViewMatrix');
    const modelViewMatrix = modelMatrix.clone().premultiply(camera.viewMatrix);

    if (modelViewAddress) {
      bindGroup.applyUniform('u_modelViewMatrix', modelViewAddress, modelViewMatrix);
    }
  }

  applyGeometry(geometry: BufferGeometry) {
    const attributes = geometry.getAttributes();
    attributes.forEach((value, key) => {
      this.applyAttribute(key, value);
    });
  }

  applyAttribute(key: string, attribute: Float32BufferAttribute) {
    if (!this._activePipeline || !this._passEncoder) {
      return;
    }
    const address = this._activePipeline.getAttributeLocation(key);
    if (address === -1) {
      return;
    }
    let { gpuBuffer } = attribute.__internalAttributeData;
    let needsUpdate = attribute.needsUpdate;
    if (!gpuBuffer) {
      needsUpdate = true;
      gpuBuffer = new WebGPUBuffer(this._device);
      attribute.__internalAttributeData.gpuBuffer = gpuBuffer;
    }
    if (needsUpdate) {
      gpuBuffer.bufferData(
        attribute.array.length * Float32Array.BYTES_PER_ELEMENT,
        GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        attribute.array,
        BufferDataType.float32,
      );
      attribute.needsUpdate = false;
    }

    this._activePipeline.addGPUVertexBufferLayout(key, attribute);
    if (gpuBuffer.buffer) {
      this._passEncoder.setVertexBuffer(address, gpuBuffer.buffer);
    }
  }

  get passEncoder() {
    return this._passEncoder;
  }

  get activePipeline() {
    return this._activePipeline;
  }

  get depthFormat() {
    return this._depthFormat;
  }

  get device() {
    return this._device;
  }
}

export { GPUContext };
