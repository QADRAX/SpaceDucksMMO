// WebGPU WGSL Procedural Water Example (procedural_water.wgsl)
// This shader drives multiple nodes of a Physical Shader Material.

// Function for the base color (Albedo)
fn color(uv: vec2<f32>, time: f32) -> vec4<f32> {
    let water_blue = vec3<f32>(0.0, 0.4, 0.8);
    let deep_blue = vec3<f32>(0.0, 0.1, 0.3);
    
    // Wave pattern for color variation
    let wave = sin(uv.x * 10.0 + time) * 0.5 + 0.5;
    return vec4<f32>(mix(deep_blue, water_blue, wave), 0.8);
}

// Function for the normal map (Procedural waves)
fn normal(uv: vec2<f32>, time: f32) -> vec3<f32> {
    let scale = 20.0;
    let t = time * 1.5;
    
    let wave1 = sin(uv.x * scale + t);
    let wave2 = cos(uv.y * scale + t * 0.8);
    
    // Create a procedural normal vector
    // We perturbe the base normal (0, 0, 1 in tangent space usually, but here TSL expects world/local)
    // TSL's normalNode generally expects a direction.
    let n = normalize(vec3<f32>(wave1 * 0.2, wave2 * 0.2, 1.0));
    return n;
}

// Function for roughness (Water is very smooth)
fn roughness(uv: vec2<f32>, time: f32) -> f32 {
    return 0.05; // Very glossy
}

// Function for metalness (Water is dielectric)
fn metalness(uv: vec2<f32>, time: f32) -> f32 {
    return 0.0;
}
