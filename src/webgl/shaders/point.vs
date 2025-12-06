in vec4 a_position;
uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;
uniform float u_pointSize;

void main() {
  gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
  gl_PointSize = u_pointSize;
}
