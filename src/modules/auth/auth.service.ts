import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import {
  JwtTokenTypeEnum,
  type JwtPayload,
  type SignInPayload,
  type SuccessAuthResponse,
} from './types/auth.type';
import { SignUpDto } from './dto/sign-up.dto';
import { UsersService } from '@/modules/users/users.service';
import { User } from '@/modules/users/entities/users.entity';
import { DataSource } from 'typeorm';
import { MerchantStatusEnum } from '../merchants/types/merchants.type';
import { UsersRoles, UserStatusEnum } from '../users/types/users.type';
import { Merchant } from '../merchants/entities/merchant.entity';
import { BlocklistService } from '@/common/services/blocklist.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly blocklistService: BlocklistService,
  ) { }

  private async generateTokens(user: User): Promise<SuccessAuthResponse> {
    const jti = randomUUID();

    const userData: Omit<JwtPayload, 'type'> = {
      jti,
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      merchantId: user.merchantId,
      merchantName: user.merchant?.merchantName,
      permissions: user.permissions,
    };

    const refreshTokenExpireIn = this.configService.get('refreshTokenExpireIn');
    const refreshTokenSecret = this.configService.get('jwtRefreshSecret');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ ...userData, type: JwtTokenTypeEnum.Access }),
      this.jwtService.signAsync(
        { ...userData, jti: randomUUID(), type: JwtTokenTypeEnum.Refresh },
        { expiresIn: refreshTokenExpireIn, secret: refreshTokenSecret },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async signUp(payload: SignUpDto): Promise<SuccessAuthResponse> {
    const existingUser = await this.usersService.findUserByEmail(payload.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.dataSource.transaction(async (manager) => {
      const merchantRepo = manager.getRepository(Merchant);
      const userRepo = manager.getRepository(User);

      const existingMerchant = await merchantRepo.findOne({
        where: { merchantName: payload.merchantName },
      });
      if (existingMerchant) {
        throw new ConflictException('Merchant with this name already exists');
      }
      const merchant = merchantRepo.create({
        merchantName: payload.merchantName,
        email: payload.email,
        status: MerchantStatusEnum.OtpActivation,
        verificated: false,
      });

      const savedMerchant = await merchantRepo.save(merchant);
      const salt = Number(this.configService.get<number>('salt')) || 10;
      const hashPass = await bcrypt.hash(payload.password, salt);

      const adminUser = userRepo.create({
        email: payload.email,
        password: hashPass,
        name: payload.name,
        lastname: payload.lastname,
        merchantId: savedMerchant.id,
        role: UsersRoles.Admin,
        status: UserStatusEnum.Active,
        verificated: true,
      });

      const savedUser = await userRepo.save(adminUser);
      savedUser.merchant = savedMerchant;
      return savedUser;
    });

    return await this.generateTokens(user);
  }

  async signIn(payload: SignInPayload): Promise<SuccessAuthResponse> {
    const user = await this.usersService.findUserByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatching = await bcrypt.compare(
      payload.password,
      user.password,
    );
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatusEnum.Blocked) {
      throw new ForbiddenException('Your account has been blocked');
    }

    if (user.status === UserStatusEnum.ForceChangePassword) {
      throw new ForbiddenException('You must change your password before continuing');
    }

    return await this.generateTokens(user);
  }

  async refreshToken(payload: JwtPayload): Promise<SuccessAuthResponse> {
    if (payload.type !== JwtTokenTypeEnum.Refresh) {
      throw new UnauthorizedException('Invalid token type');
    }

    if (payload.jti) {
      const isRevoked = await this.blocklistService.isBlocked(payload.jti);
      if (isRevoked) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }
    }

    const user = await this.usersService.findUserByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status === UserStatusEnum.Blocked) {
      throw new ForbiddenException('Your account has been blocked');
    }

    if (payload.jti) {
      const nowSec = Math.floor(Date.now() / 1000);
      const remainingMs = payload.exp
        ? Math.max((payload.exp - nowSec) * 1000, 0)
        : 7 * 24 * 60 * 60 * 1000;
      if (remainingMs > 0) {
        await this.blocklistService.addToBlocklist(payload.jti, remainingMs);
      }
    }

    return await this.generateTokens(user);
  }
}
