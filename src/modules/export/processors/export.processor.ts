import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Transactions } from '@/modules/transactions/entities/transaction.entity';
import { StatisticsService } from '@/modules/statistics/statistics.service';
import { ExcelService } from '../services/excel.service';
import { MailService } from '../services/mail.service';
import { buildBrandedEmailHtml } from '../mail.templates';

@Processor('export-queue')
@Injectable()
export class ExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(
    @InjectRepository(Transactions)
    private readonly transactionRepository: Repository<Transactions>,
    private readonly statisticsService: StatisticsService,
    private readonly excelService: ExcelService,
    private readonly mailService: MailService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'export-transactions':
        await this.handleTransactionsExport(job);
        break;
      case 'export-statistics':
        await this.handleStatisticsExport(job);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleTransactionsExport(job: Job): Promise<void> {
    const { recipientEmail, filters } = job.data;
    this.logger.log(`Processing transactions export for ${recipientEmail}`);

    const where: FindOptionsWhere<Transactions> = {};

    if (filters?.sender) where.sender = ILike(`%${filters.sender}%`);
    if (filters?.receiver) where.receiver = ILike(`%${filters.receiver}%`);
    if (filters?.merchantName)
      where.merchantName = ILike(`%${filters.merchantName}%`);
    if (filters?.currency) where.currency = filters.currency;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;

    if (filters?.dateFrom && filters?.dateTo) {
      where.dateOfOperation = Between(
        new Date(filters.dateFrom),
        new Date(filters.dateTo),
      );
    } else if (filters?.dateFrom) {
      where.dateOfOperation = MoreThanOrEqual(new Date(filters.dateFrom));
    } else if (filters?.dateTo) {
      where.dateOfOperation = LessThanOrEqual(new Date(filters.dateTo));
    }

    const transactions = await this.transactionRepository.find({
      where,
      order: { dateOfOperation: 'DESC' },
      take: 10000,
    });

    const fileBuffer =
      await this.excelService.buildTransactionsWorkbook(transactions);

    const dateRangeText =
      filters?.dateFrom && filters?.dateTo
        ? `${filters.dateFrom} to ${filters.dateTo}`
        : filters?.dateFrom
          ? `From ${filters.dateFrom}`
          : filters?.dateTo
            ? `Up to ${filters.dateTo}`
            : 'All recorded dates';

    const emailHtml = buildBrandedEmailHtml({
      title: 'FinKing Operations',
      badge: 'Financial Intelligence',
      heading: 'Transactions Export Report',
      description:
        'Your requested transactions dataset has been compiled and is attached to this email as a Microsoft Excel (.xlsx) spreadsheet.',
      summaryRows: [
        {
          label: 'Total Records Exported',
          value: transactions.length.toLocaleString(),
        },
        { label: 'Date Range', value: dateRangeText },
        { label: 'Generated At (UTC)', value: new Date().toUTCString() },
        { label: 'Format', value: 'Microsoft Excel (.xlsx)' },
      ],
      confidentialNotice:
        'This document contains sensitive financial operational data. Please ensure it is stored and handled in accordance with compliance standards.',
    });

    await this.mailService.sendReportMail({
      to: recipientEmail,
      subject: `FinKing - Transactions Export Report (${transactions.length} records)`,
      html: emailHtml,
      filename: `finking_transactions_${Date.now()}.xlsx`,
      attachmentBuffer: fileBuffer,
    });
  }

  private async handleStatisticsExport(job: Job): Promise<void> {
    const { recipientEmail, filters, merchantId } = job.data;
    this.logger.log(`Processing statistics export for ${recipientEmail}`);

    const statsDto = {
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
    };
    const currentUser = { merchantId };

    const [
      revenueOverview,
      categoryDistribution,
      totalRevenueResult,
      totalTransactionsResult,
    ] = await Promise.all([
      this.statisticsService.getRevenueOverview(statsDto, currentUser),
      this.statisticsService.getCategoryDistribution(statsDto, currentUser),
      this.statisticsService.getTotalRevenue(statsDto, currentUser),
      this.statisticsService.getTotalTransactions(statsDto, currentUser),
    ]);

    const fileBuffer = await this.excelService.buildStatisticsWorkbook({
      revenueOverview,
      categoryDistribution,
      totalRevenue: totalRevenueResult.value,
      totalTransactions: totalTransactionsResult.value,
    });

    const dateRangeText =
      statsDto.startDate && statsDto.endDate
        ? `${new Date(statsDto.startDate).toISOString().slice(0, 10)} to ${new Date(statsDto.endDate).toISOString().slice(0, 10)}`
        : statsDto.startDate
          ? `From ${new Date(statsDto.startDate).toISOString().slice(0, 10)}`
          : statsDto.endDate
            ? `Up to ${new Date(statsDto.endDate).toISOString().slice(0, 10)}`
            : 'Last 12 Months';

    const emailHtml = buildBrandedEmailHtml({
      title: 'FinKing Operations',
      badge: 'Executive Analytics',
      heading: 'Platform Statistics Report',
      description:
        'Your requested platform statistics and financial KPIs have been compiled and attached as a multi-sheet Microsoft Excel workbook.',
      summaryRows: [
        {
          label: 'Total Platform Revenue',
          value: `$${totalRevenueResult.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        },
        {
          label: 'Total Operations Count',
          value: totalTransactionsResult.value.toLocaleString(),
        },
        {
          label: 'Distribution Categories',
          value: `${categoryDistribution.data.length} categories`,
        },
        { label: 'Reporting Window', value: dateRangeText },
        { label: 'Generated At (UTC)', value: new Date().toUTCString() },
      ],
      confidentialNotice:
        'This document contains confidential executive business performance metrics. Strictly for authorized management use.',
    });

    await this.mailService.sendReportMail({
      to: recipientEmail,
      subject: 'FinKing - Platform Statistics Export Report',
      html: emailHtml,
      filename: `finking_statistics_${Date.now()}.xlsx`,
      attachmentBuffer: fileBuffer,
    });
  }
}
