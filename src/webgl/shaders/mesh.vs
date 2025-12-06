#if VERSION == 300
  in vec4 a_position;
#else
  attribute vec4 a_position;
#endif
uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;

#ifdef USE_TEXTURE
  #if VERSION == 300
    in vec2 a_uv;
    out vec2 v_uv;
  #else
    attribute vec2 a_uv;
    varying vec2 v_uv;
  #endif
#endif

void main() {
  gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
  gl_PointSize = 10.0;

#ifdef USE_TEXTURE
  v_uv = a_uv;
#endif
}
