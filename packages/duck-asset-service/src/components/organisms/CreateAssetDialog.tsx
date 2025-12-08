'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/molecules/Dialog';
import { Button } from '@/components/atoms/Button';
import { AssetMetadataStep } from './AssetMetadataStep';
import { MaterialUploadStep } from './MaterialUploadStep';
import { TextureUploadStep } from './TextureUploadStep';
import type { AssetType } from '@/lib/types';

interface CreateAssetDialogProps {
  trigger?: React.ReactNode;
  onAssetCreated?: () => void;
}

interface AssetFormData {
  key: string;
  displayName: string;
  type: AssetType;
  category: string;
  tags: string;
}

export function CreateAssetDialog({
  trigger,
  onAssetCreated,
}: CreateAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Metadata
  const [formData, setFormData] = useState<AssetFormData>({
    key: '',
    displayName: '',
    type: 'material',
    category: '',
    tags: '',
  });

  // Step 2: Files (type-specific)
  const [materialFiles, setMaterialFiles] = useState<{
    albedo: File | null;
    normal: File | null;
    roughness: File | null;
    metallic: File | null;
    ao: File | null;
    height: File | null;
    emission: File | null;
  }>({
    albedo: null,
    normal: null,
    roughness: null,
    metallic: null,
    ao: null,
    height: null,
    emission: null,
  });

  const [textureFiles, setTextureFiles] = useState<File[]>([]);
  const [version, setVersion] = useState('1.0.0');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setStep(1);
    setFormData({
      key: '',
      displayName: '',
      type: 'material',
      category: '',
      tags: '',
    });
    setMaterialFiles({
      albedo: null,
      normal: null,
      roughness: null,
      metallic: null,
      ao: null,
      height: null,
      emission: null,
    });
    setTextureFiles([]);
    setVersion('1.0.0');
    setNotes('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleNext = () => {
    if (step === 1) {
      // Validate step 1
      if (!formData.key.trim() || !formData.displayName.trim()) {
        setError('Key and Display Name are required');
        return;
      }
      setError(null);
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (step === 1) {
      handleNext();
      return;
    }

    // Step 2: Submit
    setIsSubmitting(true);
    setError(null);

    try {
      // Create asset
      const assetResponse = await fetch('/api/admin/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: formData.key,
          displayName: formData.displayName,
          type: formData.type,
          category: formData.category || undefined,
          tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
        }),
      });

      if (!assetResponse.ok) {
        const errorData = await assetResponse.json();
        throw new Error(errorData.error || 'Failed to create asset');
      }

      const asset = await assetResponse.json();

      // Upload files
      const uploadFormData = new FormData();
      uploadFormData.append('version', version);
      if (notes) {
        uploadFormData.append('notes', notes);
      }

      if (formData.type === 'material') {
        // Material: use named fields for each map type
        if (materialFiles.albedo) uploadFormData.append('albedo', materialFiles.albedo);
        if (materialFiles.normal) uploadFormData.append('normal', materialFiles.normal);
        if (materialFiles.roughness) uploadFormData.append('roughness', materialFiles.roughness);
        if (materialFiles.metallic) uploadFormData.append('metallic', materialFiles.metallic);
        if (materialFiles.ao) uploadFormData.append('ao', materialFiles.ao);
        if (materialFiles.height) uploadFormData.append('height', materialFiles.height);
        if (materialFiles.emission) uploadFormData.append('emission', materialFiles.emission);
      } else if (formData.type === 'texture') {
        // Texture: use generic 'files' field
        textureFiles.forEach((file) => {
          uploadFormData.append('files', file);
        });
      }

      const uploadResponse = await fetch(
        `/api/admin/assets/${asset.id}/versions`,
        {
          method: 'POST',
          body: uploadFormData,
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        
        // Rollback: Delete the asset that was just created
        await fetch(`/api/admin/assets/${asset.id}`, {
          method: 'DELETE',
        });
        
        throw new Error(errorData.error || 'Failed to upload files');
      }

      setOpen(false);
      resetForm();
      onAssetCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Create Asset</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {step === 1 ? 'Create Asset' : 'Upload Files'}
            </h2>
            <p className="text-sm opacity-70">
              Step {step} of 2
              {step === 1
                ? ': Enter asset information'
                : formData.type === 'material'
                  ? ': Upload PBR material maps'
                  : ': Upload texture files'}
            </p>
          </div>

          {error && (
            <div className="rounded-md border-2 border-red-500 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {step === 1 && (
            <AssetMetadataStep
              formData={formData}
              onChange={(field, value) => {
                setFormData((prev) => ({ ...prev, [field]: value }));
              }}
            />
          )}

          {step === 2 && formData.type === 'material' && (
            <MaterialUploadStep
              materialFiles={materialFiles}
              onFileChange={(mapType, file) => {
                setMaterialFiles((prev) => ({ ...prev, [mapType]: file }));
              }}
              version={version}
              onVersionChange={setVersion}
              versionNotes={notes}
              onVersionNotesChange={setNotes}
            />
          )}

          {step === 2 && formData.type === 'texture' && (
            <TextureUploadStep
              files={textureFiles}
              onFilesChange={setTextureFiles}
              version={version}
              onVersionChange={setVersion}
              versionNotes={notes}
              onVersionNotesChange={setNotes}
            />
          )}

          <div className="flex items-center justify-between border-t-2 border-black pt-4">
            <div>
              {step === 2 && (
                <Button variant="secondary" onClick={handleBack} disabled={isSubmitting}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting
                  ? 'Creating...'
                  : step === 1
                    ? 'Next'
                    : 'Create Asset'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
