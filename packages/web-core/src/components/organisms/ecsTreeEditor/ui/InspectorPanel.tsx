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

import { ResourceKeyDropdown } from '@/components/molecules/ResourceKeyDropdown';

import { EcsInspectorFieldsForm } from '@/components/molecules/EcsInspectorFieldsForm';
import type { EntityReferenceOption } from '@/components/molecules/EntityReferenceDropdown';

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
  DebugTransformIcon,
  DebugMeshIcon,
  DebugColliderIcon,
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

import {
  MATERIAL_RESOURCE_REF_KEY,
  isMaterialComponentType,
} from '@/lib/resourceBackedEditor';
import { resolveMaterialResourceActive } from '@/lib/engineResourceResolution';

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

function renderComponentIcon(iconName: unknown) {
  if (typeof iconName !== 'string' || !iconName) return null;
  const Icon = getComponentIcon(iconName);
  if (!Icon) return null;
  return <Icon className="h-4 w-4 shrink-0" />;
}

function buildInspectorValue(component: any, fields: any[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const key = String(f?.key ?? '');
    if (!key) continue;

    let v: unknown;
    if (typeof f?.get === 'function') v = f.get(component);
    else v = component?.[key];

    if (v === undefined && f?.default !== undefined) v = f.default;
    out[key] = v;
  }
  return out;
}

function diffInspectorValue(prev: Record<string, unknown>, next: Record<string, unknown>): Record<string, unknown> {
  const delta: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(next)) {
    if (!Object.is(prev[k], v)) delta[k] = v;
  }
  for (const k of Object.keys(prev)) {
    if (!(k in next)) delta[k] = undefined;
  }

  return delta;
}

