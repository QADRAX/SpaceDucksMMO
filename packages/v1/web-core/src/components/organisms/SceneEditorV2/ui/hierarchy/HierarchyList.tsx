import * as React from 'react';
import { useSceneEditorV2Context } from '../../SceneEditorV2Context';
import { SCENE_NODE_ID } from '../../types';
import { DebugTransformIcon, DebugMeshIcon, DebugColliderIcon, CameraIcon } from '@/components/icons';
import { EntityNode } from './EntityNode';
import { HierarchyItem } from './HierarchyItem';
import { useHierarchyContext } from './HierarchyContext';

interface HierarchyListProps {
    editor: ReturnType<typeof useSceneEditorV2Context>;
}

export function HierarchyList({ editor }: HierarchyListProps) {
    const {
        isExpanded,
        toggleExpanded,
        dragOverId,
        setDragOverId,
        handleDropToParent,
    } = useHierarchyContext();

    return (
        <div className="scrollbar min-h-0 flex-1 overflow-y-auto p-2" onClick={() => editor.setSelectedId(null)}>
            <div className="space-y-1">
                <HierarchyItem
                    id={SCENE_NODE_ID}
                    depth={0}
                    label={editor.resourceDisplayName || 'Scene'}
                    selected={editor.selectedId === SCENE_NODE_ID}
                    hasChildren={true}
                    expanded={isExpanded(SCENE_NODE_ID)}
                    availableDebugs={[
                        { kind: 'transform', label: 'Transforms', icon: DebugTransformIcon },
                        { kind: 'mesh', label: 'Meshes (Wireframe)', icon: DebugMeshIcon },
                        { kind: 'collider', label: 'Colliders', icon: DebugColliderIcon },
                        { kind: 'camera', label: 'Cameras', icon: CameraIcon },
                    ]}
                    enabledDebugs={editor.gameState === 'stopped' && editor.presentationRevision >= 0 ?
                        Object.entries((editor as any)._currentScene?.debugFlags ?? {})
                            .filter(([_, enabled]) => !!enabled)
                            .map(([kind]) => kind as any)
                        : []}
                    onToggleDebug={(kind: any) => {
                        const scene = (editor as any)._currentScene;
                        if (scene) {
                            scene.debugFlags[kind] = !scene.debugFlags[kind];
                            editor.commitFromCurrentScene();
                        }
                    }}
                    onToggle={() => toggleExpanded(SCENE_NODE_ID)}
                    onSelect={() => editor.setSelectedId(SCENE_NODE_ID)}
                    droppable={editor.gameState === 'stopped'}
                    dragOver={dragOverId === SCENE_NODE_ID}
                    onDragOver={() => setDragOverId(SCENE_NODE_ID)}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={(e) => handleDropToParent(null, e)}
                />

                {isExpanded(SCENE_NODE_ID) ? (
                    editor.hierarchyRoots.length === 0 ? (
                        <div className="ml-4 text-sm text-neutral-600">Empty.</div>
                    ) : (
                        <div className="space-y-1">
                            {editor.hierarchyRoots.map((r) => (
                                <EntityNode
                                    key={r.id}
                                    entity={r}
                                    depth={1}
                                />
                            ))}
                        </div>
                    )
                ) : null}
            </div>
        </div>
    );
}
