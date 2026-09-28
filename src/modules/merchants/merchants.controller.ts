import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtPayload } from '@/modules/auth/types/auth.type';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permission.decorator';
import { UsersRoles } from '@/modules/users/types/users.type';

@ApiTags('Merchants')
@ApiBearerAuth('JWT-auth')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) { }

  @Get('/current')
  @Roles(UsersRoles.Admin, UsersRoles.Employee)
  @Permissions('merchant:read')
  getCurrentMerchant(@CurrentUser() user: JwtPayload) {
    return this.merchantsService.getCurrentMerchant(user);
  }

  @Patch('/current')
  @Roles(UsersRoles.Admin, UsersRoles.Employee)
  @Permissions('merchant:update')
  updateCurrentMerchant(
    @CurrentUser() user: JwtPayload,
    @Body() payload: UpdateMerchantDto,
  ) {
    return this.merchantsService.updateCurrentMerchant(user, payload);
  }
}
