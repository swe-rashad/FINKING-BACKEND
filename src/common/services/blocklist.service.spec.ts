import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BlocklistService, BLOCKLIST_PREFIX } from './blocklist.service';

describe('BlocklistService', () => {
  let service: BlocklistService;
  let cacheManager: { set: jest.Mock; get: jest.Mock };

  beforeEach(async () => {
    cacheManager = {
      set: jest.fn(),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocklistService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<BlocklistService>(BlocklistService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addToBlocklist', () => {
    it('should store jti in cache with ttl', async () => {
      const jti = 'test-uuid-jti';
      const ttlMs = 60000;

      await service.addToBlocklist(jti, ttlMs);

      expect(cacheManager.set).toHaveBeenCalledWith(
        `${BLOCKLIST_PREFIX}${jti}`,
        '1',
        ttlMs,
      );
    });
  });

  describe('isBlocked', () => {
    it('should return true when jti is present in cache', async () => {
      const jti = 'test-uuid-jti';
      cacheManager.get.mockResolvedValue('1');

      const result = await service.isBlocked(jti);

      expect(cacheManager.get).toHaveBeenCalledWith(`${BLOCKLIST_PREFIX}${jti}`);
      expect(result).toBe(true);
    });

    it('should return false when jti is not in cache', async () => {
      const jti = 'not-blocked-jti';
      cacheManager.get.mockResolvedValue(null);

      const result = await service.isBlocked(jti);

      expect(cacheManager.get).toHaveBeenCalledWith(`${BLOCKLIST_PREFIX}${jti}`);
      expect(result).toBe(false);
    });

    it('should return false when cache returns undefined', async () => {
      const jti = 'undefined-jti';
      cacheManager.get.mockResolvedValue(undefined);

      const result = await service.isBlocked(jti);

      expect(result).toBe(false);
    });
  });
});
