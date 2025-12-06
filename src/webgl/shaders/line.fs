precision highp float;

uniform vec4 u_color;
uniform float u_opacity;

#if VERSION == 300
  in vec2 v_join;
#else
  varying vec2 v_join;
#endif

#ifdef USE_TEXTURE
  uniform sampler2D u_sampler;
  #if VERSION == 300
    in vec2 v_uv;
  #else
    varying v_uv;
    #define texture texture2D
  #endif
#endif

#if VERSION == 300
  out vec4 FragColor;
#else
  #define FragColor gl_FragColor
#endif

void main() {
  if (length(v_join) > 1.0) {
    discard;
  }

#ifdef USE_TEXTURE
  vec4 color = texture(u_sampler, v_uv);
  FragColor = vec4(color.rgb, u_opacity * color.a);
#else
  FragColor = vec4(u_color.rgb, u_opacity * u_color.a);
#endif
}
