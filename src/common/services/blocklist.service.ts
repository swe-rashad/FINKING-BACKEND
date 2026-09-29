import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export const BLOCKLIST_PREFIX = 'blocklist:token:';

@Injectable()
export class BlocklistService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async addToBlocklist(jti: string, ttlMs: number): Promise<void> {
    await this.cacheManager.set(`${BLOCKLIST_PREFIX}${jti}`, '1', ttlMs);
  }

  async isBlocked(jti: string): Promise<boolean> {
    const value = await this.cacheManager.get(`${BLOCKLIST_PREFIX}${jti}`);
    return value !== null && value !== undefined;
  }
}
