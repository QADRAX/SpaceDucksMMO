'use client';

import * as React from 'react';

import type { SceneEditorStore } from './types';

const Ctx = React.createContext<SceneEditorStore | null>(null);

export function SceneEditorProvider({ value, children }: { value: SceneEditorStore; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSceneEditorContext(): SceneEditorStore {
  const v = React.useContext(Ctx);
  if (!v) throw new Error('useSceneEditorContext must be used within <SceneEditorProvider />');
  return v;
}
