import { PageHeader } from '@/components/organisms/PageHeader';
import { ResourceTable } from '@/components/organisms/ResourceTable';
import { parsePage } from '@/lib/admin-utils';
import { fetchPagedResources } from '@/lib/services/resource-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function buildPageHref(page: number): string {
  return `/admin/resources?page=${page}`;
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = parsePage(resolvedSearchParams);

  const { items: rows, total, totalPages, hasPrev, hasNext } = await fetchPagedResources({
    page,
  });

  return (
    <div>
      <PageHeader title="Resources" description="All engine-facing resources (any kind)" />

      <ResourceTable
        rows={rows}
        emptyTitle="No resources yet."
        emptyHint={
          <>
            Create them via <code className="text-xs">POST /api/admin/resources</code>.
          </>
        }
        pagination={{
          page,
          totalPages,
          total,
          prevHref: hasPrev ? buildPageHref(page - 1) : null,
          nextHref: hasNext ? buildPageHref(page + 1) : null,
        }}
      />
    </div>
  );
}
