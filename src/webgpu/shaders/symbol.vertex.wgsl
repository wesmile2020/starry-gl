@group(0) @binding(0) var<uniform> u_projectionMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> u_modelViewMatrix: mat4x4<f32>;
@group(0) @binding(2) var<uniform> u_resolution: vec2<f32>;
@group(0) @binding(3) var<uniform> u_rotation: vec3<f32>;
@group(0) @binding(4) var<uniform> u_size: f32;

struct VertexInput {
  @location(0) a_position: vec3<f32>,
#ifdef USE_TEXTURE
  @location(1) a_uv: vec2<f32>,
#endif
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
#ifdef USE_TEXTURE
  @location(0) v_uv: vec2<f32>,
#endif
}

fn rotateVec3(origin: vec3<f32>, axis: vec3<f32>, angle: f32) -> vec3<f32> {
  var u = origin.x;
  var v = origin.y;
  var w = origin.z;

  var x = axis.x;
  var y = axis.y;
  var z = axis.z;

  var sinValue = sin(angle);
  var cosValue = cos(angle);

  var m = (x * u + y * v + z * w) * (1.0 - cosValue);

  return vec3<f32>(
    u * cosValue + (y * w - z * v) * sinValue + x * m,
    v * cosValue + (z * u - x * w) * sinValue + y * m,
    w * cosValue + (x * v - y * u) * sinValue + z * m
  );
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  var halfWidth = u_resolution.x / 2.0;
  var halfHeight = u_resolution.y / 2.0;

  var center = u_projectionMatrix * u_modelViewMatrix * vec4<f32>(0.0, 0.0, 0.0, 1.0);
  // center.xyz /= center.w;
  center.x /= center.w;
  center.y /= center.w;
  center.z /= center.w;


  var location = vec3(input.a_position.x / halfWidth, input.a_position.y / halfWidth, 0.0);

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

  var result = vec4<f32>(
    center.x + location.x * u_size,
    center.y + location.y * u_size,
    0.0,
    1.0
  );

  output.position = result;

#ifdef USE_TEXTURE
  output.v_uv = vec2<f32>(input.a_uv.x, 1.0 - input.a_uv.y);
#endif
  return output;
}
