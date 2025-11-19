import type { Entity } from './Entity';

export interface EcsWorldContext {
  getEntity(id: string): Entity | undefined;
  getAllEntities(): Iterable<Entity>;
}

let currentWorld: EcsWorldContext | null = null;

export function setCurrentEcsWorld(world: EcsWorldContext | null): void {
  currentWorld = world;
}

export function getCurrentEcsWorld(): EcsWorldContext | null {
  return currentWorld;
}
