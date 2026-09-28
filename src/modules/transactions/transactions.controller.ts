import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TransactionsService } from '@/modules/transactions/transactions.service';
import { GetTransactionsDto } from '@/modules/transactions/dto/get-transactions.dto';
import { ExportTransactionsDto } from './dto/export-transactions.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permission.decorator';
import { UsersRoles } from '@/modules/users/types/users.type';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtPayload } from '@/modules/auth/types/auth.type';

@ApiTags('Transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Get('')
  @UseInterceptors(ClassSerializerInterceptor)
  @Roles(UsersRoles.Admin, UsersRoles.Employee, UsersRoles.Customer)
  @Permissions('transactions:read')
  getTransactions(@Query() payload: GetTransactionsDto) {
    return this.transactionsService.getTransactions(payload);
  }

  @Post('export')
  @Roles(UsersRoles.Admin)
  @Permissions('transactions:read')
  exportTransactions(
    @Body() payload: ExportTransactionsDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.transactionsService.exportTransactions(payload, currentUser);
  }

  @Get(':id')
  @Roles(UsersRoles.Admin, UsersRoles.Employee, UsersRoles.Customer)
  @Permissions('transactions:read')
  getTransactionDetails(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.getTransactionDetails(id);
  }
}
