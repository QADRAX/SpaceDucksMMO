'use client';

import { useRef } from 'react';
import { Button } from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Label';
import type { MaterialMapType } from '@/lib/types';

interface MaterialMapUploadProps {
  mapType: MaterialMapType;
  file: File | null;
  onFileSelected: (file: File | null) => void;
  required?: boolean;
}

const MAP_INFO: Record<MaterialMapType, { label: string; description: string; color: string }> = {
  albedo: {
    label: 'Albedo (Base Color)',
    description: 'The base color/diffuse map of the material',
    color: 'bg-blue-500',
  },
  normal: {
    label: 'Normal Map',
    description: 'Surface detail and bump information',
    color: 'bg-purple-500',
  },
  roughness: {
    label: 'Roughness',
    description: 'Surface roughness (white = rough, black = smooth)',
    color: 'bg-gray-500',
  },
  metallic: {
    label: 'Metallic',
    description: 'Metallic properties (white = metal, black = non-metal)',
    color: 'bg-yellow-500',
  },
  ao: {
    label: 'Ambient Occlusion',
    description: 'Ambient light shadowing information',
    color: 'bg-green-500',
  },
  height: {
    label: 'Height (Displacement)',
    description: 'Height information for parallax or displacement',
    color: 'bg-orange-500',
  },
  emission: {
    label: 'Emission',
    description: 'Emissive/glow map',
    color: 'bg-red-500',
  },
};

export function MaterialMapUpload({ mapType, file, onFileSelected, required = false }: MaterialMapUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const info = MAP_INFO[mapType];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileSelected(selectedFile);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = () => {
    onFileSelected(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>
          {info.label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </Label>
        <span className={`px-2 py-0.5 text-xs font-base text-white rounded ${info.color}`}>
          {mapType.toUpperCase()}
        </span>
      </div>
      
      <p className="text-xs text-foreground/60">{info.description}</p>

      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        accept="image/*,.png,.jpg,.jpeg,.webp,.tga,.exr,.hdr"
        className="hidden"
      />

      {!file ? (
        <Button
          type="button"
          onClick={handleClick}
          variant="secondary"
          size="sm"
          className="w-full"
        >
          📁 Select {info.label}
        </Button>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-background border-2 border-border rounded-base shadow-base">
          {file.type.startsWith('image/') && (
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="w-16 h-16 object-cover border-2 border-border rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-base text-sm truncate">{file.name}</p>
            <p className="text-xs text-foreground/60">{formatFileSize(file.size)}</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleClick}
              variant="secondary"
              size="sm"
            >
              Change
            </Button>
            <Button
              type="button"
              onClick={handleRemove}
              variant="secondary"
              size="sm"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
