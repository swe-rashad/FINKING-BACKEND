import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactions } from '@/modules/transactions/entities/transaction.entity';
import { GetStatisticsDto } from './dto/get-statistics.dto';
import { ExportStatisticsDto } from './dto/export-statistics.dto';
import type { JwtPayload } from '@/modules/auth/types/auth.type';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { resolveDateRange, validateDateRange } from '@/common/utils/date-range.util';
import {
  CategoryDistributionStatisticsDataType,
  RevenuePeriodEnum,
  RevenuePeriodEnumType,
  RevenueStatisticsDataType,
} from './types/statistics.type';
import { TransactionTypeEnumType } from '@/modules/transactions/types';

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

  private getRevenuePeriod(
    startDate: Date,
    endDate: Date,
  ): RevenuePeriodEnumType {
    const diffInDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffInDays <= 31) {
      return RevenuePeriodEnum.Weekly;
    }

    if (diffInDays <= 365) {
      return RevenuePeriodEnum.Monthly;
    }

    return RevenuePeriodEnum.Yearly;
  }

  async getRevenueOverview(
    payload: GetStatisticsDto,
  ): Promise<RevenueStatisticsDataType> {
    const { startDate, endDate } = this.getDateRange(payload);
    const period = this.getRevenuePeriod(startDate, endDate);

    const dateExpr =
      period === RevenuePeriodEnum.Weekly
        ? "TO_CHAR(DATE_TRUNC('week', transaction.dateOfOperation), 'YYYY-MM-DD')"
        : period === RevenuePeriodEnum.Yearly
          ? "TO_CHAR(transaction.dateOfOperation, 'YYYY')"
          : "TO_CHAR(transaction.dateOfOperation, 'YYYY-MM')";

    const rawData = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select(dateExpr, 'date')
      .addSelect('transaction.currency', 'currency')
      .addSelect('COALESCE(SUM(transaction.amount), 0)', 'value')
      .where('transaction.dateOfOperation BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy(dateExpr)
      .addGroupBy('transaction.currency')
      .orderBy(dateExpr, 'ASC')
      .addOrderBy('transaction.currency', 'ASC')
      .getRawMany<{ date: string; currency: any; value: string | number }>();

    const data = rawData.map((item) => ({
      date: item.date,
      currency: item.currency,
      value: Number(Number(item.value).toFixed(2)),
    }));

    return {
      period,
      data,
    };
  }

  async getCategoryDistribution(
    payload: GetStatisticsDto,
  ): Promise<CategoryDistributionStatisticsDataType> {
    const { startDate, endDate } = this.getDateRange(payload);

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
      .groupBy('transaction.type')
      .getRawMany<{
        type: TransactionTypeEnumType;
        value: string | number;
        transactionsCount: string | number;
      }>();

    const data = rawData.map((item) => ({
      type: item.type,
      value: Number(Number(item.value).toFixed(2)),
      transactionsCount: Number(item.transactionsCount),
    }));

    const totalTransactions = data.reduce(
      (sum, item) => sum + item.transactionsCount,
      0,
    );

    return {
      totalTransactions,
      data,
    };
  }

  async getTotalRevenue(payload: GetStatisticsDto): Promise<{ value: number }> {
    const { startDate, endDate } = this.getDateRange(payload);

    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COALESCE(SUM(transaction.amount), 0)', 'totalRevenue')
      .where('transaction.dateOfOperation BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne<{ totalRevenue: string | number }>();

    return {
      value: Number(Number(result?.totalRevenue ?? 0).toFixed(2)),
    };
  }

  async getTotalTransactions(
    payload: GetStatisticsDto,
  ): Promise<{ value: number }> {
    const { startDate, endDate } = this.getDateRange(payload);

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
      .getRawOne<{ totalTransactions: string | number }>();

    return {
      value: Number(result?.totalTransactions ?? 0),
    };
  }

  async getAverageTransactionAmount(
    payload: GetStatisticsDto,
  ): Promise<{ value: number }> {
    const { startDate, endDate } = this.getDateRange(payload);

    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COALESCE(AVG(transaction.amount), 0)', 'averageAmount')
      .where('transaction.dateOfOperation BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne<{ averageAmount: string | number }>();

    return {
      value: Number(Number(result?.averageAmount ?? 0).toFixed(2)),
    };
  }

  async getActiveUsers(payload: GetStatisticsDto): Promise<{ value: number }> {
    const { startDate, endDate } = this.getDateRange(payload);

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
      .getRawOne<{ activeUsersCount: string | number }>();

    return {
      value: Number(result?.activeUsersCount ?? 0),
    };
  }

  async getLastTransactions(
    payload: GetStatisticsDto,
  ): Promise<Transactions[]> {
    const { dateRange } = this.getDateRange(payload);

    return this.transactionRepository.find({
      where: {
        dateOfOperation: dateRange,
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

    const recipientEmail = dto.email || currentUser.email;

    await this.exportQueue.add('export-statistics', {
      recipientEmail,
      filters: {
        startDate: dto.startDate ? new Date(dto.startDate).toISOString() : undefined,
        endDate: dto.endDate ? new Date(dto.endDate).toISOString() : undefined,
      },
    });

    return {
      message: 'Statistics export report generation started. File will be sent to your email.',
      recipientEmail,
    };
  }
}
