precision highp float;

uniform vec4 u_color;
uniform float u_opacity;

out vec4 FragColor;

void main() {
#ifdef USE_DISCARD
  float r = distance(gl_PointCoord, vec2(0.5, 0.5));
  if (r > 0.5) {
    discard;
  }
#endif
  FragColor = vec4(u_color.rgb, u_opacity * u_color.a);
}
