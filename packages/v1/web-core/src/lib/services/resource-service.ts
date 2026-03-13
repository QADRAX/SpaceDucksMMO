import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export type ResourceRow = {
    id: string;
    key: string;
    displayName: string;
    kind: string;
    activeVersion: number;
    thumbnailFileAssetId: string | null;
    versionsCount: number;
};

export type FetchResourcesOptions = {
    page?: number;
    pageSize?: number;
    kind?: string | string[];
    groupId?: string; // Optional: for unexpected grouping logic if needed in future
};

export type PagedResult<T> = {
    items: T[];
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
    hasPrev: boolean;
    hasNext: boolean;
};

export async function fetchPagedResources({
    page = 1,
    pageSize = 25,
    kind,
}: FetchResourcesOptions): Promise<PagedResult<ResourceRow>> {
    const skip = (page - 1) * pageSize;

    const where: Prisma.ResourceWhereInput = {};
    if (kind) {
        where.kind = Array.isArray(kind) ? { in: kind } : kind;
    }

    const [total, resources] = await Promise.all([
        prisma.resource.count({ where }),
        prisma.resource.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            skip,
            take: pageSize,
            include: { _count: { select: { versions: true } } },
        }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const items: ResourceRow[] = resources.map((r) => ({
        id: r.id,
        key: r.key,
        displayName: r.displayName,
        kind: r.kind,
        activeVersion: r.activeVersion,
        thumbnailFileAssetId: r.thumbnailFileAssetId ?? null,
        versionsCount: r._count.versions,
    }));

    return {
        items,
        total,
        totalPages,
        page,
        pageSize,
        hasPrev: page > 1,
        hasNext: page < totalPages,
    };
}
