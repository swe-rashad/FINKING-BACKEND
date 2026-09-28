import {
  calculatePagination,
  createPaginatedResponse,
} from './pagination.util';
import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../constants';

describe('Pagination Utilities', () => {
  describe('calculatePagination', () => {
    it('should use default values when no parameters are provided', () => {
      const result = calculatePagination();

      expect(result).toEqual({
        page: PAGINATION_PAGE,
        limit: PAGINATION_LIMIT,
        skip: (PAGINATION_PAGE - 1) * PAGINATION_LIMIT,
        take: PAGINATION_LIMIT,
      });
    });

    it('should calculate correct skip and take for given page and limit', () => {
      const page = 3;
      const limit = 20;
      const result = calculatePagination(page, limit);

      expect(result).toEqual({
        page: 3,
        limit: 20,
        skip: 40,
        take: 20,
      });
    });

    it('should clamp page to minimum of 1 if page is <= 0', () => {
      const resultZero = calculatePagination(0, 10);
      expect(resultZero.page).toBe(1);
      expect(resultZero.skip).toBe(0);

      const resultNegative = calculatePagination(-5, 10);
      expect(resultNegative.page).toBe(1);
      expect(resultNegative.skip).toBe(0);
    });

    it('should clamp limit to minimum of 1 if limit is <= 0', () => {
      const resultZero = calculatePagination(1, 0);
      expect(resultZero.limit).toBe(1);
      expect(resultZero.take).toBe(1);

      const resultNegative = calculatePagination(1, -10);
      expect(resultNegative.limit).toBe(1);
      expect(resultNegative.take).toBe(1);
    });
  });

  describe('createPaginatedResponse', () => {
    it('should return correct paginated response structure with items', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const totalItems = 50;
      const page = 2;
      const limit = 10;

      const response = createPaginatedResponse(items, totalItems, page, limit);

      expect(response).toEqual({
        data: items,
        total: 50,
        totalItems: 50,
        page: 2,
        limit: 10,
        totalPages: 5,
      });
    });

    it('should calculate totalPages correctly with remainder', () => {
      const items = [{ id: 1 }];
      const totalItems = 25;
      const page = 1;
      const limit = 10;

      const response = createPaginatedResponse(items, totalItems, page, limit);

      expect(response.totalPages).toBe(3); // Math.ceil(25 / 10) = 3
    });

    it('should return at least 1 totalPage even if totalItems is 0', () => {
      const items: unknown[] = [];
      const totalItems = 0;

      const response = createPaginatedResponse(items, totalItems);

      expect(response.totalPages).toBe(1);
      expect(response.totalItems).toBe(0);
      expect(response.data).toEqual([]);
    });

    it('should fallback to default page and limit when omitted', () => {
      const items = [{ id: 1 }];
      const response = createPaginatedResponse(items, 10);

      expect(response.page).toBe(PAGINATION_PAGE);
      expect(response.limit).toBe(PAGINATION_LIMIT);
    });
  });
});
