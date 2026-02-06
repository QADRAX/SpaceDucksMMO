import Link from 'next/link';

import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/organisms/PageHeader';
import { Card } from '@/components/molecules/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/organisms/Table';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MaterialDetailPage({
  params,
}: {
  params: { materialId: string };
}) {
  const material = await prisma.resource.findUnique({
    where: { id: params.materialId },
  });

  if (!material) {
    return (
      <div>
        <PageHeader title="Material not found" />
        <Card>
          <p className="text-neutral-600">This material does not exist.</p>
          <p className="text-neutral-600 text-sm mt-2">
            <Link href="/admin/materials" className="text-main underline">
              Back to Materials
            </Link>
          </p>
        </Card>
      </div>
    );
  }

  const versions = await prisma.resourceVersion.findMany({
    where: { resourceId: material.id },
    orderBy: { version: 'desc' },
    include: { bindings: { include: { fileAsset: true } } },
  });

  return (
    <div>
      <PageHeader
        title={material.displayName}
        description={material.key}
        actions={
          <Link href="/admin/materials" className="text-main underline">
            Back
          </Link>
        }
      />

      <Card>
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
          <div>
            <span className="font-heading">Resource ID:</span> {material.id}
          </div>
          <div>
            <span className="font-heading">Engine resolve:</span>{' '}
            <code className="text-xs bg-bg px-2 py-1 rounded-base border border-border">
              /api/engine/resources/resolve?key={material.key}
            </code>
          </div>
          </div>

          <div>
            {material.thumbnailFileAssetId ? (
              <img
                src={`/api/files/${material.thumbnailFileAssetId}`}
                alt={`${material.displayName} thumbnail`}
                className="w-24 h-24 rounded-base border border-border object-cover bg-bg"
                loading="lazy"
              />
            ) : (
              <div className="w-24 h-24 rounded-base border border-border bg-bg" />
            )}
          </div>
        </div>
      </Card>

      <div className="h-6" />

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Component</TableHead>
              <TableHead>Bindings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <p className="text-neutral-600">No versions yet.</p>
                  <p className="text-neutral-600 text-sm mt-1">
                    Upload via <code className="text-xs">POST /api/admin/resources/{material.id}/versions</code>.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              versions.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.version}</TableCell>
                  <TableCell>{material.activeVersion === v.version ? '✓' : ''}</TableCell>
                  <TableCell>
                    <code className="text-xs">{v.componentType}</code>
                  </TableCell>
                  <TableCell>{v.bindings.length}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
