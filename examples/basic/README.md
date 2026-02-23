# Basic Shaders (Unlit & Patterns)

These shaders are designed for `BasicShaderMaterialComponent`. They execute on the material's `colorNode` and do not require lighting or advanced PBR reflections.

## Examples

### Checkerboard (`checkerboard.wgsl`)
A classic geometric pattern useful for verifying UV coordinates and scale.

**Custom Uniforms:**
| Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `gridScale` | `float` | `10.0` | Number of cells across the surface. |

---

### Plasma (`plasma.wgsl`)
A dynamic, psychedelic color wave effect.

**Custom Uniforms:**
- None (Uses built-in `uv` and `time`).

---

### Pulse (`pulse.wgsl`)
A calm, full-surface color transition.

**Custom Uniforms:**
| Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `speed` | `float` | `1.0` | Oscillation frequency. |

## How to use in Engine
When creating a `BasicShaderMaterial` resource:
1. Upload the `.wgsl` file.
2. The engine will auto-detect the uniforms.
3. Values can be added via the "Uniforms" section in the creation dialog or the inspector.
