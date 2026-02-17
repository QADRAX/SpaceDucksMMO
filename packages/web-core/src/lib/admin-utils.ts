export function parsePage(searchParams: Record<string, string | string[] | undefined>): number {
    const raw = searchParams.page;
    const value = Array.isArray(raw) ? raw[0] : raw;
    const parsed = value ? Number.parseInt(value, 10) : 1;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
