import { PageHeader } from '@/components/organisms/PageHeader';
import { ResourceTable } from '@/components/organisms/ResourceTable';
import { CreateEcsTreeDialog } from '@/components/organisms/resources/ecs-tree/CreateEcsTreeDialog';
import { parsePage } from '@/lib/admin-utils';
import { fetchPagedResources } from '@/lib/services/resource-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function buildPageHref(page: number): string {
  return `/admin/scenes?page=${page}`;
}

export default async function ScenesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = parsePage(resolvedSearchParams);

  const { items: rows, total, totalPages, hasPrev, hasNext } = await fetchPagedResources({
    page,
    kind: 'scene',
  });

  return (
    <div>
      <PageHeader title="Scenes" description="Versioned scene snapshots (ECS tree)" />

      <ResourceTable
        rows={rows}
        toolbar={<CreateEcsTreeDialog kind="scene" kindLabel="Scene" />}
        emptyTitle="No scenes yet."
        emptyHint={<>Create one to start editing and versioning.</>}
        viewHref={(id) => `/admin/scenes/${id}`}
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
