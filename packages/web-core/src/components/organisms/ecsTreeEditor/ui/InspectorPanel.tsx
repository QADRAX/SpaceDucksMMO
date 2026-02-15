'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { Select } from '@/components/atoms/Select';
import { EmojiPickerDialog } from '@/components/molecules/EmojiPickerDialog';
import { PanelTabs } from '@/components/molecules/PanelTabs';
import { TransformEditor } from '@/components/molecules/TransformEditor';
import { ComponentSelector } from '@/components/molecules/ComponentSelector';

import { EcsInspectorFieldsForm } from '@/components/molecules/EcsInspectorFieldsForm';

import {
  BoxIcon,
  CameraIcon,
  CircleIcon,
  CodeIcon,
  CrosshairIcon,
  CylinderIcon,
  File3dIcon,
  FilterIcon,
  FlashlightIcon,
  Gamepad2Icon,
  Grid3x3Icon,
  LightbulbIcon,
  MousePointerIcon,
  PaintBucketIcon,
  PaletteIcon,
  RotateCcwIcon,
  SparklesIcon,
  SquareIcon,
  SunIcon,
  TagIcon,
  TargetIcon,
  TriangleIcon,
  ZapIcon,
  ArrowDownIcon,
} from '@/components/icons';

import { useEcsTreeEditorContext } from '../EcsTreeEditorContext';
import { SCENE_NODE_ID } from '../types';
import { SceneInspectorPanel } from './SceneInspectorPanel';
import {
  getRememberedScrollTop,
  getRememberedTab,
  setRememberedScrollTop,
  setRememberedTab,
  type InspectorTab,
} from './inspectorUiMemory';

const iconMap = {
  Tag: TagIcon,
  Camera: CameraIcon,
  Gamepad2: Gamepad2Icon,
  MousePointer: MousePointerIcon,
  RotateCcw: RotateCcwIcon,
  Zap: ZapIcon,
  ArrowDown: ArrowDownIcon,
  Sun: SunIcon,
  Lightbulb: LightbulbIcon,
  Flashlight: FlashlightIcon,
  Box: BoxIcon,
  Circle: CircleIcon,
  Square: SquareIcon,
  Cylinder: CylinderIcon,
  Triangle: TriangleIcon,
  File3d: File3dIcon,
  Palette: PaletteIcon,
  PaintBucket: PaintBucketIcon,
  Sparkles: SparklesIcon,
  Grid3x3: Grid3x3Icon,
  Code: CodeIcon,
  Filter: FilterIcon,
  Crosshair: CrosshairIcon,
  Target: TargetIcon,
} as const;

function getComponentIcon(iconName: string) {
  const Icon = iconMap[iconName as keyof typeof iconMap];
  return Icon || null;
}

