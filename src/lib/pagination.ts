const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;

type PaginationInput = {
  page?: unknown;
  limit?: unknown;
};

export type Pagination = {
  page: number;
  limit: number;
  skip: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export function getPagination(input: PaginationInput): Pagination {
  const page = Math.max(1, Number(input.page) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(input.limit) || DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPaginationMeta(params: {
  page: number;
  limit: number;
  total: number;
}): PaginationMeta {
  const { page, limit, total } = params;
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
