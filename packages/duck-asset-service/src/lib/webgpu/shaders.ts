/**
 * WGSL shader code for PBR material rendering
 */

export const MATERIAL_SHADER_CODE = `
struct Uniforms {
  modelViewProjection: mat4x4<f32>,
  hasNormal: f32,
  hasRoughness: f32,
  hasMetallic: f32,
  hasAO: f32,
  lightDir: vec3<f32>,
  lightIntensity: f32,
  ambientIntensity: f32,
  metallicMultiplier: f32,
  roughnessMultiplier: f32,
  aoStrength: f32,
  normalStrength: f32,
  heightScale: f32,
  emissionStrength: f32,
  padding: f32, // Alignment padding
}
@binding(0) @group(0) var<uniform> uniforms: Uniforms;
@binding(1) @group(0) var textureSampler: sampler;
@binding(2) @group(0) var albedoTexture: texture_2d<f32>;
@binding(3) @group(0) var normalTexture: texture_2d<f32>;
@binding(4) @group(0) var roughnessTexture: texture_2d<f32>;
@binding(5) @group(0) var metallicTexture: texture_2d<f32>;
@binding(6) @group(0) var aoTexture: texture_2d<f32>;
@binding(7) @group(0) var heightTexture: texture_2d<f32>;
@binding(8) @group(0) var emissionTexture: texture_2d<f32>;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) worldNormal: vec3<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) worldPos: vec3<f32>,
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.modelViewProjection * vec4<f32>(input.position, 1.0);
  output.worldNormal = input.normal;
  output.worldPos = input.position;
  output.uv = input.uv;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  // Sample base albedo
  let albedo = textureSample(albedoTexture, textureSampler, input.uv).rgb;
  
  // Normal mapping with strength control
  var normal = normalize(input.worldNormal);
  if (uniforms.hasNormal > 0.5) {
    let normalMap = textureSample(normalTexture, textureSampler, input.uv).rgb;
    let tangentNormal = normalMap * 2.0 - 1.0;
    // Simple normal perturbation (simplified tangent space)
    normal = normalize(normal + tangentNormal * uniforms.normalStrength);
  }
  
  // Material properties with multipliers
  var roughness = 0.5;
  if (uniforms.hasRoughness > 0.5) {
    roughness = textureSample(roughnessTexture, textureSampler, input.uv).r * uniforms.roughnessMultiplier;
  } else {
    roughness = uniforms.roughnessMultiplier;
  }
  roughness = clamp(roughness, 0.04, 1.0);
  
  var metallic = 0.0;
  if (uniforms.hasMetallic > 0.5) {
    // Has metallic map: sample and apply multiplier
    metallic = textureSample(metallicTexture, textureSampler, input.uv).r * uniforms.metallicMultiplier;
  }
  // If no metallic map, metallic stays 0.0 (non-metallic)
  metallic = clamp(metallic, 0.0, 1.0);
  
  var ao = 1.0;
  if (uniforms.hasAO > 0.5) {
    let aoSample = textureSample(aoTexture, textureSampler, input.uv).r;
    ao = mix(1.0, aoSample, uniforms.aoStrength);
  }
  
  // Emission
  var emission = vec3<f32>(0.0);
  let emissionSample = textureSample(emissionTexture, textureSampler, input.uv).rgb;
  emission = emissionSample * uniforms.emissionStrength;
  
  // Note: Height map (parallax mapping) is not implemented in this shader
  // It would require proper tangent space calculations and view direction
  // The height texture binding exists but is not actively used for displacement
  let heightSample = textureSample(heightTexture, textureSampler, input.uv).r; // Keep binding active
  
  // Lighting
  let lightDir = normalize(uniforms.lightDir);
  let viewDir = normalize(vec3<f32>(0.0, 0.0, 1.0));
  
  // Diffuse lighting
  let NdotL = max(dot(normal, lightDir), 0.0);
  let diffuse = albedo * NdotL * uniforms.lightIntensity * (1.0 - metallic);
  
  // Specular (Blinn-Phong)
  let halfDir = normalize(lightDir + viewDir);
  let NdotH = max(dot(normal, halfDir), 0.0);
  let shininess = 32.0 * (1.0 - roughness);
  let specularStrength = mix(0.04, 1.0, metallic);
  let specular = vec3<f32>(pow(NdotH, shininess) * specularStrength * uniforms.lightIntensity);
  
  // Ambient lighting with AO
  let ambient = albedo * uniforms.ambientIntensity * ao;
  
  // Combine: ambient + (diffuse + specular) * ao + emission
  let color = ambient + (diffuse + specular) * ao + emission;
  
  return vec4<f32>(color, 1.0);
}
`;
