/**
 * Built-In Script Assets
 *
 * This package includes a collection of generic scripts bundled during build.
 * They are embedded as TypeScript strings in `src/generated/ScriptAssets.ts`.
 *
 * ## How it works
 *
 * 1. **res/scripts/builtin/** - Raw Lua script files (git-tracked)
 * 2. **scripts/generate-scripts.ts** - Build-time generator
 * 3. **src/generated/ScriptAssets.ts** - Auto-generated; embedded as strings
 * 4. **createBuiltInScriptResolver()** - Runtime resolver that returns scripts by ID
 *
 * ## Usage
 *
 * The adapter automatically uses built-in scripts if no custom resolver is provided:
 *
 * ```typescript
 * import { createScriptingAdapter, createMockSandbox, createScriptEventBus } from '@duckengine/scripting-lua';
 *
 * const adapter = createScriptingAdapter({
 *   engine: engineState,
 *   sceneId: 'main_scene',
 *   bridges: [...],
 *   sandbox: createMockSandbox(),
 *   eventBus: createScriptEventBus(),
 *   timeState: { delta: 0, elapsed: 0, frameCount: 0, scale: 1 },
 *   // resolveSource is optional; defaults to built-in scripts
 * });
 * ```
 *
 * ## Built-In Scripts
 *
 * Scripts are referenced by their `builtin://` namespace:
 *
 * - `builtin://empty` - No-op template script
 * - `builtin://debug_logger` - Logs transform state each frame
 * - `builtin://spawn_emitter` - Emits entity copies at intervals
 * - `builtin://continuous_rotator` - Rotates entity around an axis
 * - `builtin://physics_movement` - WASD physics-based movement
 *
 * ## Adding New Scripts
 *
 * 1. Create a `.lua` file in `res/scripts/builtin/`
 * 2. Run `npm run build:scripts` or just `npm run build`
 * 3. The script is now available as `builtin://<filename>` without the `.lua` extension
 *
 * ## Extending with Custom Resolvers
 *
 * Provide your own resolver for dynamic or user-authored scripts:
 *
 * ```typescript
 * const customResolver = async (scriptId: string) => {
 *   if (scriptId.startsWith('builtin://')) {
 *     // Fall back to built-in
 *     return BuiltInScripts[scriptId] ?? null;
 *   }
 *   if (scriptId.startsWith('user://')) {
 *     // Load from database or API
 *     return fetchUserScript(scriptId);
 *   }
 *   return null;
 * };
 *
 * const adapter = createScriptingAdapter({
 *   ...,
 *   resolveSource: customResolver,
 * });
 * ```
 */
