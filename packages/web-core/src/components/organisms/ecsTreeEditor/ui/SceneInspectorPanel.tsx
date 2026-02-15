'use client';

import * as React from 'react';

import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { Select } from '@/components/atoms/Select';

import { useEcsTreeEditorContext } from '../EcsTreeEditorContext';

export function SceneInspectorPanel() {
  const editor = useEcsTreeEditorContext();

  const cameraEntities = React.useMemo(() => {
    return editor.allEntitiesForHierarchy
      .filter((e) => Boolean(e.getComponent('cameraView')))
      .map((e) => {
        const label = (e.displayName && e.displayName.trim()) ? e.displayName.trim() : e.id;
        return { id: e.id, label };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [editor.allEntitiesForHierarchy]);

  const selectedCameraValue = editor.activeCameraEntityId ?? '';

  return (
    <div className="col-span-3 flex min-h-105 flex-col overflow-hidden rounded-base border-2 border-border bg-white">
      <div className="border-b border-border p-2">
        <div className="text-sm font-bold">Inspector</div>
        <div className="text-xs text-muted-foreground">Scene</div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <div className="flex flex-col gap-3">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={editor.resourceDisplayName}
              onChange={(e) => editor.onSetResourceDisplayName(e.target.value)}
              onBlur={(e) => editor.onSaveResourceDisplayName(e.currentTarget.value)}
              disabled={editor.mode !== 'edit'}
            />
          </div>

          <div className="space-y-2">
            <Label>Active camera</Label>
            <Select
              value={selectedCameraValue}
              onChange={(e) => editor.onSetActiveCameraEntityId(e.target.value ? e.target.value : null)}
              disabled={editor.mode !== 'edit' || cameraEntities.length === 0}
            >
              {cameraEntities.length === 0 ? (
                <option value="">No cameras in scene</option>
              ) : (
                <>
                  <option value="">Select camera…</option>
                  {cameraEntities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </>
              )}
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
