'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { detectMapType } from '@/lib/types';
import type { MaterialMapType } from '@/lib/types';

interface FileWithPreview extends File {
  preview?: string;
  detectedType?: MaterialMapType | null;
}

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  showMapTypeDetection?: boolean;
}

export function FileUpload({
  onFilesSelected,
  accept = 'image/*',
  multiple = true,
  maxSize = 50,
  showMapTypeDetection = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    // Validate file sizes
    const maxSizeBytes = maxSize * 1024 * 1024;
    const oversizedFiles = files.filter((f) => f.size > maxSizeBytes);

    if (oversizedFiles.length > 0) {
      setError(`Some files exceed ${maxSize}MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Process files with preview
    const processedFiles: FileWithPreview[] = files.map((file) => {
      const fileWithPreview = file as FileWithPreview;
      
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      
      if (showMapTypeDetection) {
        fileWithPreview.detectedType = detectMapType(file.name);
      }
      
      return fileWithPreview;
    });

    setSelectedFiles([...selectedFiles, ...processedFiles]);
    onFilesSelected([...selectedFiles, ...processedFiles]);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    
    // Revoke preview URL
    const removedFile = selectedFiles[index];
    if (removedFile.preview) {
      URL.revokeObjectURL(removedFile.preview);
    }
    
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getMapTypeBadge = (mapType: MaterialMapType | null | undefined) => {
    if (!mapType) return null;
    
    const colors: Record<MaterialMapType, string> = {
      albedo: 'bg-blue-500',
      normal: 'bg-purple-500',
      roughness: 'bg-gray-500',
      metallic: 'bg-yellow-500',
      ao: 'bg-green-500',
      height: 'bg-orange-500',
      emission: 'bg-red-500',
    };
    
    return (
      <span className={`px-2 py-0.5 text-xs font-bold text-white rounded ${colors[mapType]}`}>
        {mapType.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        accept={accept}
        multiple={multiple}
        className="hidden"
      />

      <Button
        type="button"
        onClick={handleClick}
        variant="secondary"
        size="sm"
      >
        {selectedFiles.length > 0 ? '+ Add More Files' : '📁 Select Files'}
      </Button>

      {error && (
        <div className="p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold">
            Selected Files ({selectedFiles.length}):
          </p>
          <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-background border-2 border-border rounded-base shadow-base hover:shadow-base-hover transition-shadow"
              >
                {file.preview && (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-12 h-12 object-cover border-2 border-border rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-base text-sm truncate">{file.name}</p>
                    {showMapTypeDetection && getMapTypeBadge(file.detectedType)}
                  </div>
                  <p className="text-xs text-foreground/60">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => removeFile(index)}
                  variant="secondary"
                  size="sm"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
