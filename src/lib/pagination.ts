export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PaginationParams = {
  page: number;
  pageSize: number;
  skip: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function parsePaginationSearchParams(
  searchParams: URLSearchParams,
  options?: { defaultPageSize?: number; maxPageSize?: number },
): PaginationParams {
  const defaultPageSize = options?.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const maxPageSize = options?.maxPageSize ?? MAX_PAGE_SIZE;

  const page = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);
  const requestedSize = Number(searchParams.get("pageSize")) || defaultPageSize;
  const pageSize = Math.min(maxPageSize, Math.max(1, requestedSize));
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
