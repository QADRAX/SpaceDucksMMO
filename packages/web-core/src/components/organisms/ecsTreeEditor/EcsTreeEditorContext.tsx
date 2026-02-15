'use client';

import * as React from 'react';

import type { EcsTreeEditorStore } from './types';

const Ctx = React.createContext<EcsTreeEditorStore | null>(null);

export function EcsTreeEditorProvider({ value, children }: { value: EcsTreeEditorStore; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEcsTreeEditorContext(): EcsTreeEditorStore {
  const v = React.useContext(Ctx);
  if (!v) throw new Error('useEcsTreeEditorContext must be used within <EcsTreeEditorProvider />');
  return v;
}
