// 1. Contracts (what infrastructure implements)
export * from './ports';

// 2. Data shapes for scripts
export * from './schemas';

// 3. Property diff and normalization
export * from './properties';

// 4. ECS component accessors
export * from './componentAccessors';

// 5. Script ID predicates (builtin/test)
export * from './scriptResolution';

// 6. Slot state and lifecycle
export * from './slots';

// 7. Session state and runtime init
export * from './session';

// 8. Bridge declarations and Lua-facing context
export * from './bridges';
