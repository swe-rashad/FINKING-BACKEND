import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { GetStatisticsDto } from './dto/get-statistics.dto';
import { ExportStatisticsDto } from './dto/export-statistics.dto';
import { CacheTTL } from '@nestjs/cache-manager';
import { Roles } from '@/common/decorators/roles.decorator';
import { UsersRoles } from '@/modules/users/types/users.type';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtPayload } from '@/modules/auth/types/auth.type';

const CACHE_TTL = 1 * 60 * 60 * 1000;

@ApiTags('Statistics')
@ApiBearerAuth('JWT-auth')
@Controller('statistics')
@CacheTTL(CACHE_TTL)
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
  getRevenueOverview(
    @Query() payload: GetStatisticsDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.statisticsService.getRevenueOverview(payload, currentUser);
  }

  @Get('/category-distribution')
  getCategoryDistribution(
    @Query() payload: GetStatisticsDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.statisticsService.getCategoryDistribution(payload, currentUser);
  }

  @Get('/total-revenue')
  getTotalRevenue(
    @Query() payload: GetStatisticsDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.statisticsService.getTotalRevenue(payload, currentUser);
  }

  @Get('/total-transactions')
  getTotalTransactions(
    @Query() payload: GetStatisticsDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.statisticsService.getTotalTransactions(payload, currentUser);
  }

  @Get('/average-transaction-amount')
  getAverageTransactionAmount(
    @Query() payload: GetStatisticsDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.statisticsService.getAverageTransactionAmount(
      payload,
      currentUser,
    );
  }

  @Get('/active-users')
  getActiveUsers(
    @Query() payload: GetStatisticsDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.statisticsService.getActiveUsers(payload, currentUser);
  }

  @Get('/get-last-transactions')
  getLastTransactions(
    @Query() payload: GetStatisticsDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.statisticsService.getLastTransactions(payload, currentUser);
  }
}
