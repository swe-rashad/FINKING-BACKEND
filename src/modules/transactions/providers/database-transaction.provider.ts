import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

import { TransactionProvider } from '@/modules/transactions/providers/transaction.provider';
import { Transactions } from '@/modules/transactions/entities/transaction.entity';
import { GetTransactionsDto } from '@/modules/transactions/dto/get-transactions.dto';
import { PaginationResponseData } from '@/common/types/pagination.type';
import {
  calculatePagination,
  createPaginatedResponse,
} from '@/common/utils/pagination.util';

@Injectable()
export class DatabaseTransactionProvider implements TransactionProvider {
  constructor(
    @InjectRepository(Transactions)
    private readonly transactionRepository: Repository<Transactions>,
  ) {}

  async getTransactions(
    payload: GetTransactionsDto,
    where?: Record<string, string>,
  ): Promise<PaginationResponseData<Transactions>> {
    const { page, limit, skip, take } = calculatePagination(
      payload.page,
      payload.limit,
    );

    const whereConditions: FindOptionsWhere<Transactions> = {
      ...(where as FindOptionsWhere<Transactions>),
    };

    if (payload.sender) {
      whereConditions.sender = ILike(`%${payload.sender}%`);
    }
    if (payload.receiver) {
      whereConditions.receiver = ILike(`%${payload.receiver}%`);
    }
    if (payload.merchantName) {
      whereConditions.merchantName = ILike(`%${payload.merchantName}%`);
    }
    if (payload.currency) {
      whereConditions.currency = payload.currency;
    }
    if (payload.type) {
      whereConditions.type = payload.type;
    }
    if (payload.status) {
      whereConditions.status = payload.status;
    }
    if (payload.rrn !== undefined) {
      whereConditions.rrn = String(payload.rrn);
    }
    if (payload.operationId !== undefined) {
      whereConditions.operationId = payload.operationId;
    }
    if (payload.mcc !== undefined) {
      whereConditions.mcc = payload.mcc;
    }
    if (payload.merchantId !== undefined) {
      whereConditions.merchantId = payload.merchantId;
    }
    if (payload.terminalId) {
      whereConditions.terminalId = payload.terminalId;
    }
    if (payload.dateFrom && payload.dateTo) {
      whereConditions.dateOfOperation = Between(
        new Date(payload.dateFrom),
        new Date(payload.dateTo),
      );
    } else if (payload.dateFrom) {
      whereConditions.dateOfOperation = MoreThanOrEqual(
        new Date(payload.dateFrom),
      );
    } else if (payload.dateTo) {
      whereConditions.dateOfOperation = LessThanOrEqual(
        new Date(payload.dateTo),
      );
    }

    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        take,
        skip,
        where: whereConditions,
        order: {
          dateOfOperation: 'DESC',
        },
      },
    );

    return createPaginatedResponse(transactions, total, page, limit);
  }
}
