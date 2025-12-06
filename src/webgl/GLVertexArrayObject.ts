class GLVertexArrayObject {
  private _gl: WebGL2RenderingContext | OES_vertex_array_object;
  private _vao: WebGLVertexArrayObject | null = null;
  private _isWebGL2: boolean = false;

  constructor(gl: WebGL2RenderingContext | OES_vertex_array_object, isWebGL2: boolean) {
    this._gl = gl;
    this._isWebGL2 = isWebGL2;
    if (this._isWebGL2) {
      this._vao = (gl as WebGL2RenderingContext).createVertexArray();
    } else {
      this._vao = (gl as OES_vertex_array_object).createVertexArrayOES();
    }
  }

  bind() {
    if (this._isWebGL2) {
      (this._gl as WebGL2RenderingContext).bindVertexArray(this._vao)
    } else {
      (this._gl as OES_vertex_array_object).bindVertexArrayOES(this._vao)
    }
  }

  destroy() {
    if (this._vao) {
      if (this._isWebGL2) {
        (this._gl as WebGL2RenderingContext).deleteVertexArray(this._vao);
      } else {
        (this._gl as OES_vertex_array_object).deleteVertexArrayOES(this._vao);
      }
      this._vao = null;
    }
  }
}

export { GLVertexArrayObject };
