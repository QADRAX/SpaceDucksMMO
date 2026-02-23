# Physical Shaders (Full PBR Demos)

These shaders are designed for `PhysicalShaderMaterialComponent`. They expose the full power of the WebGPU PBR pipeline, including procedural roughness, metalness, and refraction.

## Examples

### Sci-Fi Plating (`scifi_plating.wgsl`)
A high-end metallic surface with procedural panels and animated glowing circuitry.

**Custom Uniforms:**
| Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `uColor` | `color` | `#999999` | The base color of the metal plating. |
| `uCircuitSpeed` | `float` | `2.0` | Speed of the energy pulse animation. |

---

### Procedural Water (`procedural_water.wgsl`)
A translucent liquid material using transmission, IOR, and procedural surface normals.

**Custom Uniforms:**
- None (Uses built-in trigonometric functions and time).

**Material Settings (suggested):**
- **Roughness**: Managed by shader.
- **Transmission**: 0.9
- **IOR**: 1.333
- **Transparent**: True

## How to use in Engine
When creating a `PhysicalShaderMaterial` resource:
1. Upload the chosen `.wgsl`.
2. Use **Auto-detect** to find custom uniforms like `uColor`.
3. Adjust the PBR properties (like Transparency or Metalness) to complement the procedural logic.
