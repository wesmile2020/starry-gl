import { ShaderSource } from '@/webgl/shaders/ShaderSource';
import { GLProgram } from './GLProgram';
import { AbstractMaterial } from '@/material/AbstractMaterial';
import { EShaderSourceType } from '@/config/ShaderSourceType';
import { GLTexture } from '@/webgl/GLTexture';
import { ShaderMaterial } from '@/material/ShaderMaterial';
import { DataTexture } from '@/texture/DataTexture';
import { ImageTexture } from '@/texture/ImageTexture';

class GLMaterialCompiler {
  private _programCache: Map<number, GLProgram> = new Map();
  private _gl: WebGLRenderingContext;
  private _isWebGL2: boolean;
  private _versionCode: string;
  private _errorShaderSet: Set<number> = new Set();

  constructor(gl: WebGLRenderingContext, isWebGL2: boolean) {
    this._gl = gl;
    this._isWebGL2 = isWebGL2;
    if (this._isWebGL2) {
      this._versionCode = '#version 300 es\n#define VERSION 300\n';
    } else {
      this._versionCode = '#version 100\n#define VERSION 100\n';
    }
  }

  compile(material: AbstractMaterial) {
    const key = material.getShaderKey();
    let program = this._programCache.get(key);
    if (!program) {
      const defineCode = this._versionCode + material.getDefineCode();
      let vertex = '';
      let fragment = '';
      const shaderType = material.getShaderType();

      if (shaderType !== EShaderSourceType.custom) {
        vertex = defineCode + ShaderSource[shaderType].vertex;
        fragment = defineCode + ShaderSource[shaderType].fragment;
      } else {
        vertex = defineCode + (material as ShaderMaterial).getVertex();
        fragment = defineCode + (material as ShaderMaterial).getFragment();
      }
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        if (!vertex || !fragment) {
          if (!this._errorShaderSet.has(shaderType)) {
            console.error(`GLMaterialCompiler.compile: shader type ${shaderType} vertex or fragment is empty`);
          }
          this._errorShaderSet.add(shaderType);
          return null;
        }
      }

      program = new GLProgram(this._gl, vertex, fragment);
      this._programCache.set(key, program);
    }
    this._compileTexture(material);
    return program;
  }

  private _compileTexture(material: AbstractMaterial) {
    const { map } = material;
    if (!map) {
      return;
    }
    this._gl.activeTexture(this._gl.TEXTURE0);

    let { glTexture } = map.__internalTextureData;
    if (!glTexture) {
      glTexture = new GLTexture(this._gl);
      map.__internalTextureData.glTexture = glTexture;
    }
    glTexture.bind();
    if (map.needsUpdate) {
      if (map.type === 'data') {
        const { width, height, source, format } = map as DataTexture;
        glTexture.texDataTexture(
          0,
          width,
          height,
          format,
          source
        );
      } else if (map.type === 'image') {
        const { source, format } = map as ImageTexture;
        glTexture.texImageTexture(
          0,
          format,
          source
        );
      }
      map.needsUpdate = false;
    }
    glTexture.texParameters(map.wrapS, map.wrapT, map.magFilter, map.minFilter);
  }

  destroy() {
    this._programCache.forEach((value) => {
      value.destroy();
    });

    this._programCache.clear();
  }
}

export { GLMaterialCompiler };
