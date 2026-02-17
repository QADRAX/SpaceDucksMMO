import JSZip from 'jszip';

export type FileEntry = {
    slot: string;
    file: File | string; // File object or filename (if file is in zip root but passed differently? No, usually File)
    // Actually, for zip.file(name, content), content is File.
    // The 'file' property in the manifest is the filename.
};

export type ResourceManifest = {
    kind: string;
    key?: string;
    displayName?: string;
    version: VersionManifest;
};

export type VersionManifest = {
    version?: number;
    componentData: Record<string, unknown>;
    files: Array<{ slot: string; file: string }>;
};

/**
 * Ensures a filename is unique within a set of used names by appending a counter.
 */
export function ensureUniqueFilename(name: string, used: Set<string>): string {
    const safe = (name || 'file').replace(/\\/g, '/').split('/').pop() || 'file';
    const dot = safe.lastIndexOf('.');
    const base = dot > 0 ? safe.slice(0, dot) : safe;
    const ext = dot > 0 ? safe.slice(dot) : '';

    let candidate = `${base}${ext}`;
    let i = 1;
    while (used.has(candidate)) {
        candidate = `${base}-${i}${ext}`;
        i++;
    }
    used.add(candidate);
    return candidate;
}

/**
 * Creates a ZIP file for a new resource or version.
 * 
 * @param manifestParams Metadata for the resource/version.
 * @param files List of files to include.
 * @param isNewResource If true, creates 'resource.json', otherwise 'version.json'.
 */
export async function createUploadZip(
    manifestParams: {
        kind: string;
        key?: string;
        displayName?: string;
        componentData?: Record<string, unknown>;
        versionNumber?: number;
    },
    files: Record<string, File> // Map of slot -> File
): Promise<Blob> {
    const zip = new JSZip();
    const usedFileNames = new Set<string>();
    usedFileNames.add('resource.json');
    usedFileNames.add('version.json');

    const fileEntries: Array<{ slot: string; file: string }> = [];

    for (const [slot, file] of Object.entries(files)) {
        const uniqueName = ensureUniqueFilename(file.name, usedFileNames);
        zip.file(uniqueName, file);
        fileEntries.push({ slot, file: uniqueName });
    }

    const versionManifest: VersionManifest = {
        version: manifestParams.versionNumber ?? 1,
        componentData: manifestParams.componentData ?? {},
        files: fileEntries,
    };

    if (manifestParams.key && manifestParams.displayName) {
        // New Resource
        const resourceManifest: ResourceManifest = {
            kind: manifestParams.kind,
            key: manifestParams.key,
            displayName: manifestParams.displayName,
            version: versionManifest,
        };
        zip.file('resource.json', JSON.stringify(resourceManifest, null, 2));
    } else {
        // New Version
        zip.file('version.json', JSON.stringify(versionManifest, null, 2));
    }

    return await zip.generateAsync({ type: 'blob' });
}
