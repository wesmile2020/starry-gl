import { SymbolGeometry } from '@/geometry/SymbolGeometry';
import { TextMaterial } from '@/material/TextMaterial';
import { GLContext } from '@/webgl/GLContext';
import { Symbol } from './Symbol';
import { EBlendParameter, GL_BufferDataMapping } from '@/config/define';
import { GPUContext } from '@/webgpu/GPUContext';
import { WebGPUBindGroup } from '@/webgpu/WebGPUBindGroup';
import { InternalRenderObjectData } from '@/interfaces/ObjectType';

interface TextInternalObjectData extends InternalRenderObjectData {
  strokeGpuBindGroup?: WebGPUBindGroup;
}

class Text extends Symbol {
  __internalObjectData: TextInternalObjectData = {};

  material: TextMaterial;

  constructor(geometry?: SymbolGeometry, material: TextMaterial = new TextMaterial()) {
    super(geometry, material);
    this.material = material;
    this.material.srcRGB = EBlendParameter.srcAlpha;
    this.material.dstRGB = EBlendParameter.oneMinusSrcAlpha;
    this.material.srcAlpha = EBlendParameter.one;
    this.material.dstAlpha = EBlendParameter.oneMinusSrcAlpha;
  }

  renderOnGL(context: GLContext) {
    const { gl } = context;
    const index = this.geometry.getIndex();
    const position = this.geometry.getAttribute('a_position');
    // draw stroke
    context.applyUniform('u_color', this.material.haloColor);
    context.applyUniform('u_halo', 1 - this.material.haloWidth);
    if (index) {
      context.applyIndex(index);
      gl.drawElements(gl.TRIANGLES, index.count, GL_BufferDataMapping[index.type], 0);
    } else if (position) {
      gl.drawArrays(gl.TRIANGLES, 0, position.count);
    }
    // draw fill
    context.applyUniform('u_color', this.material.color);
    context.applyUniform('u_halo', TextMaterial.fillHalo);

    if (index) {
      context.applyIndex(index);
      gl.drawElements(gl.TRIANGLES, index.count, GL_BufferDataMapping[index.type], 0);
    } else if (position) {
      gl.drawArrays(gl.TRIANGLES, 0, position.count);
    }
  }

  renderOnGPU(context: GPUContext) {
    if (!context.passEncoder ||!context.activePipeline) {
      return;
    }
    const index = this.geometry.getIndex();
    const position = this.geometry.getAttribute('a_position');
    let { strokeGpuBindGroup } = this.__internalObjectData;
    const { gpuBindGroup } = this.__internalObjectData;
    if (!strokeGpuBindGroup) {
      strokeGpuBindGroup = new WebGPUBindGroup(context.device);
      this.__internalObjectData.strokeGpuBindGroup = strokeGpuBindGroup;
      if (gpuBindGroup) {
        const { uniforms, textureEntries } = gpuBindGroup;
        uniforms.forEach((value, key) => {
          if (key !== 'u_color' && key !== 'u_halo') {
            strokeGpuBindGroup!.copyUniform(key, value);
          }
        });
        strokeGpuBindGroup.copyTextureEntries(textureEntries);
      }
    }
    const renderPipeline = context.activePipeline.buildPipeline();

    const colorAddress = context.activePipeline.getUniformLocation('u_color');
    const haloAddress = context.activePipeline.getUniformLocation('u_halo');

    // draw stroke
    if (colorAddress) {
      strokeGpuBindGroup.applyUniform('u_color', colorAddress, this.material.haloColor);
    }
    if (haloAddress) {
      strokeGpuBindGroup.applyUniform('u_halo', haloAddress, 1 - this.material.haloWidth);
    }
    const strokeBindGroups = strokeGpuBindGroup.buildBindGroups(renderPipeline);
    for (let i = 0; i < strokeBindGroups.length; i += 1) {
      context.passEncoder.setBindGroup(i, strokeBindGroups[i]);
    }
    if (index) {
      context.applyIndex(index);
      context.passEncoder.drawIndexed(index.count);
    } else if (position) {
      context.passEncoder.draw(position.count);
    }
    // draw fill
    if (gpuBindGroup) {
      const fillBindGroups = gpuBindGroup.buildBindGroups(renderPipeline);
      for (let i = 0; i < fillBindGroups.length; i += 1) {
        context.passEncoder.setBindGroup(i, fillBindGroups[i]);
      }
    }

    if (index) {
      context.applyIndex(index);
      context.passEncoder.drawIndexed(index.count);
    } else if (position) {
      context.passEncoder.draw(position.count);
    }
  }

  override destroy(): void {
    super.destroy();
    if (this.__internalObjectData.strokeGpuBindGroup) {
      this.__internalObjectData.strokeGpuBindGroup.destroy();
      delete this.__internalObjectData.strokeGpuBindGroup;
    }
  }
}

export { Text };
