import { Entity, ScriptComponent, DefaultEcsComponentFactory } from '@duckengine/ecs';
import { serializeEcsTreeFromRoots } from './serializer';
import { deserializeEcsTreeSnapshotToEntities } from './deserializer';

describe('ScriptComponent Serialization', () => {
    it('serializes and deserializes ScriptComponent correctly', () => {
        // 1. Setup Entity with ScriptComponent
        const e1 = new Entity('e1');
        const sc = new ScriptComponent();

        sc.addSlot({
            slotId: 'slot-uuid-1',
            scriptId: 'builtin://player_move.lua',
            enabled: true,
            executionOrder: 0,
            properties: { speed: 10, target: 'e2' }
        });

        sc.addSlot({
            slotId: 'slot-uuid-2',
            scriptId: 'builtin://camera_orbit.lua',
            enabled: false,
            executionOrder: 1,
            properties: { distance: 5 }
        });

        e1.addComponent(sc as any);

        // 2. Serialize
        const snapshot = serializeEcsTreeFromRoots([e1]);

        // Verify the extracted component data contains the scripts array
        const serializedSc = snapshot.entities[0].components.find(c => c.type === 'script');
        expect(serializedSc).toBeDefined();
        // Since ScriptComponent has `scripts` array but it's not in the inspector metadata,
        // we should verify if the fallback extraction logic caught it.
        expect((serializedSc?.data as any).scripts).toBeDefined();
        expect((serializedSc?.data as any).scripts).toHaveLength(2);

        // 3. Deserialize
        const result = deserializeEcsTreeSnapshotToEntities(snapshot);
        expect(result.errors).toHaveLength(0);

        const loadedE1 = result.entitiesById.get('e1');
        expect(loadedE1).toBeDefined();

        const loadedSc = loadedE1?.getComponent<ScriptComponent>('script');
        expect(loadedSc).toBeDefined();

        const slots = loadedSc?.getSlots() || [];
        expect(slots).toHaveLength(2);

        expect(slots[0]).toEqual({
            slotId: 'slot-uuid-1',
            scriptId: 'builtin://player_move.lua',
            enabled: true,
            executionOrder: 0,
            properties: { speed: 10, target: 'e2' }
        });

        expect(slots[1]).toEqual({
            slotId: 'slot-uuid-2',
            scriptId: 'builtin://camera_orbit.lua',
            enabled: false,
            executionOrder: 1,
            properties: { distance: 5 }
        });
    });
});
