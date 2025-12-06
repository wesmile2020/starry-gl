import { Matrix4 } from 'starry-math';
import { BufferAttribute } from '@/geometry/BufferAttribute';
import { AbstractMaterial, UniformValue } from '@/material/AbstractMaterial';
import { GLProgram } from './GLProgram';
import { AbstractCamera } from '@/camera/AbstractCamera';
import { GLMaterialCompiler } from './GLMaterialCompiler';
import { RenderObject } from '@/interfaces/ObjectType';
import { BufferGeometry } from '@/geometry/BufferGeometry';
import { GLBuffer } from '@/webgl/GLBuffer';
import { GLVertexArrayObject } from './GLVertexArrayObject';
import {
  GL_DrawModeMapping,
  GL_BlendMapping,
  GL_BufferDataMapping,
  EDrawSide,
  EBlendParameter,
} from '@/config/define';

interface BlendSeparateParameter {
  srcRGB: EBlendParameter;
  dstRGB: EBlendParameter;
  srcAlpha: EBlendParameter;
  dstAlpha: EBlendParameter;
}

class GLContext {
  private _gl: WebGLRenderingContext | WebGL2RenderingContext;
  private _activeProgram?: GLProgram;
  private _isWebGL2: boolean;
  private _compiler: GLMaterialCompiler;
  private _isSupportVAO: boolean = false;
  private _capabilities: Map<number, boolean> = new Map();
  private _blendSeparateParameter?: BlendSeparateParameter;
  private _vaoExtension: OES_vertex_array_object | null = null;

  constructor(gl: WebGLRenderingContext) {
    this._gl = gl;
    this._isWebGL2 = Object.prototype.toString.call(gl) === '[object WebGL2RenderingContext]';
    this._compiler = new GLMaterialCompiler(this._gl, this._isWebGL2);

    this._initExtension();
    this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, 1);
    this._gl.frontFace(this._gl.CCW);

