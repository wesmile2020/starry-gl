import { DrawMode, GL_BufferDataMapping } from '@/config/define';
import { Mesh } from './Mesh';
import { PolygonGeometry } from '@/geometry/PolygonGeometry';
import { PolygonMaterial } from '@/material/PolygonMaterial';
import { GLContext } from '@/webgl/GLContext';
import { GPUContext } from '@/webgpu/GPUContext';
import { InternalRenderObjectData } from '@/interfaces/ObjectType';
import { WebGPUBindGroup } from '@/webgpu/WebGPUBindGroup';

interface PolygonInternalObjectData extends InternalRenderObjectData {
  outlineGpuBindGroup?: WebGPUBindGroup;
}

class Polygon extends Mesh {
  __internalObjectData: PolygonInternalObjectData = {};

  geometry: PolygonGeometry;
  material: PolygonMaterial;

  constructor(geometry: PolygonGeometry = new PolygonGeometry(), material: PolygonMaterial = new PolygonMaterial()) {
    super(geometry, material);
    this.geometry = geometry;
    this.material = material;
  }

  renderOnGL(context: GLContext) {
    const { gl } = context;
    const index = this.geometry.getIndex();
    const position = this.geometry.getAttribute('a_position');

    if (index) {
      context.applyIndex(index);
      gl.drawElements(gl.TRIANGLES, index.count, GL_BufferDataMapping[index.type], 0);
    } else if (position) {
      gl.drawArrays(gl.TRIANGLES, 0, position.count);
    }

    if (this.material.enableOutline) {
      if (this.material.outlineDepthTest) {
        context.enable(gl.DEPTH_TEST);
      } else {
        context.disable(gl.DEPTH_TEST);
      }
      const outlineIndex = this.geometry.getOutlineIndex();
      context.applyUniform('u_color', this.material.outlineColor);
      if (outlineIndex) {
        context.applyIndex(outlineIndex);
        gl.drawElements(gl.LINES, outlineIndex.count, GL_BufferDataMapping[outlineIndex.type], 0);
      } else if (position) {
        gl.drawArrays(gl.LINES, 0, position.count);
      }
    }
  }

  renderOnGPU(context: GPUContext) {
    if (!context.passEncoder || !context.activePipeline) {
      return;
    }
    const index = this.geometry.getIndex();
    const position = this.geometry.getAttribute('a_position');
    if (index) {
      context.applyIndex(index);
      context.passEncoder.drawIndexed(index.count);
    } else if (position) {
      context.passEncoder.draw(position.count);
    }
    if (this.material.enableOutline) {
      let { outlineGpuBindGroup } = this.__internalObjectData;
      const { gpuBindGroup } = this.__internalObjectData;
      if (!outlineGpuBindGroup) {
        outlineGpuBindGroup = new WebGPUBindGroup(context.device);
        this.__internalObjectData.outlineGpuBindGroup = outlineGpuBindGroup;
        if (gpuBindGroup) {
          const { uniforms, textureEntries } = gpuBindGroup;
          uniforms.forEach((value, key) => {
            if (key !== 'u_color') {
              outlineGpuBindGroup!.copyUniform(key, value);
            }
          });
          outlineGpuBindGroup.copyTextureEntries(textureEntries);
        }
      }

      const colorAddress = context.activePipeline.getUniformLocation('u_color');
      if (colorAddress) {
        outlineGpuBindGroup.applyUniform('u_color', colorAddress, this.material.outlineColor);
      }

      context.activePipeline.setDepthTest(false, context.depthFormat);
      context.activePipeline.setDrawMode(DrawMode.lines);

      const renderPipeline = context.activePipeline.buildPipeline();
      context.passEncoder.setPipeline(renderPipeline);

      const bindGroups = outlineGpuBindGroup.buildBindGroups(renderPipeline);
      for (let i = 0; i < bindGroups.length; i++) {
        context.passEncoder.setBindGroup(i, bindGroups[i]);
      }

      const outlineIndex = this.geometry.getOutlineIndex();
      if (outlineIndex) {
        context.applyIndex(outlineIndex);
        context.passEncoder.drawIndexed(outlineIndex.count);
      } else if (position) {
        context.passEncoder.draw(position.count);
      }
    }
  }

  override destroy(): void {
    super.destroy();
    if (this.__internalObjectData.outlineGpuBindGroup) {
      this.__internalObjectData.outlineGpuBindGroup.destroy();
      delete this.__internalObjectData.outlineGpuBindGroup;
    }
  }
}

export { Polygon };
