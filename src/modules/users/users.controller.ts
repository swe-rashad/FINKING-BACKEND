import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { UsersService } from './users.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtPayload } from '@/modules/auth/types/auth.type';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permission.decorator';
import { UsersRoles } from './types/users.type';

class BlockUserDto {
  @IsOptional()
  @IsString()
  accessToken?: string;
}

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('/create')
  @Roles(UsersRoles.Admin, UsersRoles.Employee)
  @Permissions('users:create')
  createUser(
    @Body() payload: CreateUserDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.userService.createUser(payload, currentUser);
  }

  @Get('')
  @Roles(UsersRoles.Admin, UsersRoles.Employee)
  @Permissions('users:read')
  getUsers(
    @Query() payload: GetUsersDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.userService.getUsers(payload, currentUser);
  }

  @Get('current')
  getCurrentUser(@CurrentUser() currentUser: JwtPayload) {
    return this.userService.getCurrentUser(currentUser);
  }

  @Get(':id')
  @Roles(UsersRoles.Admin, UsersRoles.Employee)
  @Permissions('users:read')
  getUserDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.userService.getUserDetail(id, currentUser);
  }

  @Delete(':id')
  @Roles(UsersRoles.Admin)
  @Permissions('users:delete')
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.userService.deleteUser(id, currentUser);
  }

  @Patch(':id')
  @Roles(UsersRoles.Admin)
  @Permissions('users:update')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() payload: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, currentUser, payload);
  }

  @Patch(':id/block')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UsersRoles.Admin)
  blockUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: BlockUserDto,
  ) {
    return this.userService.blockUser(id, currentUser, body.accessToken);
  }
}
