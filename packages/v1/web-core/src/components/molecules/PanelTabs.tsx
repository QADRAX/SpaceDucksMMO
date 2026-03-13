'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export type PanelTabDef<T extends string> = {
  value: T;
  label: string;
};

export function PanelTabs<T extends string>(props: {
  value: T;
  tabs: Array<PanelTabDef<T>>;
  onChange: (v: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const { tabs, value } = props;

  return (
    <div
      className={cn('flex w-full border-b border-border', props.className)}
      role="tablist"
      aria-label={props.ariaLabel ?? 'Tabs'}
    >
      {tabs.map((t, i) => {
        const selected = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              'flex-1 px-3 py-2 text-sm',
              i !== tabs.length - 1 && 'border-r border-border',
              selected ? 'bg-neutral-100 font-bold' : 'bg-white hover:bg-neutral-50'
            )}
            onClick={() => props.onChange(t.value)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
