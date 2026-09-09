import type { ComponentSpec } from '../../types/core';
import type { Transform2dComponent, Transform2dCreateOverride, Vec2Like } from '../../types/ui';

export type { Transform2dCreateOverride };

function vec2(x: number, y: number): { x: number; y: number } {
  return { x, y };
}

/** Builds default local 2D pose fields for a transform2d component. */
export function createTransform2dPose(
  position?: Vec2Like,
  size?: Vec2Like,
): Pick<
  Transform2dComponent,
  | 'localPosition'
  | 'localSize'
  | 'localRotation'
  | 'localScale'
  | 'anchor'
  | 'pivot'
  | 'zIndex'
  | 'dirty'
  | 'parent'
> {
  return {
    localPosition: position ? vec2(position.x, position.y) : vec2(0, 0),
    localSize: size ? vec2(size.x, size.y) : vec2(1, 1),
    localRotation: 0,
    localScale: vec2(1, 1),
    anchor: vec2(0, 0),
    pivot: vec2(0, 0),
    zIndex: 0,
    dirty: true,
    parent: null,
  };
}

/** Spec metadata/defaults shell; instances via {@link createTransform2dComponent}. */
export const TRANSFORM2D_SPEC: ComponentSpec<Transform2dComponent> = {
  metadata: {
    type: 'transform2d',
    label: 'Transform 2D',
    description: 'Optional screen-space root box for UI entities (viewport overlay).',
    category: 'UI',
    icon: 'Square',
    unique: true,
    inspector: {
      fields: [
        {
          key: 'position',
          label: 'Position',
          type: 'vector',
          get: (c) => c.localPosition,
          set: (c, v) => {
            const p = v as Vec2Like;
            c.localPosition.x = p.x;
            c.localPosition.y = p.y;
            c.dirty = true;
          },
        },
        {
          key: 'size',
          label: 'Size',
          type: 'vector',
          get: (c) => c.localSize,
          set: (c, v) => {
            const s = v as Vec2Like;
            c.localSize.x = s.x;
            c.localSize.y = s.y;
            c.dirty = true;
          },
        },
        {
          key: 'rotation',
          label: 'Rotation',
          type: 'number',
          unit: 'rad',
          get: (c) => c.localRotation,
          set: (c, v) => {
            c.localRotation = v as number;
            c.dirty = true;
          },
        },
        {
          key: 'scale',
          label: 'Scale',
          type: 'vector',
          get: (c) => c.localScale,
          set: (c, v) => {
            const s = v as Vec2Like;
            c.localScale.x = s.x;
            c.localScale.y = s.y;
            c.dirty = true;
          },
        },
        {
          key: 'anchor',
          label: 'Anchor',
          type: 'vector',
          get: (c) => c.anchor,
          set: (c, v) => {
            const a = v as Vec2Like;
            c.anchor.x = a.x;
            c.anchor.y = a.y;
            c.dirty = true;
          },
        },
        {
          key: 'pivot',
          label: 'Pivot',
          type: 'vector',
          get: (c) => c.pivot,
          set: (c, v) => {
            const p = v as Vec2Like;
            c.pivot.x = p.x;
            c.pivot.y = p.y;
            c.dirty = true;
          },
        },
        {
          key: 'zIndex',
          label: 'Z Index',
          type: 'number',
          step: 1,
          get: (c) => c.zIndex,
          set: (c, v) => {
            c.zIndex = v as number;
            c.dirty = true;
          },
        },
      ],
    },
  },
  defaults: createTransform2dPose() as unknown as Omit<
    Transform2dComponent,
    'type' | 'metadata' | 'enabled'
  >,
};

/**
 * Creates a transform2d component; the component IS the screen box (no nested state).
 */
export function createTransform2dComponent(
  overrides?: Transform2dCreateOverride,
): Transform2dComponent {
  const pose = createTransform2dPose(overrides?.position, overrides?.size);
  if (overrides?.rotation !== undefined) pose.localRotation = overrides.rotation;
  if (overrides?.scale) {
    pose.localScale.x = overrides.scale.x;
    pose.localScale.y = overrides.scale.y;
  }
  if (overrides?.anchor) {
    pose.anchor.x = overrides.anchor.x;
    pose.anchor.y = overrides.anchor.y;
  }
  if (overrides?.pivot) {
    pose.pivot.x = overrides.pivot.x;
    pose.pivot.y = overrides.pivot.y;
  }
  if (overrides?.zIndex !== undefined) pose.zIndex = overrides.zIndex;
  return {
    type: 'transform2d',
    enabled: overrides?.enabled ?? true,
    metadata: TRANSFORM2D_SPEC.metadata,
    ...pose,
  };
}
