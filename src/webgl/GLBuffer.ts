class GLBuffer {
  private _gl: WebGLRenderingContext;
  private _buffer: WebGLBuffer | null = null;
  private _type: GLenum;

  constructor(gl: WebGLRenderingContext, type: GLenum) {
    this._gl = gl;
    this._buffer = gl.createBuffer();
    this._type = type;
  }

  bind() {
    this._gl.bindBuffer(this._type, this._buffer);
  }

  bufferData(data: AllowSharedBufferSource, usage: GLenum) {
    this._gl.bufferData(this._type, data, usage);
  }

  get type() {
    return this._type;
  }

  destroy() {
    if (this._buffer) {
      this._gl.deleteBuffer(this._buffer);
      this._buffer = null;
    }
  }
}

export { GLBuffer };
