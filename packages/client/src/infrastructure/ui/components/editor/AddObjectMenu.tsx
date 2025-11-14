/** @jsxImportSource preact */
import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { SceneEditor } from '@client/application/SceneEditor';
import type { ObjectFactory } from '@client/application/ObjectFactory';
import './add-object-menu.css';

export interface AddObjectMenuProps {
  editor: SceneEditor;
  factory: ObjectFactory;
}

interface ObjectType {
  value: string;
  label: string;
  category: string;
}

/**
 * Add Object Menu
 * 
 * Dropdown menu to add new objects to the scene.
 * Groups objects by category (Visual, Lights, Helpers).
 * 
 * Features:
 * - Click to expand/collapse menu
 * - Objects grouped by category
 * - Click object type to add to scene
 * - Objects added at origin (0, 0, 0)
 */
export function AddObjectMenu({ editor, factory }: AddObjectMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

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
  }, {} as Record<string, ObjectType[]>);

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
      console.log(`[AddObjectMenu] Added ${typeValue}: ${newObject.id}`);
    }

    setIsOpen(false);
  };

  return (
    <div class="add-object-menu">
      <button
        class="add-object-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span class="button-icon">➕</span>
        <span class="button-text">Add Object</span>
        <span class="button-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div class="object-menu-dropdown">
          {Object.entries(categories).map(([category, types]) => (
            <div key={category} class="menu-category">
              <div class="category-header">{category}</div>
              <div class="category-items">
                {types.map(type => (
                  <button
                    key={type.value}
                    class="menu-item"
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
      )}

      {/* Backdrop to close menu */}
      {isOpen && (
        <div
          class="menu-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

function getObjectIcon(label: string): string {
  switch (label.toLowerCase()) {
    case 'planet': return '🌍';
    case 'star': return '⭐';
    case 'skybox': return '🌌';
    case 'ambient light': return '💡';
    case 'directional light': return '🔦';
    case 'grid helper': return '▦';
    case 'axes helper': return '📐';
    default: return '📦';
  }
}

export default AddObjectMenu;