export function InspectorPanel() {
  const editor = useEcsTreeEditorContext();
  const selected = editor.selectedEntity;
  // Force re-render on per-entity debug flag changes.
  void editor.presentationRevision;

  const referenceOptions = React.useMemo((): EntityReferenceOption[] => {
    const out: EntityReferenceOption[] = [];

    const visit = (ent: any, depth: number) => {
      const id = String(ent?.id ?? '');
      if (!id) return;
      const dn = typeof ent?.displayName === 'string' ? ent.displayName.trim() : '';
      const label = dn ? dn : id;
      out.push({
        id,
        label,
        depth,
        icon: typeof ent?.gizmoIcon === 'string' ? ent.gizmoIcon : undefined,
      });

      const kids = typeof ent?.getChildren === 'function' ? ent.getChildren() : [];
      if (Array.isArray(kids) && kids.length) {
        for (const c of kids) visit(c, depth + 1);
      }
    };

    for (const r of editor.hierarchyRoots) visit(r as any, 0);
    return out;
  }, [editor.hierarchyRoots, editor.sceneRevision]);

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
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-bold">Inspector</div>
            <div className="text-xs text-muted-foreground">{selectedSubtitle}</div>
          </div>

          {selected && editor.mode === 'edit' ? (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="iconSm"
                aria-label={selected.isDebugTransformEnabled() ? 'Disable transform debug' : 'Enable transform debug'}
                title="Debug transform"
                onClick={() => editor.onToggleEntityDebugTransform(selected.id)}
                className={selected.isDebugTransformEnabled() ? 'bg-gray-100' : undefined}
              >
                <DebugTransformIcon className="h-4 w-4" />
              </Button>

              {selected.getAllComponents().some((c: any) => String(c.type).endsWith('Geometry')) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="iconSm"
                  aria-label={selected.isDebugMeshEnabled() ? 'Disable mesh debug' : 'Enable mesh debug'}
                  title="Debug mesh"
                  onClick={() => editor.onToggleEntityDebugMesh(selected.id)}
                  className={selected.isDebugMeshEnabled() ? 'bg-gray-100' : undefined}
                >
                  <DebugMeshIcon className="h-4 w-4" />
                </Button>
              ) : null}

              {selected.getAllComponents().some((c: any) => String(c.type).toLowerCase().includes('collider')) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="iconSm"
                  aria-label={selected.isDebugColliderEnabled() ? 'Disable collider debug' : 'Enable collider debug'}
                  title="Debug collider"
                  onClick={() => editor.onToggleEntityDebugCollider(selected.id)}
                  className={selected.isDebugColliderEnabled() ? 'bg-gray-100' : undefined}
                >
                  <DebugColliderIcon className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
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
          <div className="flex flex-col">
            {tab === 'entity' ? (
              <div className="border-b border-border px-3 py-3">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={selectedNameValue}
                    onChange={(e) => editor.onSetSelectedName(e.target.value)}
                    disabled={editor.mode !== 'edit'}
                  />
                </div>
              </div>
            ) : null}

            {tab === 'entity' ? (
              <div className="border-b border-border px-3 py-3">
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
              <div className="px-3 py-3">
                <TransformEditor
                  entity={selected}
                  disabled={editor.mode !== 'edit'}
                  onCommit={(reason) => editor.commitFromCurrentEditScene(reason)}
                />
              </div>
            ) : null}

            {tab === 'components' ? (
              <>
                <div className="sticky top-0 z-10 border-b border-border bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold">Components</div>
                    <ComponentSelector
                      components={creatableComponents}
                      onSelect={(type) => editor.onAddComponent(type)}
                      disabled={editor.mode !== 'edit'}
                    />
                  </div>
                </div>

                <div className="border-t border-border">
                  {selectedComponents.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-neutral-600">No components.</div>
                  ) : (
                    selectedComponents.map((c: any) => {
                      const fields = (c.metadata?.inspector?.fields ?? []) as any[];
                      const value = buildInspectorValue(c, fields);

                      const isMaterial = isMaterialComponentType(String(c.type));
                      const isCustomGeometry = String(c.type) === 'customGeometry';
                      const isSkybox = String(c.type) === 'skybox';
                      const materialResourceKey = isMaterial
                        ? (typeof c?.[MATERIAL_RESOURCE_REF_KEY] === 'string' ? String(c[MATERIAL_RESOURCE_REF_KEY]) : '')
                        : '';

                      const componentLabel = c?.metadata?.label || c.type;
                      const componentDescription = typeof c?.metadata?.description === 'string' ? c.metadata.description.trim() : '';

                      return (
                        <div key={c.type} className="border-b border-border px-3 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 font-bold text-sm">
                                {renderComponentIcon(c?.metadata?.icon)}
                                <div className="truncate">{componentLabel}</div>
                              </div>
                              {componentDescription ? (
                                <div className="mt-1 text-xs text-muted-foreground">{componentDescription}</div>
                              ) : null}
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

                          {isMaterial ? (
                            <div className="mt-3 space-y-2">
                              <Label>Material Resource</Label>
                              <ResourceKeyDropdown
                                kinds={[String(c.type)]}
                                value={materialResourceKey || null}
                                disabled={editor.mode !== 'edit'}
                                placeholder="Select material resource…"
                                onChange={async (nextKey) => {
                                  if (!nextKey) {
                                    editor.onUpdateSelectedComponentData(c.type, { [MATERIAL_RESOURCE_REF_KEY]: '' });
                                    return;
                                  }

                                  editor.setError(null);
                                  try {
                                    const resolved = await resolveMaterialResourceActive(nextKey);
                                    if (resolved.kind !== String(c.type)) {
                                      throw new Error(
                                        `Resource kind '${resolved.kind}' does not match component '${String(c.type)}'`
                                      );
                                    }

                                    editor.onUpdateSelectedComponentData(c.type, {
                                      [MATERIAL_RESOURCE_REF_KEY]: nextKey,
                                      ...resolved.componentData,
                                    });
                                  } catch (e) {
                                    editor.setError(e instanceof Error ? e.message : 'Failed to apply material resource');
                                  }
                                }}
                              />
                              <div className="text-xs text-muted-foreground">Uses the active version of the selected resource.</div>
                            </div>
                          ) : isCustomGeometry ? (
                            <div className="mt-3 space-y-2">
                              <Label>Custom Mesh Resource</Label>
                              <ResourceKeyDropdown
                                kinds={['customMesh']}
                                value={typeof c?.key === 'string' && c.key.trim() ? c.key : null}
                                disabled={editor.mode !== 'edit'}
                                placeholder="Select custom mesh…"
                                onChange={(nextKey) => {
                                  editor.onUpdateSelectedComponentData(c.type, { key: nextKey ?? '' });
                                }}
                              />

                              {fields.length ? (
                                <div className="mt-3">
                                  <EcsInspectorFieldsForm
                                    key={`${selectionKey}:${tab}:${String(c.type)}:${editor.sceneRevision}:customGeometry`}
                                    fields={fields.filter((f) => String((f as any)?.key) !== 'key') as any}
                                    value={value}
                                    onChange={(next) => {
                                      const delta = diffInspectorValue(value, next);
                                      if (Object.keys(delta).length) editor.onUpdateSelectedComponentData(c.type, delta);
                                    }}
                                    disabled={editor.mode !== 'edit'}
                                    referenceOptions={referenceOptions}
                                  />
                                </div>
                              ) : null}
                            </div>
                          ) : isSkybox ? (
                            <div className="mt-3 space-y-2">
                              <Label>Skybox Resource</Label>
                              <ResourceKeyDropdown
                                kinds={['skybox']}
                                value={typeof c?.key === 'string' && c.key.trim() ? c.key : null}
                                disabled={editor.mode !== 'edit'}
                                placeholder="Select skybox…"
                                onChange={(nextKey) => {
                                  editor.onUpdateSelectedComponentData(c.type, { key: nextKey ?? '' });
                                }}
                              />

                              {fields.length ? (
                                <div className="mt-3">
                                  <EcsInspectorFieldsForm
                                    key={`${selectionKey}:${tab}:${String(c.type)}:${editor.sceneRevision}:skybox`}
                                    fields={fields.filter((f) => String((f as any)?.key) !== 'key') as any}
                                    value={value}
                                    onChange={(next) => {
                                      const delta = diffInspectorValue(value, next);
                                      if (Object.keys(delta).length) editor.onUpdateSelectedComponentData(c.type, delta);
                                    }}
                                    disabled={editor.mode !== 'edit'}
                                    referenceOptions={referenceOptions}
                                  />
                                </div>
                              ) : null}
                            </div>
                          ) : fields.length ? (
                            <div className="mt-3">
                              <EcsInspectorFieldsForm
                                key={`${selectionKey}:${tab}:${String(c.type)}:${editor.sceneRevision}`}
                                fields={fields as any}
                                value={value}
                                onChange={(next) => {
                                  const delta = diffInspectorValue(value, next);
                                  if (Object.keys(delta).length) editor.onUpdateSelectedComponentData(c.type, delta);
                                }}
                                disabled={editor.mode !== 'edit'}
                                referenceOptions={referenceOptions}
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
              </>
            ) : null}
          </div>
        ) : (
          <div className="px-3 py-3 text-sm text-muted-foreground">Select an entity to edit.</div>
        )}
      </div>
    </div>
  );
}
