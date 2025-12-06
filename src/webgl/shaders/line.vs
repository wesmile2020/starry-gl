#if VERSION == 300
  in vec4 a_position;
  in vec2 a_normal;
  in vec2 a_join;

  out vec2 v_join;
#else
  attribute vec4 a_position;
  attribute vec2 a_normal;
  attribute vec2 a_join;

  varying vec2 v_join;
#endif

uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;
uniform float u_lineWidth;

#ifdef USE_TEXTURE
  uniform vec2 u_textureSize;
  #if VERSION == 300
    in vec2 a_uv;
    out vec2 v_uv;
  #else
    attribute vec2 a_uv;

    varying vec2 v_uv;
  #endif
#endif

void main() {
  vec4 location = vec4(
    a_position.xy + a_normal * u_lineWidth / 2.0,
    a_position.z,
    1.0
  );
  v_join = a_join;

  gl_Position = u_projectionMatrix * u_modelViewMatrix * location;

#ifdef USE_TEXTURE
  float x = a_uv.x * (u_textureSize.y / u_textureSize.x / 2.0 / u_lineWidth);
  v_uv = vec2(x, a_uv.y);
#endif
}
