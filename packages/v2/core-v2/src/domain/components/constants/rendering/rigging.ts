import type { ComponentSpec } from '../../types/core';
import type { SkinComponent } from '../../types/rendering/skin';
import type { JointComponent } from '../../types/rendering/joint';
import type { AnimatorComponent } from '../../types/rendering/animator';
import { createEntityId } from '../../../ids';

export const SKIN_SPEC: ComponentSpec<SkinComponent> = {
  metadata: {
    type: 'skin',
    label: 'Skin',
    description:
      'Skinned mesh binding: joint order comes from joint entities under rigRootEntityId; weights live on the mesh asset.',
    category: 'Rendering',
    icon: 'Bone',
    unique: true,
    requires: ['customGeometry'],
    inspector: {
      fields: [
        {
          key: 'rigRootEntityId',
          label: 'Rig root entity',
          type: 'entityRef',
          description: 'Skeleton root entity (subtree contains joint components).',
        },
      ],
    },
  },
  defaults: { rigRootEntityId: createEntityId('') },
};

export const JOINT_SPEC: ComponentSpec<JointComponent> = {
  metadata: {
    type: 'joint',
    label: 'Joint',
    description: 'Skeletal joint index for skinning (must match mesh jointIndices order).',
    category: 'Rendering',
    icon: 'Bone',
    unique: true,
    inspector: {
      fields: [{ key: 'jointIndex', label: 'Joint index', type: 'number', min: 0, step: 1 }],
    },
  },
  defaults: { jointIndex: 0 },
};

export const ANIMATOR_SPEC: ComponentSpec<AnimatorComponent> = {
  metadata: {
    type: 'animator',
    label: 'Animator',
    description: 'Animation clip playback state; channel targets are resolved by entity id in clip data.',
    category: 'Rendering',
    icon: 'Film',
    unique: true,
    inspector: {
      fields: [
        { key: 'clips', label: 'Clips', type: 'object', description: 'Ordered animation clip refs.' },
        { key: 'activeClipIndex', label: 'Active clip', type: 'number', min: 0, step: 1 },
        { key: 'playing', label: 'Playing', type: 'boolean' },
        { key: 'loop', label: 'Loop', type: 'boolean' },
        { key: 'speed', label: 'Speed', type: 'number', step: 0.01 },
        { key: 'time', label: 'Time (s)', type: 'number', min: 0, step: 0.01 },
      ],
    },
  },
  defaults: {
    clips: [],
    activeClipIndex: 0,
    playing: false,
    loop: true,
    speed: 1,
    time: 0,
  },
};

export const RIGGING_SPECS = {
  skin: SKIN_SPEC,
  joint: JOINT_SPEC,
  animator: ANIMATOR_SPEC,
};
