precision highp float;

uniform float u_opacity;
uniform vec4 u_color;

#ifdef USE_TEXTURE
  uniform sampler2D map;
  #if VERSION == 300
    in vec2 v_uv;
  #else
    varying vec2 v_uv;
    #define texture texture2D
  #endif

  #ifdef DRAW_TEXT_SYMBOL
    uniform float u_halo;
    uniform float u_gamma;
  #endif
#endif

#if VERSION == 300
  out vec4 FragColor;
#else
  #define FragColor gl_FragColor
#endif

void main() {
#ifdef USE_TEXTURE
  #ifdef DRAW_TEXT_SYMBOL
    float dist = texture(map, v_uv).r;
    float alpha = smoothstep(u_halo - u_gamma, u_halo + u_gamma, dist);
    FragColor = vec4(u_color.rgb, alpha * u_opacity);
  #else
    vec4 color = texture(map, v_uv);
    FragColor = vec4(color.rgb, color.a * u_opacity);
  #endif
#else
  FragColor = vec4(u_color.rgb, u_color.a * u_opacity);
#endif
}
