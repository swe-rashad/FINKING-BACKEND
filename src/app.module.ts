import { Module, NestModule } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permission.guard';
import { BlocklistService } from './common/services/blocklist.service';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { DatabaseModule } from './database/database.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { ExportModule } from './modules/export/export.module';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { RedisOptions } from './config/redisConfig';
import { MiddlewareConsumer } from '@nestjs/common';
import { TraceIdMiddleware } from './common/middlewares/traceId.middleware';

@Module({
  imports: [
    CacheModule.registerAsync(RedisOptions),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: Number(configService.get<number>('REDIS_PORT')),
        },
      }),
    }),
    ConfigModule.forRoot({
      envFilePath: ['.env.development.local', '.env.local', '.env'],
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    MerchantsModule,
    TransactionsModule,
    StatisticsModule,
    ExportModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: configuration().jwtAccessSecret,
        signOptions: {
          expiresIn: '1d',
        },
      }),
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    BlocklistService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