export function InspectorPanel() {
  const editor = useEcsTreeEditorContext();
  const selected = editor.selectedEntity;

  const selectionKey = editor.selectedId ?? '__none__';

  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const [tab, setTabState] = React.useState<InspectorTab>(() => getRememberedTab(selectionKey, 'entity'));

  React.useEffect(() => {
    // Restore remembered tab per entity when selection changes.
    setTabState(getRememberedTab(selectionKey, 'entity'));
  }, [selectionKey]);

  const setTab = (next: InspectorTab) => {
    setTabState(next);
    setRememberedTab(selectionKey, next);
  };

  // Restore scroll position per entity + tab.
  React.useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (editor.selectedId === SCENE_NODE_ID) return;
    const remembered = getRememberedScrollTop(selectionKey, tab);
    if (Math.abs(el.scrollTop - remembered) > 1) el.scrollTop = remembered;
    // We include component count and scene revision to handle content changes.
  }, [selectionKey, tab, editor.sceneRevision, selected?.getAllComponents().length]);

  if (editor.selectedId === SCENE_NODE_ID) {
    return <SceneInspectorPanel />;
  }

  const selectedNameValue = selected?.displayName ?? '';
  const selectedGizmoIconValue = selected?.gizmoIcon ?? '';
  const selectedComponents = selected ? selected.getAllComponents().filter((c) => c.type !== 'name') : [];
  const creatableComponents = selected ? editor.factory.listCreatableComponents(selected as any) : [];

  const selectedSubtitle = (() => {
    if (!selected) return 'No selection';
    const dn = selected.displayName;
    if (typeof dn === 'string' && dn.trim()) return dn.trim();
    return selected.id;
  })();

  return (
    <div className="col-span-3 flex min-h-0 flex-col overflow-hidden rounded-base border-2 border-border bg-white">
      <div className="border-b border-border p-2">
        <div className="text-sm font-bold">Inspector</div>
        <div className="text-xs text-muted-foreground">{selectedSubtitle}</div>
      </div>

      {selected ? (
        <PanelTabs
          value={tab}
          onChange={setTab}
          ariaLabel="Inspector tabs"
          tabs={[
            { value: 'entity', label: 'Entity' },
            { value: 'components', label: 'Components' },
          ]}
        />
      ) : null}

      <div
        ref={scrollRef}
        className="scrollbar min-h-0 flex-1 overflow-y-auto"
        onScroll={(e) => {
          if (editor.selectedId === SCENE_NODE_ID) return;
          setRememberedScrollTop(selectionKey, tab, (e.currentTarget as HTMLDivElement).scrollTop);
        }}
      >
        {selected ? (
          <div className="flex flex-col gap-3">
            {tab === 'entity' ? (
            <div className="space-y-2 p-2">
              <Label>Name</Label>
              <Input
                value={selectedNameValue}
                onChange={(e) => editor.onSetSelectedName(e.target.value)}
                disabled={editor.mode !== 'edit'}
              />
            </div>

            ) : null}

            {tab === 'entity' ? (

            <div className="space-y-2 p-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Gizmo Icon</Label>
                <EmojiPickerDialog
                  title="Choose gizmo icon"
                  value={selectedGizmoIconValue}
                  onChange={(next) => editor.onSetSelectedGizmoIcon(next)}
                  disabled={editor.mode !== 'edit'}
                  triggerAriaLabel="Choose gizmo icon"
                />
              </div>
            </div>

            ) : null}

            {tab === 'entity' ? (

            <div className="p-2">
            <TransformEditor
              entity={selected}
              disabled={editor.mode !== 'edit'}
              onCommit={(reason) => editor.commitFromCurrentEditScene(reason)}
            />
            </div>

            ) : null}

            {tab === 'components' ? (

            <div className="space-y-2 p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold">Components</div>
                <ComponentSelector
                  components={creatableComponents}
                  onSelect={(type) => editor.onAddComponent(type)}
                  disabled={editor.mode !== 'edit'}
                />
              </div>

              <div className="border-t border-border">
                {selectedComponents.length === 0 ? (
                  <div className="text-sm text-neutral-600 p-3">No components.</div>
                ) : (
                  selectedComponents.map((c: any) => {
                    const fields = (c.metadata?.inspector?.fields ?? []) as any[];
                    const value: Record<string, unknown> = {};
                    for (const f of fields) value[f.key] = c[f.key];

                    return (
                      <div key={c.type} className="border-b border-border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            {getComponentIcon(c.type)}
                            {c.metadata.label || c.type}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => editor.onRemoveComponent(c.type)}
                            disabled={editor.mode !== 'edit'}
                          >
                            Remove
                          </Button>
                        </div>

                        {fields.length ? (
                          <div className="mt-3">
                            <EcsInspectorFieldsForm
                              fields={fields as any}
                              value={value}
                              onChange={(next) => editor.onUpdateSelectedComponentData(c.type, next)}
                              hideTypes={['reference', 'enum'] as any}
                            />
                          </div>
                        ) : (
                          <div className="mt-3 text-sm text-neutral-600">No editable fields.</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            ) : null}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Select an entity to edit.</div>
        )}
      </div>
    </div>
  );
}
