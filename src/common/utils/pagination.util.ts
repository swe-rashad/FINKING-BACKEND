import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../constants';
import { PaginationResponseData } from '../types/pagination.type';

export function calculatePagination(
  page: number = PAGINATION_PAGE,
  limit: number = PAGINATION_LIMIT,
) {
  const validPage = Math.max(1, page);
  const validLimit = Math.max(1, limit);
  const skip = (validPage - 1) * validLimit;
  return {
    page: validPage,
    limit: validLimit,
    skip,
    take: validLimit,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  page: number = PAGINATION_PAGE,
  limit: number = PAGINATION_LIMIT,
): PaginationResponseData<T> {
  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    data,
    total: totalItems,
    totalItems,
    page,
    limit,
    totalPages,
  };
}
