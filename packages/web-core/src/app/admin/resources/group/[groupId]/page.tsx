import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/organisms/PageHeader';
import { ResourceTable } from '@/components/organisms/ResourceTable';
import { getResourceGroup } from '@/lib/resourceGroups';
import { parsePage } from '@/lib/admin-utils';
import { fetchPagedResources } from '@/lib/services/resource-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function buildPageHref(groupId: string, page: number): string {
  return `/admin/resources/group/${groupId}?page=${page}`;
}

export default async function ResourceGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { groupId } = await params;
  const resolvedSearchParams = await searchParams;

  const group = getResourceGroup(groupId);
  if (!group) notFound();

  const page = parsePage(resolvedSearchParams);

  const { items: rows, total, totalPages, hasPrev, hasNext } = await fetchPagedResources({
    page,
    kind: [...group.kinds],
  });

  return (
    <div>
      <PageHeader
        title={group.label}
        description="Resources filtered by group"
        actions={
          <Link href="/admin/resources" className="text-main underline">
            Back to Resources
          </Link>
        }
      />

      <ResourceTable
        rows={rows}
        emptyTitle={`No ${group.label.toLowerCase()} yet.`}
        emptyHint={
          <>
            Create them via <code className="text-xs">POST /api/admin/resources</code>.
          </>
        }
        pagination={{
          page,
          totalPages,
          total,
          prevHref: hasPrev ? buildPageHref(group.id, page - 1) : null,
          nextHref: hasNext ? buildPageHref(group.id, page + 1) : null,
        }}
      />
    </div>
  );
}
