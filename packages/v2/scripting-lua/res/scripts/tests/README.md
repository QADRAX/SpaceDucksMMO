# Test Scripts (res/scripts/tests)

Lua scripts for integration tests. Included in pre-build via `npm run build:scripts`.

## Usage

- **Script IDs**: `test://<filename>.lua` (e.g. `test://minimal_init.lua`)
- **Resolver**: `createBuiltInScriptResolver` handles both `builtin://` and `test://`
- **Tests**: `src/infrastructure/testing/componentIsolation.test.ts`, `scenarios/componentBridge.scenario.test.ts`

## Isolation levels

| Script | Level | Isolates |
|--------|-------|----------|
| `minimal_init.lua` | 0 | Slot creation, init hook, no bridges |
| `minimal_properties.lua` | 1 | Properties proxy, dirty flush |
| `minimal_engine_ports.lua` | 2 | engine_ports injection |
| `minimal_update.lua` | 3 | Update pipeline, dt passing |
| `minimal_transform.lua` | 4 | Entity proxy, transform bridge via self.entity.components |
| `minimal_transform_global.lua` | 4 | Bridge shortcut via self.Transform |

## Component bridge E2E

| Script | Verifies |
|--------|----------|
| `component_bridge_properties.lua` | getField/setField for name, boxGeometry (PropertyValues) |
| `component_bridge_has_getdata.lua` | has(), getData() for name, boxGeometry, script |
| `component_bridge_resources.lua` | setResource for standardMaterial.material (ResourceRef) |
| `component_bridge_resource_mesh.lua` | setResource for fullMesh.mesh (ResourceRef) |
| `component_bridge_resource_texture.lua` | setResource for standardMaterial.albedo (texture slot) |
