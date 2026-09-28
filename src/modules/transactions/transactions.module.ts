import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transactions } from './entities/transaction.entity';
import { DatabaseTransactionProvider } from './providers/database-transaction.provider';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transactions]),
    BullModule.registerQueue({
      name: 'export-queue',
    }),
  ],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    DatabaseTransactionProvider,
  ],
  exports: [TransactionsService, DatabaseTransactionProvider],
})
export class TransactionsModule {}
