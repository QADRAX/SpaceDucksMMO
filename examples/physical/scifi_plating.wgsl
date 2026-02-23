// WebGPU WGSL Sci-Fi Plating (scifi_plating.wgsl)
// A high-end PBR material demo for PhysicalShaderMaterial.

// --- Helper Functions ---
fn get_grid(uv: vec2<f32>, scale: f32) -> f32 {
    let p = uv * scale;
    let grid = abs(fract(p - 0.5) - 0.5) / fwidth(p);
    return min(grid.x, grid.y);
}

// --- PBR Hooks ---

// 1. Albedo (Base Color)
fn fragmentMain(uv: vec2<f32>, time: f32, uColor: vec3<f32>) -> vec3<f32> {
    let base = uColor; // Customizable plating color from uniform
    let detail = sin(uv.x * 20.0) * sin(uv.y * 20.0);
    let platingColor = mix(base, base * 1.5, smoothstep(0.0, 0.1, detail));
    return platingColor;
}

// 2. Surface Roughness
fn roughness(uv: vec2<f32>, time: f32) -> f32 {
    let g = get_grid(uv, 5.0);
    let lines = 1.0 - smoothstep(0.0, 0.05, g);
    // Smooth plates, rough gaps
    return mix(0.1, 0.8, lines);
}

// 3. Metalness
fn metalness(uv: vec2<f32>) -> f32 {
    return 1.0; // Everything is metallic
}

// 4. Emissive (Animated Circuitry)
fn emissive(uv: vec2<f32>, time: f32, uCircuitSpeed: f32) -> vec3<f32> {
    let p = uv * 5.0;
    let grid = abs(fract(p - 0.5) - 0.5) / fwidth(p);
    let lines = 1.0 - smoothstep(0.0, 0.05, min(grid.x, grid.y));
    
    // Animated energy pulse tracking along UV
    let pulse = sin(uv.x * 8.0 - time * uCircuitSpeed) * 0.5 + 0.5;
    let intensity = pow(pulse, 12.0) * lines; 
    
    // Return vec3 for emissive
    return vec3<f32>(0.0, 0.9, 1.0) * intensity * 5.0; // Brighter blue
}
