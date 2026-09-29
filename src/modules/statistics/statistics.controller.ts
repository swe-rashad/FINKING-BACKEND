import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { GetStatisticsDto } from './dto/get-statistics.dto';
import { ExportStatisticsDto } from './dto/export-statistics.dto';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Roles } from '@/common/decorators/roles.decorator';
import { UsersRoles } from '@/modules/users/types/users.type';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtPayload } from '@/modules/auth/types/auth.type';

const CACHE_TTL = 1 * 60 * 60 * 1000;

@ApiTags('Statistics')
@ApiBearerAuth('JWT-auth')
@Controller('statistics')
@CacheTTL(CACHE_TTL)
@UseInterceptors(CacheInterceptor)
@Roles(UsersRoles.Admin)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Post('export')
  exportStatistics(
    @Body() payload: ExportStatisticsDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.statisticsService.exportStatistics(payload, currentUser);
  }

  @Get('/revenue-overview')
  getRevenueOverview(@Query() payload: GetStatisticsDto) {
    return this.statisticsService.getRevenueOverview(payload);
  }

  @Get('/category-distribution')
  getCategoryDistribution(@Query() payload: GetStatisticsDto) {
    return this.statisticsService.getCategoryDistribution(payload);
  }

  @Get('/total-revenue')
  getTotalRevenue(@Query() payload: GetStatisticsDto) {
    return this.statisticsService.getTotalRevenue(payload);
  }

  @Get('/total-transactions')
  getTotalTransactions(@Query() payload: GetStatisticsDto) {
    return this.statisticsService.getTotalTransactions(payload);
  }

  @Get('/avarage-transaction-amount')
  getAvarageTransactionAmount(@Query() payload: GetStatisticsDto) {
    return this.statisticsService.getAverageTransactionAmount(payload);
  }

  @Get('/active-users')
  getActiveUsers(@Query() payload: GetStatisticsDto) {
    return this.statisticsService.getActiveUsers(payload);
  }

  @Get('/get-last-transactions')
  getLastTransactions(@Query() payload: GetStatisticsDto) {
    return this.statisticsService.getLastTransactions(payload);
  }
}
