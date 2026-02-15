import {
  deserializeEcsTreeSnapshotToEntities,
  serializeEcsTreeFromRoots,
} from '@/lib/ecsSnapshotRuntime';

import {
  Entity,
  BoxGeometryComponent,
  StandardMaterialComponent,
  type Component,
} from '@duckengine/ecs';

function getComponent<T extends Component>(entity: Entity, type: string): T | null {
  // getAllComponents() exists; no typed getter.
  const comp = entity.getAllComponents().find((c) => c.type === type);
  return (comp as T) ?? null;
}

describe('ecsSnapshotRuntime', () => {
  test('roundtrips entity tree with transforms and components', () => {
    const root = new Entity('root');
    root.displayName = 'Root Entity';
    root.gizmoIcon = '🦆';
    root.transform.setPosition(1, 2, 3);
    root.transform.setRotation(10, 20, 30);
    root.transform.setScale(2, 2, 2);

    root.safeAddComponent(new BoxGeometryComponent({ width: 2, height: 3, depth: 4 }));
    root.safeAddComponent(new StandardMaterialComponent({ color: '#123456', metalness: 0.7 }));

    const child = new Entity('child');
    child.displayName = 'Child';
    child.transform.setPosition(9, 8, 7);
    root.addChild(child);

    const snapshot = serializeEcsTreeFromRoots([root], { detachRoots: true });
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.rootIds).toEqual(['root']);

    const res = deserializeEcsTreeSnapshotToEntities(snapshot);
    expect(res.errors).toEqual([]);

    const root2 = res.entitiesById.get('root');
    const child2 = res.entitiesById.get('child');

    expect(root2).toBeTruthy();
    expect(child2).toBeTruthy();

    expect(root2!.displayName).toBe('Root Entity');
    expect(root2!.gizmoIcon).toBe('🦆');
    expect(child2!.displayName).toBe('Child');

    expect(root2!.parent).toBeUndefined();
    expect(child2!.parent?.id).toBe('root');

    expect(root2!.transform.localPosition).toEqual({ x: 1, y: 2, z: 3 });
    expect(root2!.transform.localRotation).toEqual({ x: 10, y: 20, z: 30 });
    expect(root2!.transform.localScale).toEqual({ x: 2, y: 2, z: 2 });

    expect(child2!.transform.localPosition).toEqual({ x: 9, y: 8, z: 7 });

    const geo = getComponent<BoxGeometryComponent>(root2!, 'boxGeometry');
    expect(geo).toBeTruthy();
    expect(geo!.width).toBe(2);
    expect(geo!.height).toBe(3);
    expect(geo!.depth).toBe(4);

    const mat = getComponent<StandardMaterialComponent>(root2!, 'standardMaterial');
    expect(mat).toBeTruthy();
    expect(mat!.color).toBe('#123456');
    expect(mat!.metalness).toBe(0.7);
  });

  test('reports unknown component types and continues', () => {
    const snapshot = {
      schemaVersion: 1,
      rootIds: ['root'],
      entities: [
        {
          id: 'root',
          parentId: null,
          transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          components: [{ type: 'doesNotExist', data: { foo: 'bar' } }],
        },
      ],
    };

    const res = deserializeEcsTreeSnapshotToEntities(snapshot, { strict: true });
    expect(res.entitiesById.get('root')).toBeTruthy();
    expect(res.errors.some((e) => e.componentType === 'doesNotExist')).toBe(true);
  });

  test('migrates legacy name component into displayName and does not attach it', () => {
    const snapshot = {
      schemaVersion: 1,
      rootIds: ['root'],
      entities: [
        {
          id: 'root',
          parentId: null,
          transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          components: [{ type: 'name', data: { value: 'Legacy Name' } }],
        },
      ],
    };

    const res = deserializeEcsTreeSnapshotToEntities(snapshot, { strict: true });
    expect(res.errors).toEqual([]);

    const root = res.entitiesById.get('root')!;
    expect(root.displayName).toBe('Legacy Name');
    expect(root.getAllComponents().some((c) => c.type === 'name')).toBe(false);
  });
});
