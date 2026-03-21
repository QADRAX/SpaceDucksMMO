import { describe, it, expect } from '@jest/globals';
import { createEntityId } from '../ids';
import { createEntity, addChild, addComponent } from '../entities/entity';
import { createComponent } from '../components/factory';
import {
  collectJointEntitiesInRigSubtree,
  collectSortedJointEntitiesForRig,
  validateJointPaletteDense,
  validateMeshSkinDataAgainstJointCount,
  validateRigSkinMeshCoherence,
  computeSkinMatricesColumnMajor,
  isEntityUnderRigRoot,
} from './rigPose';
import { MAT4_FLOATS } from '../math/mat4';

describe('rigPose', () => {
  it('collectSortedJointEntitiesForRig orders by jointIndex, not DFS order', () => {
    const rootId = createEntityId('rig');
    const aId = createEntityId('a');
    const bId = createEntityId('b');
    const rig = createEntity(rootId);
    const a = createEntity(aId);
    const b = createEntity(bId);
    addChild(rig, a);
    addChild(rig, b);
    addComponent(a, createComponent('joint', { jointIndex: 1 }));
    addComponent(b, createComponent('joint', { jointIndex: 0 }));

    const sorted = collectSortedJointEntitiesForRig(rig);
    expect(sorted.map((e) => e.id)).toEqual([bId, aId]);
  });

  it('collectJointEntitiesInRigSubtree skips non-joint entities', () => {
    const rig = createEntity(createEntityId('rig'));
    const mesh = createEntity(createEntityId('mesh'));
    const bone = createEntity(createEntityId('bone'));
    addChild(rig, mesh);
    addChild(mesh, bone);
    addComponent(bone, createComponent('joint', { jointIndex: 0 }));

    expect(collectJointEntitiesInRigSubtree(rig).length).toBe(1);
  });

  it('isEntityUnderRigRoot follows parent chain', () => {
    const rig = createEntity(createEntityId('rig'));
    const mid = createEntity(createEntityId('mid'));
    const leaf = createEntity(createEntityId('leaf'));
    addChild(rig, mid);
    addChild(mid, leaf);
    expect(isEntityUnderRigRoot(leaf, rig)).toBe(true);
    expect(isEntityUnderRigRoot(rig, rig)).toBe(true);
  });

  it('validateJointPaletteDense accepts dense 0..N-1', () => {
    const a = createEntity(createEntityId('a'));
    const b = createEntity(createEntityId('b'));
    addComponent(a, createComponent('joint', { jointIndex: 0 }));
    addComponent(b, createComponent('joint', { jointIndex: 1 }));
    expect(validateJointPaletteDense([a, b])).toEqual([]);
  });

  it('validateJointPaletteDense rejects duplicates and gaps', () => {
    const a = createEntity(createEntityId('a'));
    const b = createEntity(createEntityId('b'));
    addComponent(a, createComponent('joint', { jointIndex: 0 }));
    addComponent(b, createComponent('joint', { jointIndex: 0 }));
    expect(validateJointPaletteDense([a, b]).length).toBeGreaterThan(0);

    const c = createEntity(createEntityId('c'));
    const d = createEntity(createEntityId('d'));
    addComponent(c, createComponent('joint', { jointIndex: 0 }));
    addComponent(d, createComponent('joint', { jointIndex: 2 }));
    expect(validateJointPaletteDense([c, d]).some((m) => m.includes('dense'))).toBe(true);
  });

  it('validateMeshSkinDataAgainstJointCount checks IBM length and joint index range', () => {
    const meshOk = {
      positions: [],
      indices: [],
      skin: { inverseBindMatrices: new Array(MAT4_FLOATS * 2).fill(0) },
      jointIndices: [0, 0, 0, 0, 1, 0, 0, 0],
    };
    expect(validateMeshSkinDataAgainstJointCount(meshOk, 2)).toEqual([]);

    const meshBadIbm = {
      positions: [],
      indices: [],
      skin: { inverseBindMatrices: new Array(MAT4_FLOATS).fill(0) },
    };
    expect(
      validateMeshSkinDataAgainstJointCount(meshBadIbm, 2).some((e) => e.includes('inverseBindMatrices')),
    ).toBe(true);
  });

  it('computeSkinMatricesColumnMajor yields identity for identity pose and IBM', () => {
    const rig = createEntity(createEntityId('rig'));
    const bone = createEntity(createEntityId('bone'));
    addChild(rig, bone);
    addComponent(bone, createComponent('joint', { jointIndex: 0 }));

    const ordered = collectSortedJointEntitiesForRig(rig);
    const ibm = [...Array(MAT4_FLOATS)].map((_, i) =>
      i === 0 || i === 5 || i === 10 || i === 15 ? 1 : 0,
    );
    const skins = computeSkinMatricesColumnMajor(ordered, ibm);
    for (let i = 0; i < MAT4_FLOATS; i++) {
      expect(skins[i]).toBeCloseTo(ibm[i], 5);
    }
  });

  it('validateRigSkinMeshCoherence passes for a minimal consistent setup', () => {
    const rig = createEntity(createEntityId('rig'));
    const bone = createEntity(createEntityId('bone'));
    addChild(rig, bone);
    addComponent(bone, createComponent('joint', { jointIndex: 0 }));

    const ordered = collectSortedJointEntitiesForRig(rig);
    const mesh = {
      positions: [],
      indices: [],
      skin: {
        inverseBindMatrices: new Array(MAT4_FLOATS)
          .fill(0)
          .map((_, i) => (i === 0 || i === 5 || i === 10 || i === 15 ? 1 : 0)),
      },
    };
    expect(validateRigSkinMeshCoherence(rig, mesh, ordered)).toEqual([]);
  });
});
