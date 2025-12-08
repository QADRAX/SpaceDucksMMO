import * as React from 'react';
import { FormGroup } from './FormGroup';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  className?: string;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeChange,
  categoryFilter,
  onCategoryChange,
  className,
}: FilterBarProps) {
  return (
    <div className={cn('bg-white p-4 rounded-base border-2 border-border shadow-base flex gap-4 flex-wrap', className)}>
      <FormGroup label="Search" className="flex-1 min-w-[200px]">
        <Input
          type="text"
          placeholder="Search by key or name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </FormGroup>
      
      <FormGroup label="Type" className="flex-1 min-w-[200px]">
        <Select value={typeFilter} onChange={(e) => onTypeChange(e.target.value)}>
          <option value="">All Types</option>
          <option value="texture">Texture</option>
          <option value="sprite_sheet">Sprite Sheet</option>
          <option value="audio">Audio</option>
          <option value="map">Map</option>
          <option value="prefab">Prefab</option>
          <option value="shader">Shader</option>
          <option value="script">Script</option>
          <option value="other">Other</option>
        </Select>
      </FormGroup>
      
      <FormGroup label="Category" className="flex-1 min-w-[200px]">
        <Input
          type="text"
          placeholder="e.g., textures/terrain"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
        />
      </FormGroup>
    </div>
  );
}
