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

export default async function ResourceDetailPage({
  params,
}: {
  params: { resourceId: string };
}) {
  const resource = await prisma.resource.findUnique({
    where: { id: params.resourceId },
  });

  if (!resource) {
    return (
      <div>
        <PageHeader title="Resource not found" />
        <Card>
          <p className="text-neutral-600">This resource does not exist.</p>
          <p className="text-neutral-600 text-sm mt-2">
            <Link href="/admin/resources" className="text-main underline">
              Back to Resources
            </Link>
          </p>
        </Card>
      </div>
    );
  }

  const versions = await prisma.resourceVersion.findMany({
    where: { resourceId: resource.id },
    orderBy: { version: 'desc' },
    include: { bindings: { include: { fileAsset: true } } },
  });

  return (
    <div>
      <PageHeader
        title={resource.displayName}
        description={resource.key}
        actions={
          <Link href="/admin/resources" className="text-main underline">
            Back
          </Link>
        }
      />

      <Card>
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <div>
              <span className="font-heading">Resource ID:</span> {resource.id}
            </div>
            <div>
              <span className="font-heading">Kind:</span> <code className="text-xs">{resource.kind}</code>
            </div>
            <div>
              <span className="font-heading">Engine resolve:</span>{' '}
              <code className="text-xs bg-bg px-2 py-1 rounded-base border border-border">
                /api/engine/resources/resolve?key={resource.key}
              </code>
            </div>
          </div>

          <div>
            {resource.thumbnailFileAssetId ? (
              <img
                src={`/api/files/${resource.thumbnailFileAssetId}`}
                alt={`${resource.displayName} thumbnail`}
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
                    Upload via{' '}
                    <code className="text-xs">POST /api/admin/resources/{resource.id}/versions</code>.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              versions.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.version}</TableCell>
                  <TableCell>{resource.activeVersion === v.version ? '✓' : ''}</TableCell>
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
