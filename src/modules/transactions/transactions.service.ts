import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactions } from '@/modules/transactions/entities/transaction.entity';
import { Repository } from 'typeorm';
import { DatabaseTransactionProvider } from '@/modules/transactions/providers/database-transaction.provider';
import { GetTransactionsDto } from '@/modules/transactions/dto/get-transactions.dto';
import { ExportTransactionsDto } from './dto/export-transactions.dto';
import type { JwtPayload } from '@/modules/auth/types/auth.type';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { validateDateRange } from '@/common/utils/date-range.util';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsProvider: DatabaseTransactionProvider,
    @InjectRepository(Transactions)
    private readonly transactionRepository: Repository<Transactions>,
    @InjectQueue('export-queue')
    private readonly exportQueue: Queue,
  ) {}

  async getTransactionDetails(payload: number): Promise<Transactions | null> {
    const transaction = await this.transactionRepository.findOne({
      where: {
        transactionId: payload,
      },
    });

    if (transaction) return transaction;
    throw new NotFoundException('Transaction not found');
  }

  async getTransactions(query: GetTransactionsDto) {
    return this.transactionsProvider.getTransactions(query);
  }

  async exportTransactions(
    dto: ExportTransactionsDto,
    currentUser: JwtPayload,
  ): Promise<{ message: string; recipientEmail: string }> {
    validateDateRange(dto.dateFrom, dto.dateTo, {
      startField: 'dateFrom',
      endField: 'dateTo',
    });

    const recipientEmail = dto.email || currentUser.email;

    await this.exportQueue.add('export-transactions', {
      recipientEmail,
      filters: dto,
    });

    return {
      message:
        'Export report generation started. File will be sent to your email.',
      recipientEmail,
    };
  }
}

