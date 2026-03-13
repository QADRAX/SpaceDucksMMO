import type { ComponentSpec } from '../../types/core';
import type { NameComponent } from '../../types/gameplay/identity';

/** Name component spec. */
export const NAME_SPEC: ComponentSpec<NameComponent> = {
  metadata: {
    type: 'name',
    label: 'Name',
    description: 'Human-readable entity name used by the scene editor.',
    category: 'Identity',
    icon: 'Tag',
    unique: true,
    inspector: { fields: [{ key: 'value', label: 'Value', type: 'string' }] },
  },
  defaults: { value: '' },
};

/** All gameplay identity specs keyed by type. */
export const IDENTITY_SPECS = {
  name: NAME_SPEC,
};
