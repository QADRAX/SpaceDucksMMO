# Duck Engine: Shader Scripting Guide

This guide explains how to author custom shaders for the Duck Engine using **Three.js TSL (Three Shading Language)**.

## Overview

The engine supports professional-grade materials through a hybrid approach:
- **PBR Pipeline Integration**: You don't need to write lighting code. You override specific material slots (color, roughness, normal, etc.).
- **WGSL & GLSL Support**: Direct support for modern WebGPU Shading Language and legacy GLSL.
- **Dynamic Uniforms**: Parameters defined in the ECS component are automatically available in your script.

## Parameter Injection Metaphor

Unlike traditional shaders where you access globals or uniforms via keywords, the Duck Engine uses **Functional Shading**.

1.  **You declare** what you need in the function signature (e.g., `uv`, `time`).
2.  **The Engine injects** the corresponding live data into those parameters based on their names.

---

## Built-in Input Parameters (TSL Nodes)

Declare these as parameters in your function to receive live data:

| Parameter Name | WGSL Type | Description |
|----------------|-----------|-------------|
| `uv` | `vec2<f32>` | Standard UV coordinates. |
| `time` | `f32` | Elapsed time in seconds. |
| `cameraPosition` | `vec3<f32>` | Camera position (World Space). |
| `screenSize` | `vec2<f32>` | Viewport size in pixels. |
| `positionLocal` | `vec3<f32>` | Local Vertex Position. |
| `normalLocal` | `vec3<f32>` | Local Surface Normal. |

---

## Exporting Functions

Your script should define functions named after the material property they override.

### 1. Basic Color (`color`)
Overrides the base albedo/diffuse color.

```wgsl
// WGSL Example: A simple animated pulse
fn color(time: f32) -> vec4<f32> {
  let p = sin(time * 2.0) * 0.5 + 0.5;
  return vec4<f32>(p, 0.0, 1.0 - p, 1.0);
}
```

### 2. Surface Properties
You can define specialized functions for physical effects:

- `roughness`: Returns a `f32` (0.0 to 1.0).
- `metalness`: Returns a `f32` (0.0 to 1.0).
- `normal`: Returns a `vec3<f32>` (surface normal).
- `emissive`: Returns a `vec4<f32>` (glow color).

### Example: Glossy Pattern
```wgsl
fn roughness(uv: vec2<f32>) -> f32 {
  // Create a checkerboard roughness pattern
  let grid = floor(uv * 10.0);
  let check = u32(grid.x + grid.y) % 2u;
  return select(0.01, 1.0, check == 0u);
}
```

---

## Using Custom Uniforms

Uniforms defined in the **Custom Shader Component** are also injected by name.

```wgsl
// 'uColor' and 'uIntensity' must be defined in the Inspector
fn color(uColor: vec3<f32>, uIntensity: f32) -> vec4<f32> {
  return vec4<f32>(uColor * uIntensity, 1.0);
}
```

---

## Best Practices

1. **Use WGSL**: It's the native language for WebGPU and provides better error messages and performance.
2. **Precision**: Use `f32` (float) and `vecNf` (vector) types.
3. **Safety**: If you request an input that doesn't exist, the engine returns `0.0`. Check the console for "requested missing input" warnings.
4. **PBR First**: Only override what you need (e.g. just the `roughness`). Let the engine handle the complex physics of light.
