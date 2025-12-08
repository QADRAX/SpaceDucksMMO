'use client';

import { useState } from 'react';
import { Label } from '@/components/atoms/Label';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';

interface TextureUploadStepProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  version: string;
  onVersionChange: (version: string) => void;
  versionNotes: string;
  onVersionNotesChange: (notes: string) => void;
}

export function TextureUploadStep({
  files,
  onFilesChange,
  version,
  onVersionChange,
  versionNotes,
  onVersionNotesChange,
}: TextureUploadStepProps) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    onFilesChange([...files, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg mb-1">🖼️ Texture Files</h3>
        <p className="text-xs text-foreground/60 mb-4">
          Upload one or more texture/image files. Supports PNG, JPG, WebP, and other common formats.
        </p>
      </div>

      <div>
        <Label htmlFor="version">Version *</Label>
        <Input
          id="version"
          value={version}
          onChange={(e) => onVersionChange(e.target.value)}
          placeholder="1.0.0"
          required
        />
      </div>

      <div>
        <Label>Files *</Label>
        <div className="border-2 border-dashed border-border rounded-base p-6 text-center">
          <input
            type="file"
            accept="image/*,.png,.jpg,.jpeg,.webp,.tga,.exr,.hdr"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="texture-file-input"
          />
          <label
            htmlFor="texture-file-input"
            className="cursor-pointer block"
          >
            <div className="mb-2 text-4xl">📁</div>
            <p className="text-sm font-heading mb-1">
              Click to select texture files
            </p>
            <p className="text-xs text-foreground/60">
              or drag and drop (multiple files supported)
            </p>
          </label>
        </div>
      </div>

      {files.length > 0 && (
        <div>
          <Label>Selected Files ({files.length})</Label>
          <div className="space-y-2 mt-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-2 border-border rounded-base p-3 bg-white"
              >
                <div className="flex-1">
                  <p className="font-heading text-sm">{file.name}</p>
                  <p className="text-xs text-foreground/60">
                    {(file.size / 1024).toFixed(2)} KB • {file.type}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => removeFile(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="versionNotes">Version Notes</Label>
        <Input
          id="versionNotes"
          value={versionNotes}
          onChange={(e) => onVersionNotesChange(e.target.value)}
          placeholder="Initial texture upload"
        />
      </div>
    </div>
  );
}
