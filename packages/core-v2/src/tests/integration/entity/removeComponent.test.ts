import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createComponent, getComponentMetadata } from '../../../domain/components/factory';
import { createEntity } from '../../../domain/entities/entity';
import type { CreatableComponentType } from '../../../domain/components/types/factory';

// Specs to drive iteration
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

const ALL_SPECS = {
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

describe('Integration: Entity > removeComponent (Bulk)', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
    });

    it.each(ALL_TYPES)('%s: should allow removal when no dependencies exist', (type) => {
        const entityId = `re_${type}`;
        ctx.api.scene('main').addEntity({ entity: createEntity(entityId) });
        const entityApi = ctx.api.scene('main').entity(entityId);

        const satisfyDeps = (t: CreatableComponentType, id: string) => {
            const entApi = ctx.api.scene('main').entity(id);
            const m = getComponentMetadata(t);
            if (m.requires) {
                for (const req of m.requires) {
                    const reqType = req === 'geometry' ? 'boxGeometry' : req as CreatableComponentType;
                    if (!ctx.engine.scenes.get('main')?.entities.get(id)?.components.has(reqType)) {
                        satisfyDeps(reqType, id);
                        entApi.addComponent({ component: createComponent(reqType) as any });
                    }
                }
            }
            if (m.requiresInHierarchy) {
                for (const req of m.requiresInHierarchy) {
                    const reqType = req as CreatableComponentType;
                    if (!ctx.engine.scenes.get('main')?.entities.get(id)?.components.has(reqType)) {
                        satisfyDeps(reqType, id);
                        entApi.addComponent({ component: createComponent(reqType) as any });
                    }
                }
            }
        };

        satisfyDeps(type, entityId);
        entityApi.addComponent({ component: createComponent(type) as any });
        expect(ctx.engine.scenes.get('main')?.entities.get(entityId)?.components.has(type)).toBe(true);

        const result = entityApi.removeComponent({ componentType: type });
        if (!result.ok) console.error(`REMOVE FAILED: ${type}`, result.error);
        expect(result.ok).toBe(true);
    });

    it('should block removal if other components depend on it', () => {
        ctx.api.scene('main').addEntity({ entity: createEntity('dep_e1') });
        const entityApi = ctx.api.scene('main').entity('dep_e1');

        let provider: CreatableComponentType | undefined;
        let dependent: CreatableComponentType | undefined;

        for (const type of ALL_TYPES) {
            const meta = getComponentMetadata(type);
            if (meta.requires && meta.requires.length > 0) {
                const req = meta.requires[0];
                if (req !== 'geometry' && ALL_TYPES.includes(req as CreatableComponentType)) {
                    provider = req as CreatableComponentType;
                    dependent = type;
                    break;
                }
            }
        }

        if (!provider || !dependent) return;

        // Satisfy provider's deps first
        const satisfy = (t: CreatableComponentType, id: string) => {
            const m = getComponentMetadata(t);
            if (m.requires) {
                for (const r of m.requires) {
                    const rt = r === 'geometry' ? 'boxGeometry' : r as CreatableComponentType;
                    if (!ctx.engine.scenes.get('main')?.entities.get(id)?.components.has(rt)) {
                        satisfy(rt, id);
                        ctx.api.scene('main').entity(id).addComponent({ component: createComponent(rt) as any });
                    }
                }
            }
        };

        satisfy(provider, 'dep_e1');
        entityApi.addComponent({ component: createComponent(provider) as any });
        entityApi.addComponent({ component: createComponent(dependent) as any });

        const result = entityApi.removeComponent({ componentType: provider });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe('validation');
            expect(result.error.message.toLowerCase()).toContain('required by');
        }
    });
});
