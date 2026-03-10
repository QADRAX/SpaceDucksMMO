# Test Scripts (res/scripts/tests)

Lua scripts for integration tests. Included in pre-build via `npm run build:scripts`.

## Usage

- **Script IDs**: `test://<filename>.lua` (e.g. `test://minimal_init.lua`)
- **Resolver**: `createBuiltInScriptResolver` handles both `builtin://` and `test://`
- **Tests**: `src/infrastructure/testing/componentIsolation.test.ts`

## Isolation levels

| Script | Level | Isolates |
|--------|-------|----------|
| `minimal_init.lua` | 0 | Slot creation, init hook, no bridges |
| `minimal_properties.lua` | 1 | Properties proxy, dirty flush |
| `minimal_engine_ports.lua` | 2 | engine_ports injection |
| `minimal_update.lua` | 3 | Update pipeline, dt passing |
| `minimal_transform.lua` | 4 | Entity proxy, transform bridge via self.entity.components |
| `minimal_transform_global.lua` | 4 | Bridge shortcut via self.Transform |
