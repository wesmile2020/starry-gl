@group(0) @binding(5) var<uniform> u_color: vec4<f32>;
@group(0) @binding(6) var<uniform> u_opacity: f32;

#ifdef USE_TEXTURE
struct FragmentInput {
  @location(0) v_uv: vec2<f32>,
};
#endif

#ifdef USE_TEXTURE
@group(0) @binding(7) var u_texture: texture_2d<f32>;
@group(0) @binding(8) var u_sampler: sampler;

  #ifdef DRAW_TEXT_SYMBOL
    @group(0) @binding(9) var<uniform> u_halo: f32;
    @group(0) @binding(10) var<uniform> u_gamma: f32;
  #endif
#endif

#ifdef USE_TEXTURE
@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
  #ifdef DRAW_TEXT_SYMBOL
    var dist = textureSample(u_texture, u_sampler, input.v_uv).r;
    var alpha = smoothstep(u_halo - u_gamma, u_halo + u_gamma, dist);
    return vec4<f32>(u_color.rgb, alpha * u_opacity);
  #else
    var color = textureSample(u_texture, u_sampler, input.v_uv);
    return vec4<f32>(color.rgb, color.a * u_opacity);
  #endif
}
#else
@fragment
fn main() -> @location(0) vec4<f32> {
  return vec4<f32>(u_color.rgb, u_color.a * u_opacity);
}
#endif
