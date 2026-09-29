import { Injectable } from '@nestjs/common';
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
import { ensure } from '@/common/utils/assertion.util';
import { calculateTokenRemainingMs } from './utils/token.util';
import {
  AuthUserNotFoundException,
  InvalidCredentialsException,
  InvalidTokenTypeException,
  MerchantNameAlreadyExistsException,
  PasswordChangeRequiredException,
  TokenRevokedException,
  UserBlockedException,
  UserEmailAlreadyExistsException,
} from '@/common/exceptions';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly blocklistService: BlocklistService,
  ) { }

  private async revokeToken(jti?: string, exp?: number): Promise<void> {
    if (!jti) return;
    const remainingMs = calculateTokenRemainingMs(exp);
    if (remainingMs > 0) {
      await this.blocklistService.addToBlocklist(jti, remainingMs);
    }
  }

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
    ensure(!existingUser, new UserEmailAlreadyExistsException());

    const user = await this.dataSource.transaction(async (manager) => {
      const merchantRepo = manager.getRepository(Merchant);
      const userRepo = manager.getRepository(User);

      const existingMerchant = await merchantRepo.findOne({
        where: { merchantName: payload.merchantName },
      });
      ensure(!existingMerchant, new MerchantNameAlreadyExistsException());

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
    const isPasswordMatching = user
      ? await bcrypt.compare(payload.password, user.password)
      : false;

    ensure(user && isPasswordMatching, new InvalidCredentialsException());
    ensure(user.status !== UserStatusEnum.Blocked, new UserBlockedException());
    ensure(
      user.status !== UserStatusEnum.ForceChangePassword,
      new PasswordChangeRequiredException(),
    );

    return await this.generateTokens(user);
  }

  async refreshToken(payload: JwtPayload): Promise<SuccessAuthResponse> {
    ensure(
      payload.type === JwtTokenTypeEnum.Refresh,
      new InvalidTokenTypeException(),
    );

    if (payload.jti) {
      const isRevoked = await this.blocklistService.isBlocked(payload.jti);
      ensure(!isRevoked, new TokenRevokedException());
    }

    const user = await this.usersService.findUserByEmail(payload.email);
    ensure(user, new AuthUserNotFoundException());
    ensure(user.status !== UserStatusEnum.Blocked, new UserBlockedException());

    await this.revokeToken(payload.jti, payload.exp);

    return await this.generateTokens(user);
  }
}
