/**
 * Minimal entity surface exposed by @duckengine/ecs.
 *
 * This is intentionally tiny for now (scaffold phase). We'll replace this
 * with the full ECS implementation when we migrate code out of the client.
 */
export interface ISceneEntity {
  readonly id: string;
}
