import type { EntityGuard } from '../useCases';
import type { AddComponentToEntityParams } from '../../application/entity/addComponentToEntity';
import { ok, err } from '../utils';

/**
 * Validates that if a component is marked as `uniqueInScene`, it doesn't
 * already exist on any other entity in the scene.
 */
export const guardUniqueInScene: EntityGuard<AddComponentToEntityParams> = (
    scene,
    _entity,
    { component },
) => {
    if (component.metadata.uniqueInScene) {
        for (const other of scene.entities.values()) {
            if (other.components.has(component.type)) {
                return err(
                    'validation',
                    `Component "${component.type}" is unique in the scene and already present on entity "${other.id}".`,
                );
            }
        }
    }
    return ok(undefined);
};
