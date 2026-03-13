import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createEntityId } from '../setup';
import type { TestContext } from '../setup';
import { createComponent, getComponentMetadata } from '../../../domain/components/factory';
import { createEntity } from '../../../domain/entities/entity';
import type { CreatableComponentType } from '../../../domain/components/types/factory';
import { getFieldValue } from '../../../domain/components/resolveFieldPath';

// We import specs to have a single source of truth for defaults and fields
import { IDENTITY_SPECS } from '../../../domain/components/constants/gameplay/identity';
import { SCRIPTING_SPECS } from '../../../domain/components/constants/gameplay/scripting';
import { GEOMETRY_SPECS } from '../../../domain/components/constants/rendering/geometrySpecs';
import { MATERIAL_SPECS } from '../../../domain/components/constants/rendering/material';
import { SHADER_MATERIAL_SPECS } from '../../../domain/components/constants/rendering/shaderMaterial';
import { CAMERA_SPECS } from '../../../domain/components/constants/rendering/camera';
import { TEXTURE_SPECS } from '../../../domain/components/constants/rendering/texture';
import { LIGHT_SPECS } from '../../../domain/components/constants/rendering/light';
import { EFFECT_SPECS } from '../../../domain/components/constants/rendering/effects';
import { ENVIRONMENT_SPECS } from '../../../domain/components/constants/rendering/environment';
import { PHYSICS_SPECS } from '../../../domain/components/constants/physics/physicsSpecs';

const ALL_SPECS: Record<string, { defaults: Record<string, any> }> = {
    ...IDENTITY_SPECS,
    ...GEOMETRY_SPECS,
    ...MATERIAL_SPECS,
    ...SHADER_MATERIAL_SPECS,
    ...CAMERA_SPECS,
    ...TEXTURE_SPECS,
    ...LIGHT_SPECS,
    ...EFFECT_SPECS,
    ...ENVIRONMENT_SPECS,
    ...PHYSICS_SPECS,
    ...SCRIPTING_SPECS,
};

const ALL_TYPES = Object.keys(ALL_SPECS) as CreatableComponentType[];

describe('Integration: Component > setField', () => {
    let ctx: TestContext;
    const MAIN_SCENE = createSceneId('main');
    const E1 = createEntityId('e1');

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: MAIN_SCENE });
        ctx.api.scene(MAIN_SCENE).addEntity({
            entity: createEntity(E1)
        });
    });

    describe('All Component Types Validation', () => {
        it.each(ALL_TYPES)('%s: should successfully set and validate fields via API', (type) => {
            const entityApi = ctx.api.scene(MAIN_SCENE).entity(E1);
            const meta = getComponentMetadata(type);

            // Satisfy requirements recursively for this test
            if (meta.requires?.includes('geometry')) {
                entityApi.addComponent({ component: createComponent('boxGeometry') as any });
            }
            if (meta.requires?.includes('cameraView')) {
                entityApi.addComponent({ component: createComponent('cameraView') as any });
            }
            if (meta.requiresInHierarchy?.includes('rigidBody')) {
                entityApi.addComponent({ component: createComponent('rigidBody') as any });
            }

            const component = createComponent(type) as any;
            const addResult = entityApi.addComponent({ component });
            expect(addResult.ok).toBe(true);

            const compApi = entityApi.component(type);
            const defaults = ALL_SPECS[type].defaults;

            // Find a field in the inspector to test
            const field = meta.inspector?.fields.find(f =>
                f.type === 'number' || f.type === 'boolean' || f.type === 'color' || f.type === 'enum' || f.type === 'string'
            );

            if (!field) return;

            const targetKey = field.key;
            const originalValue = getFieldValue(defaults, targetKey) as any;
            let newValue: any;

            if (field.type === 'number') {
                newValue = (originalValue ?? 0) + 1;
                if (field.max !== undefined && newValue > field.max) newValue = field.max;
                if (field.min !== undefined && newValue < field.min) newValue = field.min;
            } else if (field.type === 'boolean') {
                newValue = !originalValue;
            } else if (field.type === 'color') {
                newValue = "#ff0000";
            } else if (field.type === 'enum') {
                newValue = field.options?.find(o => o.value !== originalValue)?.value ?? originalValue;
            } else {
                newValue = (originalValue ?? "") + "_updated";
            }

            const result = (compApi as any).setField({
                fieldKey: targetKey,
                value: newValue
            });

            if (!result.ok) {
                console.error(`FAILED SET: ${type}.${targetKey} val=${newValue}`, result.error);
            }
            expect(result.ok).toBe(true);

            // Verify in Engine State
            const entityState = ctx.engine.scenes.get(MAIN_SCENE)?.entities.get(E1);
            const compState = entityState?.components.get(type as any) as any;
            expect(getFieldValue(compState, targetKey)).toBe(newValue);

            // Verify via Snapshot API
            const snap = compApi.snapshot();
            expect(snap.ok).toBe(true);
            if (snap.ok) {
                expect(getFieldValue(snap.value, targetKey)).toBe(newValue);
            }
        });
    });

    it('should support dot-notation path resolution (e.g. halfExtents.x)', () => {
        const entityApi = ctx.api.scene(MAIN_SCENE).entity(E1);
        entityApi.addComponent({ component: createComponent('rigidBody') as any });
        entityApi.addComponent({ component: createComponent('boxCollider') as any });

        const rbApi = entityApi.component('boxCollider');

        const result = rbApi.setField({
            fieldKey: 'halfExtents.x' as any,
            value: 0.99
        });

        if (!result.ok) console.error("FAILED dot-notation", result.error);
        expect(result.ok).toBe(true);

        const state = ctx.engine.scenes.get(MAIN_SCENE)?.entities.get(E1)?.components.get('boxCollider' as any) as any;
        expect(state.halfExtents.x).toBe(0.99);
    });

    it('should return validation error for out-of-bounds values', () => {
        const entityApi = ctx.api.scene(MAIN_SCENE).entity(E1);
        entityApi.addComponent({ component: createComponent('rigidBody') as any });

        const rbApi = entityApi.component('rigidBody');

        const result = rbApi.setField({
            fieldKey: 'mass' as any,
            value: -10
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('validation');
        }
    });
});
