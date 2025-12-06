@group(0) @binding(3) var<uniform> u_color: vec4<f32>;
@group(0) @binding(4) var<uniform> u_opacity: f32;

struct FragmentInput {
  @location(0) v_join: vec2<f32>,
#ifdef USE_TEXTURE
  @location(1) v_uv: vec2<f32>,
#endif
};

#ifdef USE_TEXTURE
@group(0) @binding(5) var u_texture: texture_2d<f32>;
@group(0) @binding(6) var u_sampler: sampler;
#endif

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
  if (length(input.v_join) > 1.0) {
    discard;
  }
#ifdef USE_TEXTURE
  var color = textureSample(u_texture, u_sampler, input.v_uv);
  return vec4<f32>(color.rgb, color.a * u_opacity);
#else
  return vec4<f32>(u_color.rgb, u_color.a * u_opacity);
#endif
}
