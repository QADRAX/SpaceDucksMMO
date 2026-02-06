import Link from 'next/link';

import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/organisms/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Badge } from '@/components/atoms/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/organisms/Table';

import { MATERIAL_RESOURCE_KINDS } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MaterialsPage() {
  const materials = await prisma.resource.findMany({
    where: { kind: { in: [...MATERIAL_RESOURCE_KINDS] } },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { versions: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Materials"
        description="Resource-first materials catalog (versioned + bindable file assets)"
      />

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Versions</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <p className="text-neutral-600">No materials yet.</p>
                  <p className="text-neutral-600 text-sm mt-1">
                    Create them via <code className="text-xs">POST /api/admin/resources</code>.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              materials.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.thumbnailFileAssetId ? (
                      <img
                        src={`/api/files/${m.thumbnailFileAssetId}`}
                        alt={`${m.displayName} thumbnail`}
                        className="w-10 h-10 rounded-base border border-border object-cover bg-bg"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-base border border-border bg-bg" />
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-bg px-2 py-1 rounded-base border border-border">
                      {m.key}
                    </code>
                  </TableCell>
                  <TableCell>{m.displayName}</TableCell>
                  <TableCell>{m._count.versions}</TableCell>
                  <TableCell>
                    <Badge variant="default">{m.kind}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">v{m.activeVersion}</code>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/materials/${m.id}`}
                      className="text-main underline"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
