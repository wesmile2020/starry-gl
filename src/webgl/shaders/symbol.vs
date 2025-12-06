#if VERSION == 300
  in vec4 a_position;
#else
  attribute vec4 a_position;
#endif


uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;
uniform vec2 u_resolution;
uniform vec3 u_rotation;
uniform float u_size;

#ifdef USE_TEXTURE
  #if VERSION == 300
    in vec2 a_uv;
    out vec2 v_uv;
  #else
    attribute vec2 a_uv;
    varying vec2 v_uv;
  #endif
#endif

vec3 rotateVec3(vec3 origin, vec3 axis, float angle) {
  float u = origin.x;
  float v = origin.y;
  float w = origin.z;

  float x = axis.x;
  float y = axis.y;
  float z = axis.z;

  float sinValue = sin(angle);
  float cosValue = cos(angle);

  float m = (x * u + y * v + z * w) * (1.0 - cosValue);

  return vec3(
    u * cosValue + (y * w - z * v) * sinValue + x * m,
    v * cosValue + (z * u - x * w) * sinValue + y * m,
    w * cosValue + (x * v - y * u) * sinValue + z * m
  );
}

void main() {
#ifdef USE_TEXTURE
  v_uv = a_uv;
#endif

  float halfWidth = u_resolution.x / 2.0;
  float halfHeight = u_resolution.y / 2.0;

  vec4 center = u_projectionMatrix * u_modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  center.xyz /= center.w;

  vec3 location = vec3(a_position.x / halfWidth, a_position.y / halfWidth, 0.0);

#if EULER_ORDER == 0
  location = rotateVec3(location, vec3(1.0, 0.0, 0.0), u_rotation.x);
  location = rotateVec3(location, vec3(0.0, 1.0, 0.0), u_rotation.y);
  location = rotateVec3(location, vec3(0.0, 0.0, 1.0), u_rotation.z);
#elif EULER_ORDER == 1
  location = rotateVec3(location, vec3(0.0, 1.0, 0.0), u_rotation.y);
  location = rotateVec3(location, vec3(0.0, 0.0, 1.0), u_rotation.z);
  location = rotateVec3(location, vec3(1.0, 0.0, 0.0), u_rotation.x);
#elif EULER_ORDER == 2
  location = rotateVec3(location, vec3(0.0, 0.0, 1.0), u_rotation.z);
  location = rotateVec3(location, vec3(1.0, 0.0, 0.0), u_rotation.x);
  location = rotateVec3(location, vec3(0.0, 1.0, 0.0), u_rotation.y);
#elif EULER_ORDER == 3
  location = rotateVec3(location, vec3(1.0, 0.0, 0.0), u_rotation.x);
  location = rotateVec3(location, vec3(0.0, 0.0, 1.0), u_rotation.z);
  location = rotateVec3(location, vec3(0.0, 1.0, 0.0), u_rotation.y);
#elif EULER_ORDER == 4
  location = rotateVec3(location, vec3(0.0, 1.0, 0.0), u_rotation.y);
  location = rotateVec3(location, vec3(1.0, 0.0, 0.0), u_rotation.x);
  location = rotateVec3(location, vec3(0.0, 0.0, 1.0), u_rotation.z);
#elif EULER_ORDER == 5
  location = rotateVec3(location, vec3(0.0, 0.0, 1.0), u_rotation.z);
  location = rotateVec3(location, vec3(0.0, 1.0, 0.0), u_rotation.y);
  location = rotateVec3(location, vec3(1.0, 0.0, 0.0), u_rotation.x);
#endif

  location.y *= halfWidth / halfHeight;

  vec4 result = vec4(
    center.x + location.x * u_size,
    center.y + location.y * u_size,
    0.0,
    1.0
  );

  gl_Position = result;
}
