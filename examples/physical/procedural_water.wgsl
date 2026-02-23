// WebGPU WGSL Procedural Water (procedural_water.wgsl)
// A high-end physical shader showcasing transmission, IOR, and procedural normals.

fn color(uv: vec2<f32>, time: f32) -> vec4<f32> {
    let deep = vec3<f32>(0.0, 0.05, 0.15);
    let shallow = vec3<f32>(0.0, 0.5, 0.7);
    
    // Wave height affects color tint
    let waves = sin(uv.x * 10.0 + time) * cos(uv.y * 8.0 - time * 0.5);
    let mixFactor = smoothstep(-1.0, 1.0, waves);
    
    return vec4<f32>(mix(deep, shallow, mixFactor), 0.6); // Semi-transparent base
}

fn normal(uv: vec2<f32>, time: f32) -> vec3<f32> {
    let t = time * 1.2;
    // Layered sine waves for complex surface
    let w1 = sin(uv.x * 15.0 + t);
    let w2 = cos(uv.y * 12.0 - t * 0.8);
    let w3 = sin((uv.x + uv.y) * 20.0 + t * 0.5);
    
    let slope = vec3<f32>(w1 * 0.1, w2 * 0.1, 1.0);
    return normalize(slope + vec3<f32>(w3 * 0.05, w3 * 0.05, 0.0));
}

fn roughness(uv: vec2<f32>, time: f32) -> f32 {
    // Water is smooth but has tiny micro-disturbances
    let micro = sin(uv.x * 100.0 + time * 10.0) * 0.02;
    return 0.02 + abs(micro);
}

fn transmission() -> f32 {
    return 0.9; // Highly transmissive (clear liquid)
}

fn ior() -> f32 {
    return 1.333; // Physical IOR of water
}

fn thickness() -> f32 {
    return 1.5; // Depth for refraction effect
}
