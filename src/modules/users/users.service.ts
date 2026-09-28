import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import {
  Repository,
  DeleteResult,
  UpdateResult,
  FindOptionsWhere,
  ILike,
  Not,
} from 'typeorm';
import { PaginationResponseData } from '@/common/types/pagination.type';
import {
  calculatePagination,
  createPaginatedResponse,
} from '@/common/utils/pagination.util';
import { UserNotFoundException } from './exceptions/userNotFound.exception';
import { JwtPayload } from '@/modules/auth/types/auth.type';
import { GetUsersDto } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRoles, UserStatusEnum } from './types/users.type';
import { BlocklistService } from '@/common/services/blocklist.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly blocklistService: BlocklistService,
    private readonly jwtService: JwtService,
  ) { }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: {
        merchant: true,
      },
    });
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.findUserByEmail(email);
    if (user) return user;
    throw new UserNotFoundException();
  }

  async getUsers(
    payload: GetUsersDto,
    currentUser?: JwtPayload,
  ): Promise<PaginationResponseData<User>> {
    const { page, limit, skip, take } = calculatePagination(
      payload.page,
      payload.limit,
    );

    const merchantId = currentUser
      ? (currentUser.merchantId ?? currentUser.sub)
      : payload.merchantId;

    const baseWhere: FindOptionsWhere<User> = {};

    if (payload.email) {
      baseWhere.email = ILike(`%${payload.email}%`);
    }
    if (payload.role && payload.role !== UsersRoles.Admin) {
      baseWhere.role = payload.role;
    } else {
      baseWhere.role = Not(UsersRoles.Admin);
    }
    if (payload.status) {
      baseWhere.status = payload.status;
    }
    if (merchantId) {
      baseWhere.merchantId = merchantId;
    }

    const where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = payload.name
      ? [
        { ...baseWhere, name: ILike(`%${payload.name}%`) },
        { ...baseWhere, lastname: ILike(`%${payload.name}%`) },
      ]
      : baseWhere;

    const [users, total] = await this.usersRepository.findAndCount({
      where,
      relations: {
        merchant: true,
      },
      order: {
        id: 'DESC',
      },
      skip,
      take,
    });

    return createPaginatedResponse(users, total, page, limit);
  }

  async createAdminUser(data: {
    email: string;
    password: string;
    name: string;
    lastname: string;
    merchantId: number;
  }): Promise<User> {
    const salt = Number(this.configService.get<number>('salt')) || 10;
    const hashPass = await bcrypt.hash(data.password, salt);

    const user = this.usersRepository.create({
      email: data.email,
      name: data.name,
      lastname: data.lastname,
      password: hashPass,
      merchantId: data.merchantId,
      role: UsersRoles.Admin,
      status: UserStatusEnum.Active,
      verificated: true,
    });

    return await this.usersRepository.save(user);
  }

  async createUser(
    payload: CreateUserDto,
    currentUser?: JwtPayload,
  ): Promise<User> {
    const existing = await this.findUserByEmail(payload.email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    if (payload.role === UsersRoles.Admin) {
      throw new BadRequestException('Cannot create user with admin role');
    }

    const salt = Number(this.configService.get<number>('salt')) || 10;
    const hashPass = await bcrypt.hash(payload.password, salt);
    const merchantId = currentUser
      ? (currentUser.merchantId ?? currentUser.sub)
      : payload.merchantId;

    const user = this.usersRepository.create({
      ...payload,
      role: payload.role ?? UsersRoles.Employee,
      merchantId,
      password: hashPass,
    });

    await this.usersRepository.save(user);
    return user;
  }

  async getUserDetail(
    id: number,
    currentUser?: JwtPayload | number,
  ): Promise<User | null> {
    const merchantId =
      typeof currentUser === 'object'
        ? (currentUser.merchantId ?? currentUser.sub)
        : currentUser;

    const whereConditions: FindOptionsWhere<User> = { id };
    if (merchantId) {
      whereConditions.merchantId = merchantId;
    }
    const user = await this.usersRepository.findOne({
      where: whereConditions,
      relations: {
        merchant: true,
      },
    });
    if (user) return user;
    throw new UserNotFoundException();
  }

  async deleteUser(
    id: number,
    currentUser?: JwtPayload | number,
  ): Promise<DeleteResult> {
    const merchantId =
      typeof currentUser === 'object'
        ? (currentUser.merchantId ?? currentUser.sub)
        : currentUser;

    const whereConditions: FindOptionsWhere<User> = { id };
    if (merchantId) {
      whereConditions.merchantId = merchantId;
    }
    return this.usersRepository.delete(whereConditions);
  }

  async getCurrentUser(payload: JwtPayload): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        id: payload.sub,
      },
      relations: {
        merchant: true,
      },
    });

    if (user) return user;

    throw new UserNotFoundException();
  }

  async updateUser(
    id: number,
    currentUser: JwtPayload,
    payload: UpdateUserDto,
  ): Promise<UpdateResult> {
    if (payload.role === UsersRoles.Admin) {
      throw new BadRequestException('Cannot change role to admin');
    }

    const merchantId = currentUser?.merchantId;
    const whereConditions: FindOptionsWhere<User> = { id };
    if (merchantId) {
      whereConditions.merchantId = merchantId;
    }
    return await this.usersRepository.update(whereConditions, payload);
  }

  async blockUser(
    id: number,
    currentUser: JwtPayload,
    accessToken?: string,
  ): Promise<void> {
    const merchantId = currentUser?.merchantId;
    const whereConditions: FindOptionsWhere<User> = { id };
    if (merchantId) {
      whereConditions.merchantId = merchantId;
    }

    const user = await this.usersRepository.findOne({ where: whereConditions });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UsersRoles.Admin) {
      throw new ForbiddenException('Cannot block an admin user');
    }

    if (user.status === UserStatusEnum.Blocked) {
      throw new BadRequestException('User is already blocked');
    }

    await this.usersRepository.update(whereConditions, {
      status: UserStatusEnum.Blocked,
    });

    if (accessToken) {
      try {
        const accessSecret = this.configService.get<string>('jwtAccessSecret');
        const decoded = this.jwtService.verify<JwtPayload>(accessToken, {
          secret: accessSecret,
        });
        if (decoded?.jti && decoded?.exp) {
          const nowSec = Math.floor(Date.now() / 1000);
          const remainingMs = (decoded.exp - nowSec) * 1000;
          if (remainingMs > 0) {
            await this.blocklistService.addToBlocklist(decoded.jti, remainingMs);
          }
        }
      } catch {
      }
    }
  }
}
