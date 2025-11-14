/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { SceneEditor } from '@client/application/SceneEditor';
import type { SceneObjectInfo } from '@client/application/SceneEditor';
import type { ObjectFactory } from '@client/application/ObjectFactory';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import { DraggablePanel } from '../common/DraggablePanel';
import './scene-hierarchy.css';

export interface SceneHierarchyProps {
  editor: SceneEditor;
  factory: ObjectFactory;
}

/**
 * Scene Hierarchy Panel
 * 
 * Displays all objects in the current scene as a list.
 * Allows selection, deletion, and visibility toggle.
 * 
 * Features:
 * - List all scene objects with type and ID
 * - Click to select object (for inspector)
 * - Delete button per object
 * - Object count display
 * - Empty state message
 */
export function SceneHierarchy({ editor, factory }: SceneHierarchyProps) {
  const { t } = useI18n();
  const [objects, setObjects] = useState<SceneObjectInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Refresh object list
  const refreshObjects = () => {
    setObjects(editor.listObjects());
  };

  // Subscribe to editor changes
  useEffect(() => {
    refreshObjects();

    const unsubscribeChange = editor.onChange(() => {
      refreshObjects();
    });

    const unsubscribeSelection = editor.onSelectionChange((objectId) => {
      setSelectedId(objectId);
    });

    return () => {
      unsubscribeChange();
      unsubscribeSelection();
    };
  }, [editor]);

  const handleSelect = (objectId: string) => {
    editor.selectObject(objectId);
  };

  const handleDelete = (objectId: string, typeName: string, e: MouseEvent) => {
    e.stopPropagation(); // Prevent selection
    
    // Prevent camera deletion
    if (typeName === 'Camera') {
      alert(t('editor.sceneHierarchy.cannotDeleteCamera'));
      return;
    }
    
    if (confirm(t('editor.sceneHierarchy.deleteConfirm', 'Delete object "{id}"?').replace('{id}', objectId))) {
      editor.removeObject(objectId);
    }
  };

  const handleAddObject = (typeValue: string) => {
    let newObject;

    switch (typeValue) {
      case 'planet':
        newObject = factory.createPlanet({ type: 'earth', radius: 1.0 });
        break;
      case 'star':
        newObject = factory.createStar({ size: 1.0, color: 0xffff00 });
        break;
      case 'skybox':
        newObject = factory.createSkybox();
        break;
      case 'ambient-light':
        newObject = factory.createAmbientLight({ intensity: 0.5 });
        break;
      case 'directional-light':
        newObject = factory.createDirectionalLight({ intensity: 1.0 });
        break;
      case 'grid':
        newObject = factory.createGrid();
        break;
      case 'axes':
        newObject = factory.createAxes();
        break;
      case 'camera':
        newObject = factory.createCamera({ fov: 75, orbitDistance: 10, autoRotate: false });
        break;
      default:
        console.warn(`Unknown object type: ${typeValue}`);
        return;
    }

    if (newObject) {
      editor.addObject(newObject);
      console.log(`[SceneHierarchy] Added ${typeValue}: ${newObject.id}`);
    }

    setShowAddMenu(false);
  };

  const objectTypes = [
    { value: 'planet', label: 'Planet', category: 'Visual' },
    { value: 'star', label: 'Star', category: 'Visual' },
    { value: 'skybox', label: 'Skybox', category: 'Visual' },
    { value: 'ambient-light', label: 'Ambient Light', category: 'Lights' },
    { value: 'directional-light', label: 'Directional Light', category: 'Lights' },
    { value: 'grid', label: 'Grid Helper', category: 'Helpers' },
    { value: 'axes', label: 'Axes Helper', category: 'Helpers' }
  ];

  // Group by category
  const categories = objectTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, Array<{ value: string; label: string; category: string }>>);

  return (
    <DraggablePanel
      title={t('editor.sceneHierarchy.title')}
      theme="blue"
      collapsible={true}
      resizable={true}
      draggable={true}
      defaultPosition={{ x: 20, y: 80 }}
      defaultSize={{ width: 280, height: 500 }}
      minWidth={200}
      minHeight={150}
    >
      <div class="hierarchy-header">
        <span class="object-count">{t('editor.sceneHierarchy.objectCount').replace('{count}', objects.length.toString())}</span>
        <button
          class="add-object-btn"
          onClick={() => setShowAddMenu(!showAddMenu)}
          title={t('editor.addObject.title')}
        >
          ➕
        </button>
      </div>

      {/* Add Object Dropdown Menu */}
      {showAddMenu && (
        <>
          <div class="add-object-dropdown">
            {Object.entries(categories).map(([category, types]) => (
              <div key={category} class="dropdown-category">
                <div class="dropdown-category-header">{t(`editor.addObject.categories.${category.toLowerCase()}`)}</div>
                <div class="dropdown-category-items">
                  {types.map(type => (
                    <button
                      key={type.value}
                      class="dropdown-item"
                      onClick={() => handleAddObject(type.value)}
                    >
                      <span class="item-icon">{getObjectIcon(type.label)}</span>
                      <span class="item-label">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div
            class="add-menu-backdrop"
            onClick={() => setShowAddMenu(false)}
          />
        </>
      )}

      <div class="hierarchy-list">
        {objects.length === 0 ? (
          <div class="empty-state">
            <span class="empty-icon">📦</span>
            <p>{t('editor.sceneHierarchy.empty')}</p>
            <small>{t('editor.sceneHierarchy.addObjects')}</small>
          </div>
        ) : (
          objects.map(obj => {
            const isCamera = obj.typeName === 'Camera';
            return (
            <div
              key={obj.id}
              class={`hierarchy-item ${selectedId === obj.id ? 'selected' : ''} ${obj.isInspectable ? 'inspectable' : ''} ${isCamera ? 'camera-item' : ''}`}
              onClick={() => handleSelect(obj.id)}
            >
              <div class="item-info">
                <span class="item-icon">{getObjectIcon(obj.typeName)}</span>
                <div class="item-details">
                  <span class="item-type">{obj.typeName}</span>
                  <span class="item-id">{obj.id}</span>
                </div>
              </div>
              {!isCamera && (
                <button
                  class="delete-btn"
                  onClick={(e) => handleDelete(obj.id, obj.typeName, e)}
                  title={t('common.delete')}
                >
                  🗑️
                </button>
              )}
            </div>
          );
          })
        )}
      </div>
    </DraggablePanel>
  );
}

/**
 * Get emoji icon for object type
 */
function getObjectIcon(typeName: string): string {
  switch (typeName.toLowerCase()) {
    case 'planet': return '🌍';
    case 'star': return '⭐';
    case 'moon': return '🌙';
    case 'skybox': return '🌌';
    case 'camera': return '📷';
    case 'light':
    case 'ambient light':
    case 'directional light': return '💡';
    case 'grid helper': return '▦';
    case 'axes helper': return '📐';
    default: return '📦';
  }
}

export default SceneHierarchy;
