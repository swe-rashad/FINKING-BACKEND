import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactions } from '@/modules/transactions/entities/transaction.entity';
import { GetStatisticsDto } from './dto/get-statistics.dto';
import { ExportStatisticsDto } from './dto/export-statistics.dto';
import type { JwtPayload } from '@/modules/auth/types/auth.type';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  resolveDateRange,
  validateDateRange,
} from '@/common/utils/date-range.util';
import {
  CategoryDistributionStatisticsDataType,
  RevenueStatisticsDataType,
} from './types/statistics.type';
import {
  CurrencyEnumType,
  TransactionTypeEnumType,
} from '@/modules/transactions/types';
import { StatisticsCalculatorHelper } from './helpers/statistics-calculator.helper';
import { MerchantNotFoundException } from '@/common/exceptions';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Transactions)
    private readonly transactionRepository: Repository<Transactions>,
    @InjectQueue('export-queue')
    private readonly exportQueue: Queue,
  ) {}

  private getDateRange(payload: GetStatisticsDto) {
    return resolveDateRange(payload);
  }

  private resolveMerchantId(
    currentUser: Pick<JwtPayload, 'merchantId'>,
  ): number {
    const merchantId = currentUser.merchantId;
    if (merchantId == null) {
      throw new MerchantNotFoundException();
    }
    return merchantId;
  }

  async getRevenueOverview(
    payload: GetStatisticsDto,
    currentUser: Pick<JwtPayload, 'merchantId'>,
  ): Promise<RevenueStatisticsDataType> {
    const { startDate, endDate } = this.getDateRange(payload);
    const merchantId = this.resolveMerchantId(currentUser);
    const period = StatisticsCalculatorHelper.getRevenuePeriod(
      startDate,
      endDate,
    );
    const dateExpr = StatisticsCalculatorHelper.getDateExpression(period);

    const rawData = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select(dateExpr, 'date')
      .addSelect('transaction.currency', 'currency')
      .addSelect('COALESCE(SUM(transaction.amount), 0)', 'value')
      .where('transaction.dateOfOperation BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('transaction.merchantId = :merchantId', { merchantId })
      .groupBy(dateExpr)
      .addGroupBy('transaction.currency')
      .orderBy(dateExpr, 'ASC')
      .addOrderBy('transaction.currency', 'ASC')
      .getRawMany<{
        date: string;
        currency: CurrencyEnumType;
        value: string | number;
      }>();

    const data = StatisticsCalculatorHelper.formatRevenueData(rawData);

    return {
      period,
      data,
    };
  }

  async getCategoryDistribution(
    payload: GetStatisticsDto,
    currentUser: Pick<JwtPayload, 'merchantId'>,
  ): Promise<CategoryDistributionStatisticsDataType> {
    const { startDate, endDate } = this.getDateRange(payload);
    const merchantId = this.resolveMerchantId(currentUser);

    const rawData = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.type', 'type')
      .addSelect('COALESCE(SUM(transaction.amount), 0)', 'value')
      .addSelect(
        'COALESCE(COUNT(transaction.transactionId), 0)',
        'transactionsCount',
      )
      .where('transaction.dateOfOperation BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('transaction.merchantId = :merchantId', { merchantId })
      .groupBy('transaction.type')
      .getRawMany<{
        type: TransactionTypeEnumType;
        value: string | number;
        transactionsCount: string | number;
      }>();

    return StatisticsCalculatorHelper.formatCategoryDistributionData(rawData);
  }

  async getTotalRevenue(
    payload: GetStatisticsDto,
    currentUser: Pick<JwtPayload, 'merchantId'>,
  ): Promise<{ value: number }> {
    const { startDate, endDate } = this.getDateRange(payload);
    const merchantId = this.resolveMerchantId(currentUser);

    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COALESCE(SUM(transaction.amount), 0)', 'totalRevenue')
      .where('transaction.dateOfOperation BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('transaction.merchantId = :merchantId', { merchantId })
      .getRawOne<{ totalRevenue: string | number }>();

    return {
      value: StatisticsCalculatorHelper.formatAmount(result?.totalRevenue),
    };
  }

  async getTotalTransactions(
    payload: GetStatisticsDto,
    currentUser: Pick<JwtPayload, 'merchantId'>,
  ): Promise<{ value: number }> {
    const { startDate, endDate } = this.getDateRange(payload);
    const merchantId = this.resolveMerchantId(currentUser);

    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select(
        'COALESCE(COUNT(transaction.transactionId), 0)',
        'totalTransactions',
      )
      .where('transaction.dateOfOperation BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('transaction.merchantId = :merchantId', { merchantId })
      .getRawOne<{ totalTransactions: string | number }>();

    return {
      value: StatisticsCalculatorHelper.parseCount(result?.totalTransactions),
    };
  }

  async getAverageTransactionAmount(
    payload: GetStatisticsDto,
    currentUser: Pick<JwtPayload, 'merchantId'>,
  ): Promise<{ value: number }> {
    const { startDate, endDate } = this.getDateRange(payload);
    const merchantId = this.resolveMerchantId(currentUser);

    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COALESCE(AVG(transaction.amount), 0)', 'averageAmount')
      .where('transaction.dateOfOperation BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('transaction.merchantId = :merchantId', { merchantId })
      .getRawOne<{ averageAmount: string | number }>();

    return {
      value: StatisticsCalculatorHelper.formatAmount(result?.averageAmount),
    };
  }

  async getActiveUsers(
    payload: GetStatisticsDto,
    currentUser: Pick<JwtPayload, 'merchantId'>,
  ): Promise<{ value: number }> {
    const { startDate, endDate } = this.getDateRange(payload);
    const merchantId = this.resolveMerchantId(currentUser);

    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select(
        'COALESCE(COUNT(DISTINCT transaction.sender), 0)',
        'activeUsersCount',
      )
      .where('transaction.dateOfOperation BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('transaction.merchantId = :merchantId', { merchantId })
      .getRawOne<{ activeUsersCount: string | number }>();

    return {
      value: StatisticsCalculatorHelper.parseCount(result?.activeUsersCount),
    };
  }

  async getLastTransactions(
    payload: GetStatisticsDto,
    currentUser: Pick<JwtPayload, 'merchantId'>,
  ): Promise<Transactions[]> {
    const { dateRange } = this.getDateRange(payload);
    const merchantId = this.resolveMerchantId(currentUser);

    return this.transactionRepository.find({
      where: {
        dateOfOperation: dateRange,
        merchantId,
      },
      order: {
        dateOfOperation: 'DESC',
      },
      take: 3,
    });
  }

  async exportStatistics(
    dto: ExportStatisticsDto,
    currentUser: JwtPayload,
  ): Promise<{ message: string; recipientEmail: string }> {
    validateDateRange(dto.startDate, dto.endDate);
    const merchantId = this.resolveMerchantId(currentUser);

    const recipientEmail = dto.email || currentUser.email;

    await this.exportQueue.add('export-statistics', {
      recipientEmail,
      merchantId,
      filters: {
        startDate: dto.startDate
          ? new Date(dto.startDate).toISOString()
          : undefined,
        endDate: dto.endDate ? new Date(dto.endDate).toISOString() : undefined,
      },
    });

    return {
      message:
        'Statistics export report generation started. File will be sent to your email.',
      recipientEmail,
    };
  }
}
