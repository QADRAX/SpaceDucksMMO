import type { Entity } from './Entity';

export interface EcsWorldContext {
  getEntity(id: string): Entity | undefined;
  getAllEntities(): Iterable<Entity>;
}

const ECS_WORLD_KEY = Symbol.for('@duckengine/core.currentWorld');

function getGlobalStore(): any {
  return globalThis as any;
}

export function setCurrentEcsWorld(world: EcsWorldContext | null): void {
  getGlobalStore()[ECS_WORLD_KEY] = world;
}

export function getCurrentEcsWorld(): EcsWorldContext | null {
  return (getGlobalStore()[ECS_WORLD_KEY] as EcsWorldContext | null) ?? null;
}
