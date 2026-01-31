import type { ISceneEntity } from './ISceneEntity';

/**
 * Scaffold entity implementation.
 *
 * NOTE: This is a placeholder so @duckengine packages compile. The real
 * ECS Entity will be migrated here in the next steps.
 */
export class Entity implements ISceneEntity {
  constructor(public readonly id: string) {}
}
