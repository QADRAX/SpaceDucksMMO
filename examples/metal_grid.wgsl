// WebGPU WGSL Physical Shader Example (metal_grid.wgsl)
// For use with physicalShaderMaterial.
// The TSL engine assigns this function's output to the material's colorNode.

fn metal_grid(uv: vec2<f32>, time: f32) -> vec4<f32> {
    // Create a grid pattern
    let grid_size = 10.0;
    let grid = sin(uv.x * grid_size * 6.28) * sin(uv.y * grid_size * 6.28);
    let mask = smoothstep(0.0, 0.1, grid);
    
    // Base color modulated by the grid
    let base_color = vec3<f32>(0.7, 0.7, 0.8); // Silver/Steel
    let final_color = mix(base_color * 0.2, base_color, mask);
    
    // Simple pulsing emissive effect
    let pulse = (sin(time * 2.0) * 0.5 + 0.5) * 0.2;
    let emissive = vec3<f32>(0.0, 0.5, 1.0) * pulse * (1.0 - mask);
    
    return vec4<f32>(final_color + emissive, 1.0);
}