    this._capabilities.set(this._gl.BLEND, this._gl.isEnabled(this._gl.BLEND));
    this._capabilities.set(this._gl.CULL_FACE, this._gl.isEnabled(this._gl.CULL_FACE));
    this._capabilities.set(this._gl.DEPTH_TEST, this._gl.isEnabled(this._gl.DEPTH_TEST));
    this._capabilities.set(this._gl.DITHER, this._gl.isEnabled(this._gl.DITHER));
    this._capabilities.set(this._gl.POLYGON_OFFSET_FILL, this._gl.isEnabled(this._gl.POLYGON_OFFSET_FILL));
    this._capabilities.set(this._gl.SAMPLE_ALPHA_TO_COVERAGE, this._gl.isEnabled(this._gl.SAMPLE_ALPHA_TO_COVERAGE));
    this._capabilities.set(this._gl.SAMPLE_COVERAGE, this._gl.isEnabled(this._gl.SAMPLE_COVERAGE));
    this._capabilities.set(this._gl.SCISSOR_TEST, this._gl.isEnabled(this._gl.SCISSOR_TEST));
    this._capabilities.set(this._gl.STENCIL_TEST, this._gl.isEnabled(this._gl.STENCIL_TEST));
  }

  private _initExtension() {
    if (!this._isWebGL2) {
      this._gl.getExtension('OES_element_index_uint');
      this._vaoExtension = this._gl.getExtension('OES_vertex_array_object');
      if (this._vaoExtension) {
        this._isSupportVAO = true;
      }
    } else {
      this._isSupportVAO = true;
    }
  }

  enable(id: number) {
    if (this._capabilities.get(id)) {
      return;
    }
    this._capabilities.set(id, true);
    this._gl.enable(id);
  }

  disable(id: number) {
    if (!this._capabilities.get(id)) {
      return;
    }
    this._capabilities.set(id, false);
    this._gl.disable(id);
  }

  blendFuncSeparated(srcRGB: EBlendParameter, dstRGB: EBlendParameter, srcAlpha: EBlendParameter, dstAlpha: EBlendParameter) {
    const isEqual = this._blendSeparateParameter &&
      this._blendSeparateParameter.srcRGB === srcRGB &&
      this._blendSeparateParameter.dstRGB === dstRGB &&
      this._blendSeparateParameter.srcAlpha === srcAlpha &&
      this._blendSeparateParameter.dstAlpha === dstAlpha;
    if (isEqual) {
      return;
    }
    if (!this._blendSeparateParameter) {
      this._blendSeparateParameter = { srcRGB, dstRGB, srcAlpha, dstAlpha };
    } else {
      this._blendSeparateParameter.srcRGB = srcRGB;
      this._blendSeparateParameter.dstRGB = dstRGB;
      this._blendSeparateParameter.srcAlpha = srcAlpha;
      this._blendSeparateParameter.dstAlpha = dstAlpha;
    }
    this._gl.blendFuncSeparate(
      GL_BlendMapping[srcRGB],
      GL_BlendMapping[dstRGB],
      GL_BlendMapping[srcAlpha],
      GL_BlendMapping[dstAlpha],
    );
  }

  setSize(width: number, height: number) {
    this._gl.viewport(0, 0, width, height);
    this._gl.scissor(0, 0, width, height);
  }

  get gl() {
    return this._gl;
  }

  get isSupportVAO() {
    return this._isSupportVAO;
  }

  clear() {
    this._gl.clear(this._gl.DEPTH_BUFFER_BIT | this._gl.COLOR_BUFFER_BIT);
  }

  applyUniform(key: string, value: UniformValue) {
    if (!this._activeProgram) {
      return;
    }
    if (typeof value === 'boolean') {
      const uniform = this._activeProgram.getUniform(key, 'int');
      uniform?.setValue(value ? 1 : 0);
    } else if (typeof value === 'number') {
      const uniform = this._activeProgram.getUniform(key, 'float');
      uniform?.setValue(value);
    } else {
      const array = value.toArray();
      if (array.length === 16) {
        const uniform = this._activeProgram.getUniform(key, 'matrix');
        uniform?.setValue(array);
      } else {
        const uniform = this._activeProgram.getUniform(key, 'vector');
        uniform?.setValue(array);
      }
    }
  }

  applyMaterial(material: AbstractMaterial) {
    const uniforms = material.getUniforms();
    uniforms.forEach((value, key) => {
      this.applyUniform(key, value);
    });

    if (material.transparent) {
      this.enable(this._gl.BLEND);
      this.blendFuncSeparated(material.srcRGB, material.dstRGB, material.srcAlpha, material.dstAlpha);
    } else {
      this.disable(this._gl.BLEND);
    }

    if (material.depthTest) {
      this.enable(this._gl.DEPTH_TEST);
    } else {
      this.disable(this._gl.DEPTH_TEST);
    }

    if (material.side === EDrawSide.double) {
      this.disable(this._gl.CULL_FACE);
    } else {
      this.enable(this._gl.CULL_FACE);
      if (material.side === EDrawSide.front) {
        this._gl.cullFace(this._gl.BACK);
      } else if (material.side === EDrawSide.back) {
        this._gl.cullFace(this._gl.FRONT);
      }
    }
  }

  applyCamera(camera: AbstractCamera, modelMatrix: Matrix4) {
    if (!this._activeProgram) {
      return;
    }

    const projectionUniform = this._activeProgram.getUniform('u_projectionMatrix', 'matrix');
    projectionUniform?.setValue(camera.projectionMatrix.toArray());
    const modelViewMatrix = modelMatrix.clone().premultiply(camera.viewMatrix);
    const modelViewUniform = this._activeProgram.getUniform('u_modelViewMatrix', 'matrix');
    modelViewUniform?.setValue(modelViewMatrix.toArray());
  }

  applyAttribute(key: string, attribute: BufferAttribute) {
    if (!this._activeProgram) {
      return;
    }
    const address = this._activeProgram.getAttribLocation(key);
    if (address === -1) {
      return;
    }

    let { glBuffer } = attribute.__internalAttributeData;
    let needsUpdate = attribute.needsUpdate;
    if (!glBuffer) {
      needsUpdate = true;
      glBuffer = new GLBuffer(this._gl, this._gl.ARRAY_BUFFER);
      attribute.__internalAttributeData.glBuffer = glBuffer;
    }
    glBuffer.bind();
    if (needsUpdate) {
      glBuffer.bufferData(attribute.array, this._gl.STATIC_DRAW);
      attribute.needsUpdate = false;
    }

    const stride = attribute.array.BYTES_PER_ELEMENT * attribute.itemSize;
    this._gl.vertexAttribPointer(address, attribute.itemSize, GL_BufferDataMapping[attribute.type], false, stride, 0);
    this._gl.enableVertexAttribArray(address);
  }

  applyIndex(index: BufferAttribute) {
    let { glBuffer } = index.__internalAttributeData;
    let needsUpdate = index.needsUpdate;
    if (!glBuffer) {
      needsUpdate = true;
      glBuffer = new GLBuffer(this._gl, this._gl.ELEMENT_ARRAY_BUFFER);
      index.__internalAttributeData.glBuffer = glBuffer;
    }
    glBuffer.bind();
    if (needsUpdate) {
      glBuffer.bufferData(index.array, this._gl.STATIC_DRAW);
      index.needsUpdate = false;
    }
  }

  applyGeometry(geometry: BufferGeometry) {
    if (this._isSupportVAO) {
      let vao = geometry.__internalGeometryData.vao;
      if (!vao) {
        if (this._isWebGL2) {
          vao = new GLVertexArrayObject(this._gl as WebGL2RenderingContext, true);
        } else {
          vao = new GLVertexArrayObject(this._vaoExtension!, false);
        }
        geometry.__internalGeometryData.vao = vao;
        vao = geometry.__internalGeometryData.vao;
      }
      vao.bind();
    }

    const attributes = geometry.getAttributes();
    attributes.forEach((value, key) => {
      if (!this._isSupportVAO || value.needsUpdate || !value.__internalAttributeData.glBuffer) {
        this.applyAttribute(key, value);
      }
    });

    const index = geometry.getIndex();
    if (index) {
      this.applyIndex(index);
    }
  }

  drawObject(camera: AbstractCamera, object: RenderObject, isFirstDrawAfterContextRestore: boolean = false) {
    if (object.geometry.getAttributes().size === 0) {
      return;
    }

    object.material.onBeforeRender(camera);

    // compile material for program
    const program = this._compiler.compile(object.material);
    if (!program) {
      return;
    }
    if (program !== this._activeProgram) {
      this._activeProgram = program;
      this._activeProgram.use();
    }
    // ReInit Buffer And Texture ...
    if (isFirstDrawAfterContextRestore) {
      if (object.material.map?.__internalTextureData.glTexture) {
        object.material.map.__internalTextureData.glTexture.destroy();
        delete object.material.map.__internalTextureData.glTexture;
      }
      const attributes = object.geometry.getAttributes();
      attributes.forEach((value) => {
        if (value.__internalAttributeData.glBuffer) {
          value.__internalAttributeData.glBuffer.destroy();
          delete value.__internalAttributeData.glBuffer;
        }
      });
      const index = object.geometry.getIndex();
      if (index?.__internalAttributeData.glBuffer) {
        index.__internalAttributeData.glBuffer.destroy();
        delete index.__internalAttributeData.glBuffer;
      }
      if (object.geometry.__internalGeometryData.vao) {
        object.geometry.__internalGeometryData.vao.destroy();
        delete object.geometry.__internalGeometryData.vao;
      }
    }

    this.applyMaterial(object.material);
    this.applyCamera(camera, object.worldMatrix);
    this.applyGeometry(object.geometry);

    if (object.renderOnGL) {
      object.renderOnGL(this);
    } else {
      const index = object.geometry.getIndex();
      const position = object.geometry.getAttribute('a_position');
      if (index) {
        this._gl.drawElements(GL_DrawModeMapping[object.drawMode], index.count, GL_BufferDataMapping[index.type], 0);
      } else if (position) {
        this._gl.drawArrays(GL_DrawModeMapping[object.drawMode], 0, position.count);
      }
    }
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
    this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, null);
    this._gl.bindTexture(this._gl.TEXTURE_2D, null);
  }

  destroy() {
    this._compiler.destroy();
    delete this._activeProgram;
  }
}

export { GLContext };
