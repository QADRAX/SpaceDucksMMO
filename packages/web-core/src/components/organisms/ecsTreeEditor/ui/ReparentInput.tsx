'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

export function ReparentInput(props: { disabled: boolean; onReparent: (idOrNull: string | null) => void }) {
  const [value, setValue] = React.useState('');

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Parent entity id (blank = root)"
        disabled={props.disabled}
      />
      <Button
        onClick={() => props.onReparent(value.trim() ? value.trim() : null)}
        disabled={props.disabled}
        variant="secondary"
        size="sm"
      >
        Apply
      </Button>
    </div>
  );
}
