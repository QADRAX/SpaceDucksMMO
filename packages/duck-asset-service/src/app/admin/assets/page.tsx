'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ParsedAssetWithVersionCount } from '@/lib/types';
import { PageHeader } from '@/components/organisms/PageHeader';
import { FilterBar } from '@/components/molecules/FilterBar';
import { Card } from '@/components/molecules/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/organisms/Table';
import { Badge } from '@/components/atoms/Badge';
import { Tag } from '@/components/atoms/Tag';
import { Button } from '@/components/atoms/Button';
import { DropdownMenu, DropdownMenuItem } from '@/components/molecules/DropdownMenu';
import { CreateAssetDialog } from '@/components/organisms';

export default function AssetsPage() {
  const [assets, setAssets] = useState<ParsedAssetWithVersionCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAssets();
  }, [typeFilter, categoryFilter, searchQuery]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (typeFilter) params.append('type', typeFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (searchQuery) params.append('query', searchQuery);

      const response = await fetch(`/api/admin/assets?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }

      const data = await response.json();
      setAssets(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const deleteAsset = async (assetId: string, displayName: string) => {
    if (!confirm(`Are you sure you want to delete "${displayName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/assets/${assetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAssets(); // Refresh the list
      } else {
        const data = await response.json();
        alert(`Failed to delete asset: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to delete asset:', err);
      alert('Failed to delete asset. Please try again.');
    }
  };

  return (
    <div>
      <PageHeader 
        title="Assets" 
        description="Manage your asset catalog"
        actions={
          <CreateAssetDialog onAssetCreated={fetchAssets} />
        }
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        className="mb-4"
      />

      {error && (
        <Card className="mb-4 bg-red-100 border-red-800">
          <p className="text-red-800 font-base">
            <strong>Error:</strong> {error}
          </p>
        </Card>
      )}

      {loading ? (
        <Card>
          <p className="text-center text-neutral-600 py-8">Loading assets...</p>
        </Card>
      ) : assets.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-neutral-600 mb-4">No assets found. Create your first asset to get started.</p>
            <CreateAssetDialog onAssetCreated={fetchAssets} />
          </div>
        </Card>
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Versions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    {asset.thumbnail ? (
                      <img 
                        src={`/api/assets/thumbnail/${asset.key}`} 
                        alt={asset.displayName}
                        className="w-16 h-16 object-cover rounded-base border-2 border-black"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-neutral-200 rounded-base border-2 border-black flex items-center justify-center text-2xl">
                        📦
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-bg px-2 py-1 rounded-base border border-border">
                      {asset.key}
                    </code>
                  </TableCell>
                  <TableCell>{asset.displayName}</TableCell>
                  <TableCell>
                    <Badge variant="default">{asset.type}</Badge>
                  </TableCell>
                  <TableCell>{asset.category}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {asset.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{asset.versionCount}</TableCell>
                  <TableCell>
                    <DropdownMenu
                      trigger={<Button size="sm" variant="ghost">⋮</Button>}
                    >
                      <DropdownMenuItem>
                        <Link href={`/admin/assets/${asset.id}`} className="w-full text-left">
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteAsset(asset.id, asset.displayName)}>
                        Delete Asset
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
