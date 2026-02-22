// Hologram Effect (hologram.wgsl)
// Uses normals and positions to create a Fresnel-like glow and scanlines.

fn hologram(
    uv: vec2<f32>, 
    time: f32, 
    normalView: vec3<f32>, 
    positionView: vec3<f32>
) -> vec4<f32> {
    // 1. Fresnel factor (glow at the edges)
    // viewDir is roughly -normalize(positionView) because we are in view space
    let viewDir = normalize(-positionView);
    let fresnel = 1.0 - saturate(dot(viewDir, normalize(normalView)));
    let glow = pow(fresnel, 3.0);
    
    // 2. Scanline effect
    let scanline = sin(positionView.y * 20.0 - time * 5.0) * 0.5 + 0.5;
    
    // 3. Base color (cyan/blue hologram)
    let baseColor = vec3<f32>(0.0, 0.8, 1.0);
    
    // Combine
    let finalAlpha = (glow * 0.8 + scanline * 0.2) * 0.7;
    
    return vec4<f32>(baseColor, finalAlpha);
}
