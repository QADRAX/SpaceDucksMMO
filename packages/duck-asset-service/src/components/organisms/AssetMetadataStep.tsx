'use client';

import { Label } from '@/components/atoms/Label';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import type { AssetType } from '@/lib/types';

interface AssetMetadataStepProps {
  formData: {
    key: string;
    displayName: string;
    type: AssetType;
    category: string;
    tags: string;
  };
  onChange: (field: string, value: string) => void;
}

export function AssetMetadataStep({ formData, onChange }: AssetMetadataStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg mb-1">📝 Asset Information</h3>
        <p className="text-xs text-foreground/60 mb-4">
          Basic information about your asset. This will help organize and identify it in the catalog.
        </p>
      </div>

      <div>
        <Label htmlFor="type">Asset Type *</Label>
        <Select
          id="type"
          value={formData.type}
          onChange={(e) => onChange('type', e.target.value)}
          required
        >
          <option value="material">Material (PBR)</option>
          <option value="texture">Texture/Image</option>
        </Select>
        <p className="text-xs text-foreground/60 mt-1">
          Materials have multiple PBR maps. Textures are simple images.
        </p>
      </div>

      <div>
        <Label htmlFor="key">Asset Key *</Label>
        <Input
          id="key"
          value={formData.key}
          onChange={(e) => onChange('key', e.target.value)}
          placeholder="e.g., materials/concrete/muddy or textures/ui/button-bg"
          required
          pattern="[a-zA-Z0-9\/_-]+"
          title="Only alphanumeric characters, slashes, hyphens, and underscores"
        />
        <p className="text-xs text-foreground/60 mt-1">
          Unique identifier. Use slashes for hierarchy.
        </p>
      </div>

      <div>
        <Label htmlFor="displayName">Display Name *</Label>
        <Input
          id="displayName"
          value={formData.displayName}
          onChange={(e) => onChange('displayName', e.target.value)}
          placeholder="e.g., Muddy Concrete Material"
          required
        />
      </div>

      <div>
        <Label htmlFor="category">Category *</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => onChange('category', e.target.value)}
          placeholder="e.g., materials/concrete or textures/ui"
          required
        />
        <p className="text-xs text-foreground/60 mt-1">
          Use slashes for nested categories.
        </p>
      </div>

      <div>
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => onChange('tags', e.target.value)}
          placeholder="e.g., concrete, pbr, muddy, seamless"
        />
        <p className="text-xs text-foreground/60 mt-1">
          Comma-separated values. Optional.
        </p>
      </div>
    </div>
  );
}
