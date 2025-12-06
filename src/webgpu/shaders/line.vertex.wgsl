@group(0) @binding(0) var<uniform> u_projectionMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> u_modelViewMatrix: mat4x4<f32>;
@group(0) @binding(2) var<uniform> u_lineWidth: f32;

struct VertexInput {
  @location(0) a_position: vec4<f32>,
  @location(1) a_normal: vec2<f32>,
  @location(2) a_join: vec2<f32>,
#ifdef USE_TEXTURE
  @location(3) a_uv: vec2<f32>,
#endif
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) v_join: vec2<f32>,
#ifdef USE_TEXTURE
  @location(1) v_uv: vec2<f32>,
#endif
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var a_position = input.a_position;
  var a_normal = input.a_normal;
  var a_join = input.a_join;

  var location = vec4(
    a_position.xy + a_normal * u_lineWidth / 2.0,
    a_position.z,
    1.0
  );

  var output: VertexOutput;
  output.v_join = a_join;
  output.position = u_projectionMatrix * u_modelViewMatrix * location;

#ifdef USE_TEXTURE
  float x = input.a_uv.x * (u_textureSize.y / u_textureSize.x / 2.0 / u_lineWidth);
  output.v_uv = vec2(x, 1 - a_uv.y);
#endif
  return output;
}
