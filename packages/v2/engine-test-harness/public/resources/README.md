# Resource structure for engine-test-harness

Resources are served via HTTP from `public/` (Vite dev server). Each resource has a folder with `resource.json`.

## Convention

- Key `textures/concrete-muddy` → path `/textures/concrete-muddy/resource.json`
- Key `meshes/box` → path `/meshes/box/resource.json`
- Key `scripts/player` → path `/scripts/player/resource.json`

## resource.json schema

```json
{
  "componentType": "texture",
  "componentData": {},
  "files": {
    "image": { "url": "basecolor.jpg" }
  }
}
```

- **componentType**: Must match the ResourceRef kind (texture, mesh, script, skybox, standardMaterial, etc.)
- **componentData**: Scalar attributes for the component (e.g. color, metalness for materials). Empty `{}` for texture.
- **files**: Named file slots. URLs can be relative (to the resource folder) or absolute.

## Examples

### Texture (single image)
```json
{
  "componentType": "texture",
  "componentData": {},
  "files": { "image": { "url": "basecolor.jpg" } }
}
```

### Material (future)
```json
{
  "componentType": "standardMaterial",
  "componentData": {
    "color": "#ffffff",
    "metalness": 0,
    "roughness": 0.5
  },
  "files": {
    "albedo": { "url": "basecolor.jpg" },
    "normalMap": { "url": "normal.jpg" }
  }
}
```

### Mesh
```json
{
  "componentType": "mesh",
  "componentData": {},
  "files": { "geometry": { "url": "geometry.json" } }
}
```
