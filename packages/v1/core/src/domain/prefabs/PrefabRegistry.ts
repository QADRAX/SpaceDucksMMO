import { Entity, IEcsComponentFactory } from "../ecs";
import { CoreLogger } from "../logging/CoreLogger";
import { IPrefabRegistry, type PrefabTemplate } from "../ports/IPrefabRegistry";

export class PrefabRegistry implements IPrefabRegistry {
    private templates = new Map<string, PrefabTemplate>();

    constructor(private componentFactory: IEcsComponentFactory) { }

    public register(key: string, template: PrefabTemplate): void {
        this.templates.set(key, template);
    }

    public has(key: string): boolean {
        return this.templates.has(key);
    }

    public getKeys(): string[] {
        return Array.from(this.templates.keys());
    }

    public instantiate(key: string, overrides?: {
        position?: [number, number, number],
        rotation?: [number, number, number],
        scale?: [number, number, number]
    }): Entity[] {
        const template = this.templates.get(key);
        if (!template) {
            CoreLogger.warn("PrefabRegistry", `Template not found: ${key}`);
            return [];
        }

        const idMap = new Map<string, string>();
        const newEntities: Entity[] = [];

        // Helper for ID generation consistent with ECS
        const generateId = () =>
            globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

        // 1. First pass: generate new IDs for all entities in the template
        for (const oldId of template.entities.keys()) {
            idMap.set(oldId, generateId());
        }

        // 2. Second pass: create entities and clone components
        for (const [oldId, oldEntity] of template.entities) {
            const newId = idMap.get(oldId)!;
            const newEntity = new Entity(newId);

            newEntity.displayName = oldEntity.displayName;
            newEntity.gizmoIcon = oldEntity.gizmoIcon;

            // Copy transform (Local)
            newEntity.transform.copyFrom(oldEntity.transform);

            // Copy components
            for (const oldComp of oldEntity.getAllComponents()) {
                const props: Record<string, any> = {};
                const fields = oldComp.metadata.inspector?.fields;

                if (fields) {
                    for (const field of fields) {
                        if (field.get) {
                            props[field.key] = field.get(oldComp as any);
                        } else {
                            props[field.key] = (oldComp as any)[field.key];
                        }
                    }
                } else {
                    // Fallback: copy public properties that are likely data
                    for (const k of Object.keys(oldComp)) {
                        if (k === 'type' || k === 'metadata' || k.startsWith('_')) continue;
                        const val = (oldComp as any)[k];
                        if (typeof val !== 'function' && typeof val !== 'object') {
                            props[k] = val;
                        }
                    }
                }

                try {
                    const newComp = this.componentFactory.create(oldComp.type, props);
                    newComp.enabled = oldComp.enabled;
                    newEntity.addComponent(newComp);
                } catch (e) {
                    CoreLogger.error("PrefabRegistry", `Failed to clone component ${oldComp.type} for entity ${oldEntity.displayName}:`, e);
                }
            }

            newEntities.push(newEntity);
        }

        // 3. Third pass: restore parenthood relationships
        for (const [oldId, oldEntity] of template.entities) {
            const newEntityId = idMap.get(oldId)!;
            const newEntity = newEntities.find(e => e.id === newEntityId)!;

            for (const oldChild of oldEntity.getChildren()) {
                const newChildId = idMap.get(oldChild.id);
                if (newChildId) {
                    const newChild = newEntities.find(e => e.id === newChildId)!;
                    newEntity.addChild(newChild);
                }
            }
        }

        // 4. Apply overrides to primary root(s)
        for (const rootId of template.rootIds) {
            const newRootId = idMap.get(rootId);
            if (newRootId) {
                const newRoot = newEntities.find(e => e.id === newRootId)!;
                if (overrides?.position) {
                    newRoot.transform.setPosition(overrides.position[0], overrides.position[1], overrides.position[2]);
                }
                if (overrides?.rotation) {
                    newRoot.transform.setRotation(overrides.rotation[0], overrides.rotation[1], overrides.rotation[2]);
                }
                if (overrides?.scale) {
                    newRoot.transform.setScale(overrides.scale[0], overrides.scale[1], overrides.scale[2]);
                }
            }
        }

        return newEntities;
    }
}
