import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import { createComponent, getComponentMetadata } from '../../../domain/components/factory';
import { createEntity, addChild } from '../../../domain/entities/entity';
import type { CreatableComponentType } from '../../../domain/components/types/factory';

// Single source of truth for component specs to drive bulk testing
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

describe('Integration: Entity > addComponent (Bulk)', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = setupIntegrationTest();
        ctx.api.addScene({ sceneId: 'main' });
    });

    it.each(ALL_TYPES)('%s: should follow metadata rules', (type) => {
        const entId = `e_${type}`;
        ctx.api.scene('main').addEntity({ entity: createEntity(entId) });
        const entityApi = ctx.api.scene('main').entity(entId);
        const meta = getComponentMetadata(type);

        const satisfyDeps = (t: CreatableComponentType, targetId: string) => {
            const api = ctx.api.scene('main').entity(targetId);
            const m = getComponentMetadata(t);

            const hasGeometry = () => {
                const comps = ctx.engine.scenes.get('main')?.entities.get(targetId)?.components;
                if (!comps) return false;
                for (const c of comps.values()) {
                    if (c.metadata.type.toLowerCase().includes('geometry') || c.metadata.type === 'fullMesh') return true;
                }
                return false;
            };

            if (m.requires) {
                for (const req of m.requires) {
                    if (req === 'geometry' && hasGeometry()) continue;
                    const reqType = req === 'geometry' ? 'boxGeometry' : req as CreatableComponentType;
                    if (!ctx.engine.scenes.get('main')?.entities.get(targetId)?.components.has(reqType as any)) {
                        satisfyDeps(reqType, targetId);
                        api.addComponent({ component: createComponent(reqType) as any });
                    }
                }
            }
            if (m.requiresInHierarchy) {
                for (const req of m.requiresInHierarchy) {
                    const reqType = req as CreatableComponentType;
                    const parentId = `p_${targetId}`;
                    let parent = ctx.engine.scenes.get('main')?.entities.get(parentId);
                    if (!parent) {
                        ctx.api.scene('main').addEntity({ entity: createEntity(parentId) });
                        addChild(parent = ctx.engine.scenes.get('main')!.entities.get(parentId)!, ctx.engine.scenes.get('main')!.entities.get(targetId)!);
                    }
                    if (!parent.components.has(reqType as any)) {
                        satisfyDeps(reqType, parentId);
                        ctx.api.scene('main').entity(parentId).addComponent({ component: createComponent(reqType) as any });
                    }
                }
            }
        };

        // 1. FAIL PHASE: If has requirements, adding now should fail
        const hasReqs = (meta.requires && meta.requires.length > 0) || (meta.requiresInHierarchy && meta.requiresInHierarchy.length > 0);
        if (hasReqs) {
            const res = entityApi.addComponent({ component: createComponent(type) as any });
            if (res.ok) {
                console.error(`FAILURE: ${type} unexpectedly SUCCEEDED without deps!`);
            }
            expect(res.ok).toBe(false);
        }

        // 2. SUCCESS PHASE: Satisfy deps and add
        satisfyDeps(type, entId);
        const resAdd = entityApi.addComponent({ component: createComponent(type) as any });
        if (!resAdd.ok) {
            console.error(`FAILURE: ${type} failed to add even with dependencies satisfied!`, resAdd.error);
        }
        expect(resAdd.ok).toBe(true);

        // 3. UNIQUE PHASE: Adding again should fail
        if (meta.unique) {
            const resUnique = entityApi.addComponent({ component: createComponent(type) as any });
            expect(resUnique.ok).toBe(false);
        }
    });

    it('should respect uniqueInScene', () => {
        const types = ALL_TYPES.filter(t => getComponentMetadata(t).uniqueInScene);
        for (const type of types) {
            const u1 = `u1_${type}`;
            const u2 = `u2_${type}`;
            ctx.api.scene('main').addEntity({ entity: createEntity(u1) });
            ctx.api.scene('main').addEntity({ entity: createEntity(u2) });

            // First entity
            const res1 = ctx.api.scene('main').entity(u1).addComponent({ component: createComponent(type) as any });
            expect(res1.ok).toBe(true);

            // Second entity same scene
            const res2 = ctx.api.scene('main').entity(u2).addComponent({ component: createComponent(type) as any });
            expect(res2.ok).toBe(false);
        }
    });
});
