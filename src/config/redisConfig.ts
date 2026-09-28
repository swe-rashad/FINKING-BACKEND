import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';

export const RedisOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const host = configService.get<string>('REDIS_HOST') || 'localhost';
    const port = configService.get<string>('REDIS_PORT') || '6379';

    return {
      stores: [createKeyv(`redis://${host}:${port}`)],
    };
  },
  inject: [ConfigService],
};
