import { Component } from '../core/Component';
import type { ComponentMetadata } from '../core/ComponentMetadata';

export class NameComponent extends Component {
  readonly type = 'name';
  readonly metadata: ComponentMetadata = {
    type: 'name',
    unique: true,
    requires: [],
    conflicts: [],
    inspector: {
      fields: [
        {
          key: 'value',
          label: 'Name',
          type: 'string',
          get: (c: NameComponent) => c.value,
          set: (c, v) => {
            c.value = String(v ?? '');
            c.notifyChanged();
          },
        },
      ],
    },
  };

  value: string;

  constructor(params?: { value?: string } | string) {
    super();
    if (typeof params === 'string') {
      this.value = params;
      return;
    }
    this.value = String(params?.value ?? '');
  }
}

export default NameComponent;
