// Checkerboard Pattern (checkerboard.wgsl)
// A simple geometric pattern to test UV coordinates.

fn checkerboard(uv: vec2<f32>, time: f32, gridScale: f32) -> vec4<f32> {
    // 1. Scale UV to create cells
    let grid = floor(uv * gridScale);
    
    // 2. Checker logic (even/odd sum of coordinates)
    let checker = (u32(grid.x) + u32(grid.y)) % 2u;
    
    // 3. Colors
    let colorA = vec3<f32>(0.1, 0.1, 0.1); // Dark gray
    let colorB = vec3<f32>(0.9, 0.9, 0.9); // Light gray
    
    let finalColor = mix(colorA, colorB, f32(checker));
    
    return vec4<f32>(finalColor, 1.0);
}
