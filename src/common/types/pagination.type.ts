export type PaginationResponseData<T> = {
  data: T[];
  total: number;
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
};
