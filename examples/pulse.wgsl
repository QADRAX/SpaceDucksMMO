// Pulsing Color (pulse.wgsl)
// A calm color transition to test time-based animations.

fn pulse(uv: vec2<f32>, time: f32, speed: f32) -> vec4<f32> {
    // 1. Calculate pulse factor (using speed uniform)
    let factor = sin(time * speed) * 0.5 + 0.5;
    
    // 2. Interpolate between two calm colors
    let colorA = vec3<f32>(0.2, 0.4, 0.6); // Muted blue
    let colorB = vec3<f32>(0.6, 0.4, 0.2); // Muted orange/brown
    
    let finalColor = mix(colorA, colorB, factor);
    
    // 3. Subtle vignette based on UV
    let dist = distance(uv, vec2<f32>(0.5, 0.5));
    let vignette = 1.0 - smoothstep(0.4, 0.8, dist);
    
    return vec4<f32>(finalColor * vignette, 1.0);
}
