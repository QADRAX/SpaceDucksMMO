/** @jsxImportSource preact */
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import './component-picker.css';

export interface AvailableComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  factory: () => any; // Returns component instance
}

export interface ComponentPickerProps {
  availableComponents: AvailableComponent[];
  onAdd: (componentFactory: () => any, metadata: { displayName: string; category: string; icon: string; description: string }) => void;
}

/**
 * ComponentPicker - UI for adding new components to an object
 * 
 * Shows:
 * - Categorized list of available components
 * - Search/filter functionality
 * - Add button for each component
 */
export function ComponentPicker({ availableComponents, onAdd }: ComponentPickerProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get unique categories
  const categories = ['all', ...new Set(availableComponents.map(c => c.category))];
  
  // Filter components
  const filtered = availableComponents.filter(comp => {
    const matchesSearch = search === '' || 
      comp.name.toLowerCase().includes(search.toLowerCase()) ||
      comp.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || comp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Group by category
  const grouped = filtered.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, AvailableComponent[]>);

  const handleAdd = (comp: AvailableComponent) => {
    onAdd(comp.factory, {
      displayName: comp.name,
      category: comp.category,
      icon: comp.icon,
      description: comp.description
    });
  };

  return (
    <div class="component-picker">
      <button 
        class="picker-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span class="picker-title">
          <span class="picker-icon">➕</span>
          {t('editor.components.addComponent')}
        </span>
        <span class="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </button>
      
      {isExpanded && (
        <div class="picker-content">
          {/* Search */}
          <div class="picker-search">
            <input
              type="text"
              placeholder={t('editor.components.search')}
              value={search}
              onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
              class="search-input"
            />
          </div>
          
          {/* Category filter */}
          <div class="category-filter">
            {categories.map(cat => (
              <button
                key={cat}
                class={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
          
          {/* Components list */}
          <div class="components-list">
            {Object.entries(grouped).map(([category, comps]) => (
              <div key={category} class="component-group">
                <div class="group-title">{category}</div>
                {comps.map(comp => (
                  <div key={comp.id} class="component-item">
                    <span class="component-item-icon">{comp.icon}</span>
                    <div class="component-item-info">
                      <span class="component-item-name">{comp.name}</span>
                      <span class="component-item-description">{comp.description}</span>
                    </div>
                    <button
                      class="add-btn"
                      onClick={() => handleAdd(comp)}
                      title={`Add ${comp.name}`}
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            ))}
            
            {filtered.length === 0 && (
              <div class="no-results">
                <p>No components found</p>
                <small>Try adjusting your search or filter</small>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ComponentPicker;
