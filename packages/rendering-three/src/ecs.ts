// ECS-only entrypoint for tests/tooling.
// Importing from `@duckengine/rendering-three` pulls in Three.js renderer code,
// which is not Jest-friendly (ESM-only dependencies). This entrypoint avoids that.

export * from '@duckengine/ecs';
