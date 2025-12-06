import {
  GLMatrixUniform,
  GLVectorUniform,
  GLFloatUniform,
  GLUniform,
  GLIntUniform,
} from './GLUniform';

interface UniformRecord {
  int: GLIntUniform;
  float: GLFloatUniform;
  vector: GLVectorUniform;
  matrix: GLMatrixUniform;
}

class GLProgram {
  private _gl: WebGLRenderingContext;
  private _program: WebGLProgram | null = null;
  private _attributes: Map<string, number> = new Map();
  private _uniforms: Map<string, GLUniform> = new Map();

  constructor(gl: WebGLRenderingContext, vertex: string, fragment: string) {
    this._gl = gl;

    this._program = this._createProgram(vertex, fragment);
  }

  private _getShaderErrors(source: string, shader: WebGLShader, type: string) {
    const errors = this._gl.getShaderInfoLog(shader)!.trim();
    if (!errors) return '';

    const errorMatches = errors.match(/ERROR: 0:(\d+)/);

    let errorLog = '';
    if (errorMatches) {
      const errorLine = Number(errorMatches[1]);
      const details = [];
      const lines = source.split('\n');
      for (let i = 0; i < lines.length; i += 1) {
        const line = i + 1;
        details.push(`${line === errorLine ? '>' : ' '} ${line}: ${lines[i]}`);
      }
      errorLog = details.join('\n');
    }

    return `WebGLShader: gl.getShaderInfoLog() ${type.toUpperCase()}\n\n${errors}\n\n${errorLog}`;
  }

  use() {
    this._gl.useProgram(this._program);
  }

  getAttribLocation(name: string) {
    const item = this._attributes.get(name);
    if (typeof item === 'number') {
      return item;
    }
    if (!this._program) {
      return -1;
    }
    const value = this._gl.getAttribLocation(this._program, name);
    this._attributes.set(name, value);
    return value;
  }

  getUniform<T extends keyof UniformRecord>(name: string, type: T) {
    let uniform = this._uniforms.get(name);

    if (uniform && uniform.type === type) {
      return uniform as UniformRecord[T];
    }
    let address: WebGLUniformLocation | null = null;
    if (this._program) {
      address = this._gl.getUniformLocation(this._program, name);
    }
    if (!address) {
      return null;
    }
    switch (type) {
      case 'int': {
        uniform = new GLIntUniform(this._gl, address);
        break;
      }
      case 'float': {
        uniform = new GLFloatUniform(this._gl, address);
        break;
      }
      case 'vector': {
        uniform = new GLVectorUniform(this._gl, address);
        break;
      }
      case 'matrix': {
        uniform = new GLMatrixUniform(this._gl, address);
        break;
      }
      default: { break; }
    }
    this._uniforms.set(name, uniform!);
    return uniform! as UniformRecord[T];
  }

  private _createProgram(vertex: string, fragment: string) {
    const vertexShader = this._initShader(this._gl.VERTEX_SHADER, vertex);
    const fragmentShader = this._initShader(this._gl.FRAGMENT_SHADER, fragment);
    const program = this._gl.createProgram()!;
    this._gl.attachShader(program, vertexShader);
    this._gl.attachShader(program, fragmentShader);
    this._gl.linkProgram(program);
    this._gl.deleteShader(vertexShader);
    this._gl.deleteShader(fragmentShader);

    if (process.env.NODE_ENV === 'development') {
      const programLog = this._gl.getProgramInfoLog(program);
      if (this._gl.getProgramParameter(program, this._gl.LINK_STATUS) === false) {
        const vertexError = this._getShaderErrors(vertex, vertexShader, 'vertex');
        const fragmentError = this._getShaderErrors(fragment, fragmentShader, 'fragment');
        console.error('StarrGL: Program Error: ', vertexError, '\n\n', fragmentError);
        return null;
      } else if (programLog) {
        console.warn('StarrGL: Program warn: ', programLog);
      }
    }

    return program;
  }

  private _initShader(type: number, source: string) {
    const shader = this._gl.createShader(type)!;
    this._gl.shaderSource(shader, source);
    this._gl.compileShader(shader);
    return shader;
  }

  destroy() {
    if (this._program) {
      this._gl.deleteProgram(this._program);
      this._program = null;
    }
    this._attributes.clear();
    this._uniforms.clear();
  }
}

export { GLProgram };
