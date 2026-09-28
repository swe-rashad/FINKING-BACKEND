import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transactions } from '@/modules/transactions/entities/transaction.entity';
import { StatisticsModule } from '@/modules/statistics/statistics.module';
import { ExcelService } from './services/excel.service';
import { MailService } from './services/mail.service';
import { ExportProcessor } from './processors/export.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transactions]),
    BullModule.registerQueue({
      name: 'export-queue',
    }),
    StatisticsModule,
  ],
  providers: [ExcelService, MailService, ExportProcessor],
  exports: [ExcelService, MailService, BullModule],
})
export class ExportModule {}
