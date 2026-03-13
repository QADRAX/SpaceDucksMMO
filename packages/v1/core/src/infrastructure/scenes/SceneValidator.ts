import { Entity, Component, ComponentType } from '../../domain/ecs';

/**
 * Helper class for scene-level validations.
 * Extracted from BaseScene to reduce its size and improve maintainability.
 */
export class SceneValidator {
    constructor(private entities: Map<string, Entity>) { }

    /**
     * Validates hierarchy requirements for a subtree.
     */
    public validateHierarchyRequirementsInSubtree(root: Entity): string[] {
        const errors: string[] = [];
        const visit = (e: Entity) => {
            errors.push(...this.validateHierarchyRequirements(e));
            for (const c of e.getChildren()) visit(c);
        };
        visit(root);
        return errors;
    }

    /**
     * Validates component uniqueness requirements for a subtree against the existing scene.
     */
    public validateUniqueInSceneInSubtree(root: Entity, currentSceneEntities: Map<string, Entity>): string[] {
        const errors: string[] = [];
        const seenInSubtree: Map<string, string> = new Map(); // type -> firstEntityId

        const visit = (e: Entity) => {
            for (const comp of e.getAllComponents() as Component[]) {
                const uniqueInScene = (comp.metadata as any)?.uniqueInScene as boolean | undefined;
                if (!uniqueInScene) continue;

                const alreadyInSubtree = seenInSubtree.get(comp.type);
                if (alreadyInSubtree && alreadyInSubtree !== e.id) {
                    errors.push(
                        `Component '${comp.type}' is unique in scene but appears on multiple entities in the added subtree ('${alreadyInSubtree}' and '${e.id}')`
                    );
                    continue;
                }
                seenInSubtree.set(comp.type, e.id);

                const existing = this.findEntityWithComponent(comp.type, currentSceneEntities);
                if (existing) {
                    errors.push(
                        `Component '${comp.type}' is unique in scene but already exists on entity '${existing.id}'`
                    );
                }
            }
            for (const c of e.getChildren()) visit(c);
        };

        visit(root);
        return errors;
    }

    /**
     * Finds an entity that contains a specific component type in the given entities map.
     */
    public findEntityWithComponent(type: string, entities: Map<string, Entity>, excludeEntityId?: string): Entity | undefined {
        for (const ent of entities.values()) {
            if (excludeEntityId && ent.id === excludeEntityId) continue;
            try {
                if (ent.hasComponent(type as ComponentType)) return ent;
            } catch {
                // Safe to ignore if type is invalid for a specific entity
            }
        }
        return undefined;
    }

    /**
     * Validates hierarchy requirements for a single entity (owner/ancestor dependencies).
     */
    public validateHierarchyRequirements(entity: Entity): string[] {
        const errors: string[] = [];
        for (const comp of entity.getAllComponents() as Component[]) {
            const reqs = (comp.metadata as any)?.requiresInHierarchy as string[] | undefined;
            if (!reqs || reqs.length === 0) continue;
            for (const req of reqs) {
                if (!this.hasComponentInSelfOrAncestors(entity, req)) {
                    errors.push(
                        `Component '${comp.type}' on entity '${entity.id}' requires '${req}' on this entity or an ancestor`
                    );
                }
            }
        }
        return errors;
    }

    /**
     * Checks if a component type exists in the entity's hierarchy (self or ancestors).
     */
    public hasComponentInSelfOrAncestors(entity: Entity, type: string): boolean {
        let cur: Entity | undefined = entity;
        while (cur) {
            if (cur.hasComponent(type as ComponentType)) return true;
            cur = cur.parent;
        }
        return false;
    }

    /**
     * Checks if attaching child to candidateParent would create a hierarchy cycle.
     */
    public wouldCreateCycle(child: Entity, candidateParent: Entity): boolean {
        let cur: Entity | undefined = candidateParent;
        while (cur) {
            if (cur.id === child.id) return true;
            cur = cur.parent;
        }
        return false;
    }
}
