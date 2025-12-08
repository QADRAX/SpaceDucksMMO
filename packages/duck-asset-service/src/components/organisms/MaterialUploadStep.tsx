'use client';

import { Label } from '@/components/atoms/Label';
import { Input } from '@/components/atoms/Input';
import { MaterialMapUpload } from '@/components/molecules/MaterialMapUpload';
import type { MaterialMapType } from '@/lib/types';

interface MaterialFiles {
  albedo: File | null;
  normal: File | null;
  roughness: File | null;
  metallic: File | null;
  ao: File | null;
  height: File | null;
  emission: File | null;
}

interface MaterialUploadStepProps {
  materialFiles: MaterialFiles;
  onFileChange: (mapType: MaterialMapType, file: File | null) => void;
  version: string;
  onVersionChange: (version: string) => void;
  versionNotes: string;
  onVersionNotesChange: (notes: string) => void;
}

export function MaterialUploadStep({
  materialFiles,
  onFileChange,
  version,
  onVersionChange,
  versionNotes,
  onVersionNotesChange,
}: MaterialUploadStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg mb-1">🎨 PBR Material Maps</h3>
        <p className="text-xs text-foreground/60 mb-4">
          Upload texture maps for this material. At least Albedo and Normal are recommended.
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

      {/* Required Maps */}
      <div className="space-y-3">
        <MaterialMapUpload
          mapType="albedo"
          file={materialFiles.albedo}
          onFileSelected={(file) => onFileChange('albedo', file)}
          required
        />
        <MaterialMapUpload
          mapType="normal"
          file={materialFiles.normal}
          onFileSelected={(file) => onFileChange('normal', file)}
          required
        />
      </div>

      {/* Optional Maps */}
      <details className="border-2 border-border rounded-base p-3">
        <summary className="cursor-pointer font-heading">
          Optional Maps (Roughness, Metallic, AO, Height, Emission)
        </summary>
        <div className="space-y-3 mt-3">
          <MaterialMapUpload
            mapType="roughness"
            file={materialFiles.roughness}
            onFileSelected={(file) => onFileChange('roughness', file)}
          />
          <MaterialMapUpload
            mapType="metallic"
            file={materialFiles.metallic}
            onFileSelected={(file) => onFileChange('metallic', file)}
          />
          <MaterialMapUpload
            mapType="ao"
            file={materialFiles.ao}
            onFileSelected={(file) => onFileChange('ao', file)}
          />
          <MaterialMapUpload
            mapType="height"
            file={materialFiles.height}
            onFileSelected={(file) => onFileChange('height', file)}
          />
          <MaterialMapUpload
            mapType="emission"
            file={materialFiles.emission}
            onFileSelected={(file) => onFileChange('emission', file)}
          />
        </div>
      </details>

      <div>
        <Label htmlFor="versionNotes">Version Notes</Label>
        <Input
          id="versionNotes"
          value={versionNotes}
          onChange={(e) => onVersionNotesChange(e.target.value)}
          placeholder="Initial version with PBR maps"
        />
      </div>
    </div>
  );
}
