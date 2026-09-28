import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { MerchantsModule } from '@/modules/merchants/merchants.module';
import { UsersModule } from '@/modules/users/users.module';
import { BlocklistService } from '@/common/services/blocklist.service';

@Module({
  controllers: [AuthController],
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    MerchantsModule,
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, BlocklistService],
  exports: [PassportModule, JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule {}

