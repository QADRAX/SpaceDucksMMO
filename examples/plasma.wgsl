// WebGPU WGSL Custom Shader (plasma.wgsl)
// This function will be evaluated by the Three.js TSL engine and assigned to the material's colorNode.

fn plasma(uv: vec2<f32>, time: f32) -> vec4<f32> {
    // Escala y desplaza UV para tener el centro en el origen
    let p = uv * 2.0 - 1.0;
    
    // Calcula oscilaciones de color basadas en las coordenadas y el tiempo
    let t = time * 0.5;
    let r = sin(p.x * 10.0 + t) * 0.5 + 0.5;
    let g = cos(p.y * 10.0 - t) * 0.5 + 0.5;
    let b = sin((p.x + p.y) * 5.0 + t) * 0.5 + 0.5;
    
    // Retorna el color RGBA
    return vec4<f32>(r, g, b, 1.0);
}
