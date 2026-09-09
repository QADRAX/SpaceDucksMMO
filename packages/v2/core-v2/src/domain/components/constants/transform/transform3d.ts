import type { ComponentSpec } from '../../types/core';
import type { Transform3dComponent, Transform3dCreateOverride } from '../../types/transform';
import type { EulerLike, Vec3Like } from '../../../math';
import { createTransform, setPosition, setRotation, setScale } from '../../../entities/transform';

export type { Transform3dCreateOverride };

/** Spec metadata/defaults shell; instances are built via {@link createTransform3dComponent}. */
export const TRANSFORM3D_SPEC: ComponentSpec<Transform3dComponent> = {
  metadata: {
    type: 'transform3d',
    label: 'Transform 3D',
    description: 'Optional local/world pose for spatial entities.',
    category: 'Core',
    icon: 'Move',
    unique: true,
    inspector: {
      fields: [
        {
          key: 'position',
          label: 'Position',
          type: 'vector',
          get: (c) => c.localPosition,
          set: (c, v) => {
            const p = v as Vec3Like;
            setPosition(c, p.x, p.y, p.z);
          },
        },
        {
          key: 'rotation',
          label: 'Rotation',
          type: 'vector',
          unit: 'rad',
          get: (c) => c.localRotation,
          set: (c, v) => {
            const r = v as EulerLike;
            setRotation(c, r.x, r.y, r.z);
          },
        },
        {
          key: 'scale',
          label: 'Scale',
          type: 'vector',
          get: (c) => c.localScale,
          set: (c, v) => {
            const s = v as Vec3Like;
            setScale(c, s.x, s.y, s.z);
          },
        },
      ],
    },
  },
  defaults: createTransform() as unknown as Omit<
    Transform3dComponent,
    'type' | 'metadata' | 'enabled'
  >,
};

/**
 * Creates a transform3d component; the component IS the pose (no nested state).
 */
export function createTransform3dComponent(
  overrides?: Transform3dCreateOverride,
): Transform3dComponent {
  const pose = createTransform(
    overrides?.position
      ? [overrides.position.x, overrides.position.y, overrides.position.z]
      : undefined,
  );
  if (overrides?.rotation) {
    setRotation(pose, overrides.rotation.x, overrides.rotation.y, overrides.rotation.z);
  }
  if (overrides?.scale) {
    setScale(pose, overrides.scale.x, overrides.scale.y, overrides.scale.z);
  }
  return {
    type: 'transform3d',
    enabled: overrides?.enabled ?? true,
    metadata: TRANSFORM3D_SPEC.metadata,
    ...pose,
  };
}

/** Specs map entry for the central registry. */
export const TRANSFORM_SPECS = {
  transform3d: TRANSFORM3D_SPEC,
};
