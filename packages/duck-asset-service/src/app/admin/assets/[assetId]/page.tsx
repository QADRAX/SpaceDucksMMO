'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ParsedAssetWithVersions } from '@/lib/types';
import { PageHeader } from '@/components/organisms/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/molecules/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/organisms/Table';
import { Badge } from '@/components/atoms/Badge';
import { Tag } from '@/components/atoms/Tag';
import { Button } from '@/components/atoms/Button';

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<ParsedAssetWithVersions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  useEffect(() => {
    fetchAsset();
  }, [assetId]);

  const fetchAsset = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/assets/${assetId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch asset');
      }

      const data = await response.json();
      setAsset(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleVersionDetails = async (versionId: string) => {
    if (expandedVersion === versionId) {
      setExpandedVersion(null);
      return;
    }

    try {
      const response = await fetch(`/api/admin/assets/${assetId}/versions/${versionId}`);
      if (response.ok) {
        const versionData = await response.json();
        
        // Update the asset state with file details
        setAsset((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            versions: prev.versions.map((v) =>
              v.id === versionId ? { ...v, files: versionData.files } : v
            ),
          };
        });
        
        setExpandedVersion(versionId);
      }
    } catch (err) {
      console.error('Failed to fetch version details:', err);
    }
  };

  const setDefaultVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/admin/assets/${assetId}/versions/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        fetchAsset();
      }
    } catch (err) {
      console.error('Failed to set default version:', err);
    }
  };

  const updateVersionStatus = async (versionId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/assets/${assetId}/versions/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchAsset();
      }
    } catch (err) {
      console.error('Failed to update version status:', err);
    }
  };

  const deleteAsset = async () => {
    if (!confirm(`Are you sure you want to delete "${asset?.displayName}"? This will archive the asset and all its versions.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/assets/${assetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Redirect to assets list
        window.location.href = '/admin/assets';
      } else {
        const data = await response.json();
        alert(`Failed to delete asset: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to delete asset:', err);
      alert('Failed to delete asset. Please try again.');
    }
  };

  if (loading) {
    return (
      <Card>
        <p className="text-center text-neutral-600 py-8">Loading asset...</p>
      </Card>
    );
  }

  if (error || !asset) {
    return (
      <div>
        <Card className="mb-4 bg-red-100 border-red-800">
          <p className="text-red-800 font-base">
            <strong>Error:</strong> {error || 'Asset not found'}
          </p>
        </Card>
        <Link href="/admin/assets">
          <Button variant="secondary">Back to Assets</Button>
        </Link>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  return (
    <div>
      <PageHeader 
        title={asset.displayName}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={deleteAsset}>
              🗑️ Delete Asset
            </Button>
            <Link href="/admin/assets">
              <Button variant="secondary">← Back to Assets</Button>
            </Link>
          </div>
        }
      />

      <p className="mb-4 text-sm text-neutral-600">
        <code className="bg-bg px-2 py-1 rounded-base border border-border">{asset.key}</code>
      </p>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="font-base w-24">Type</span>
              <Badge variant="default">{asset.type}</Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-base w-24">Category</span>
              <span>{asset.category}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-base w-24">Tags</span>
              <div className="flex flex-wrap gap-1">
                {asset.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-base w-24">Created</span>
              <span>{new Date(asset.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-0">
        <div className="p-6 border-b-2 border-border">
          <h2 className="text-2xl font-heading">Versions ({asset.versions.length})</h2>
        </div>
        
        {asset.versions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">No versions yet. Use the API to upload files and create a version.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asset.versions.map((version) => (
                <React.Fragment key={version.id}>
                  <TableRow>
                    <TableCell>
                      <strong>{version.version}</strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant={version.status as 'draft' | 'published' | 'deprecated'}>
                        {version.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{version.isDefault ? '✓' : ''}</TableCell>
                    <TableCell>{version.fileCount}</TableCell>
                    <TableCell>{new Date(version.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => toggleVersionDetails(version.id)}
                        >
                          {expandedVersion === version.id ? 'Hide' : 'Show'} Files
                        </Button>
                        {!version.isDefault && (
                          <Button
                            size="sm"
                            onClick={() => setDefaultVersion(version.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        {version.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => updateVersionStatus(version.id, 'published')}
                          >
                            Publish
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedVersion === version.id && version.files && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-bg">
                        <div className="p-4">
                          <h4 className="font-heading mb-2">Files</h4>
                          {asset.type === 'material' ? (
                            // Material PBR Maps organized view
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {version.files.map((file) => (
                                <div key={file.id} className="border-2 border-border rounded-base p-3 bg-white">
                                  <div className="flex items-start justify-between mb-2">
                                    <strong className="font-heading">{file.fileName}</strong>
                                    {file.mapType && (
                                      <Badge variant="default" className="ml-2">
                                        {file.mapType}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-neutral-600 space-y-1">
                                    <div>Type: {file.contentType}</div>
                                    <div>Size: {(file.size / 1024).toFixed(2)} KB</div>
                                    <div className="break-all">Hash: <code className="text-xs">{file.hash}</code></div>
                                    <div className="mt-2">
                                      <a 
                                        href={`${baseUrl}/api/assets/file/${asset.key}/${version.version}/${file.fileName}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-main hover:underline"
                                      >
                                        Download ↗
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Generic file list view
                            <ul className="space-y-2">
                              {version.files.map((file) => (
                                <li key={file.id} className="border-l-2 border-border pl-3">
                                  <strong>{file.fileName}</strong>
                                  <br />
                                  <small className="text-neutral-600">
                                    Type: {file.contentType} | Size: {(file.size / 1024).toFixed(2)} KB
                                    <br />
                                    Hash: {file.hash}
                                    <br />
                                    URL:{' '}
                                    <code className="text-xs bg-white px-2 py-1 rounded-base border border-border">
                                      {baseUrl}/api/assets/file/{asset.key}/{version.version}/{file.fileName}
                                    </code>
                                  </small>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
