export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
    paginated: boolean;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    success: true;
    data: T[];
    pagination: PaginationMeta;
}

const SAFETY_LIMIT = 1000;

export const resolvePagination = (
    query: Record<string, unknown>,
    defaultLimit = 20,
    maxLimit = 100,
): PaginationParams => {
    const paginated = query.page !== undefined || query.limit !== undefined;
    const parsedPage = Number.parseInt(String(query.page ?? ''), 10);
    const parsedLimit = Number.parseInt(String(query.limit ?? ''), 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, maxLimit)
        : defaultLimit;

    return { page, limit, offset: (page - 1) * limit, paginated };
};

export const getSafetyLimit = (limit: number): number => Math.max(limit, SAFETY_LIMIT);

export const buildPaginationMeta = (
    page: number,
    limit: number,
    total: number,
): PaginationMeta => ({
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
});
