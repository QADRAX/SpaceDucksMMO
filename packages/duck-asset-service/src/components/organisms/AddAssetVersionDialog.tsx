'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/molecules/Dialog';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { FormGroup } from '@/components/molecules/FormGroup';

interface AddAssetVersionDialogProps {
  trigger?: React.ReactNode;
  assetId: string;
  assetType: string;
  onVersionAdded?: () => void;
}

const MAP_TYPES = ['albedo', 'normal', 'roughness', 'metallic', 'ao', 'height', 'emission'];

export function AddAssetVersionDialog({
  trigger,
  assetId,
  assetType,
  onVersionAdded,
}: AddAssetVersionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    version: '',
    status: 'draft',
    notes: '',
  });
  const [files, setFiles] = useState<{ [key: string]: File | null }>(
    assetType === 'material'
      ? Object.fromEntries(MAP_TYPES.map((type) => [type, null]))
      : { file: null }
  );

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create FormData
      const formDataToSend = new FormData();
      
      // Add version metadata
      if (formData.version) formDataToSend.append('version', formData.version);
      formDataToSend.append('status', formData.status);
      if (formData.notes) formDataToSend.append('notes', formData.notes);

      // Add files with explicit field names
      if (assetType === 'material') {
        MAP_TYPES.forEach((mapType) => {
          const file = files[mapType];
          if (file) {
            formDataToSend.append(mapType, file);
          }
        });
      } else {
        // For texture, use 'file' field
        const file = files.file;
        if (file) {
          formDataToSend.append('file', file);
        } else {
          throw new Error('Please select a file to upload');
        }
      }

      const response = await fetch(
        `/api/admin/assets/${assetId}/versions`,
        {
          method: 'POST',
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create version');
      }

      setOpen(false);
      onVersionAdded?.();
      
      // Reset form
      setFormData({ version: '', status: 'draft', notes: '' });
      setFiles(
        assetType === 'material'
          ? Object.fromEntries(MAP_TYPES.map((type) => [type, null]))
          : { file: null }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Add Version</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Add New Version</h2>
            <p className="text-sm opacity-70">Upload files for a new asset version</p>
          </div>

          {error && (
            <div className="rounded-md border-2 border-red-500 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <FormGroup label="Version (optional)" htmlFor="version">
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="Leave empty for auto-generation (e.g., v1, v2, v3...)"
              />
              <p className="text-xs text-neutral-600 mt-1">
                If not specified, version will be auto-generated based on existing versions.
              </p>
            </FormGroup>

            <FormGroup label="Status *" htmlFor="status">
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </FormGroup>

            <FormGroup label="Notes" htmlFor="notes">
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional version notes..."
              />
            </FormGroup>

            <div className="border-t-2 border-black pt-4">
              <h3 className="font-bold text-lg mb-4">
                {assetType === 'material' ? 'Upload PBR Maps' : 'Upload File'}
              </h3>

              {assetType === 'material' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MAP_TYPES.map((mapType) => (
                    <FormGroup 
                      key={mapType}
                      label={`${mapType.charAt(0).toUpperCase() + mapType.slice(1)} Map`}
                      htmlFor={mapType}
                    >
                      <Input
                        id={mapType}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(mapType, e.target.files?.[0] || null)}
                      />
                    </FormGroup>
                  ))}
                </div>
              ) : (
                <FormGroup label="File *" htmlFor="file">
                  <Input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('file', e.target.files?.[0] || null)}
                    required
                  />
                </FormGroup>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t-2 border-black pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Version'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
