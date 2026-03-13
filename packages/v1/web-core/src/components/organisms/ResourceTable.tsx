import Link from 'next/link';

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

export type ResourceTableRow = {
  id: string;
  key: string;
  displayName: string;
  kind: string;
  activeVersion: number;
  thumbnailFileAssetId: string | null;
  versionsCount: number;
};

export type ResourceTablePagination = {
  page: number;
  totalPages: number;
  total: number;
  prevHref: string | null;
  nextHref: string | null;
};

export function ResourceTable({
  rows,
  emptyTitle,
  emptyHint,
  toolbar,
  viewHref,
  pagination,
}: {
  rows: ResourceTableRow[];
  emptyTitle: string;
  emptyHint?: React.ReactNode;
  toolbar?: React.ReactNode;
  viewHref?: (resourceId: string) => string;
  pagination?: ResourceTablePagination;
}) {
  const resolveViewHref = viewHref ?? ((id: string) => `/admin/resources/${id}`);

  return (
    <Card className="p-0">
      {toolbar ? (
        <div className="flex items-center justify-end gap-2 border-b border-border px-6 py-4">
          {toolbar}
        </div>
      ) : null}
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
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7}>
                <p className="text-neutral-600">{emptyTitle}</p>
                {emptyHint ? <div className="text-neutral-600 text-sm mt-1">{emptyHint}</div> : null}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  {r.thumbnailFileAssetId ? (
                    <img
                      src={`/api/files/${r.thumbnailFileAssetId}`}
                      alt={`${r.displayName} thumbnail`}
                      className="w-10 h-10 rounded-base border border-border object-cover bg-bg"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-base border border-border bg-bg" />
                  )}
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-bg px-2 py-1 rounded-base border border-border">{r.key}</code>
                </TableCell>
                <TableCell>{r.displayName}</TableCell>
                <TableCell>{r.versionsCount}</TableCell>
                <TableCell>
                  <Badge variant="default">{r.kind}</Badge>
                </TableCell>
                <TableCell>
                  <code className="text-xs">v{r.activeVersion}</code>
                </TableCell>
                <TableCell>
                  <Link href={resolveViewHref(r.id)} className="text-main underline">
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pagination ? (
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div className="text-sm text-neutral-600">
            Page <span className="font-bold text-black">{pagination.page}</span> of{' '}
            <span className="font-bold text-black">{pagination.totalPages}</span> ({pagination.total} total)
          </div>
          <div className="flex items-center gap-4">
            {pagination.prevHref ? (
              <Link href={pagination.prevHref} className="text-main underline font-bold">
                Prev
              </Link>
            ) : (
              <span className="text-neutral-400 font-bold">Prev</span>
            )}
            {pagination.nextHref ? (
              <Link href={pagination.nextHref} className="text-main underline font-bold">
                Next
              </Link>
            ) : (
              <span className="text-neutral-400 font-bold">Next</span>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
