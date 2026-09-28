import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { Transactions } from '@/modules/transactions/entities/transaction.entity';

export interface StatisticsExportPayload {
  revenueOverview: { period: string; data: { date?: string; currency: string; value: number }[] };
  categoryDistribution: { totalTransactions: number; data: { type: string; value: number; transactionsCount: number }[] };
  totalRevenue: number;
  totalTransactions: number;
}

@Injectable()
export class ExcelService {
  async buildTransactionsWorkbook(transactions: Transactions[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FinKing Operations';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Transactions');
    worksheet.columns = [
      { header: 'ID', key: 'transactionId', width: 12 },
      { header: 'Sender', key: 'sender', width: 25 },
      { header: 'Receiver', key: 'receiver', width: 25 },
      { header: 'Amount', key: 'amount', width: 16 },
      { header: 'Currency', key: 'currency', width: 12 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Merchant', key: 'merchantName', width: 22 },
      { header: 'Operation Date (UTC)', key: 'dateOfOperation', width: 24 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0284C7' },
    };

    for (const tx of transactions) {
      const row = worksheet.addRow({
        transactionId: tx.transactionId,
        sender: tx.sender,
        receiver: tx.receiver,
        amount: Number(tx.amount),
        currency: tx.currency ? tx.currency.toUpperCase() : '',
        type: tx.type,
        status: tx.status,
        merchantName: tx.merchantName,
        dateOfOperation: tx.dateOfOperation
          ? new Date(tx.dateOfOperation).toISOString().replace('T', ' ').substring(0, 19)
          : '',
      });
      row.getCell('amount').numFmt = '#,##0.00';
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async buildStatisticsWorkbook(payload: StatisticsExportPayload): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FinKing Analytics';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('KPI Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 25 },
    ];
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0284C7' },
    };
    summarySheet.addRow({ metric: 'Total Revenue', value: payload.totalRevenue });
    summarySheet.addRow({ metric: 'Total Transactions Count', value: payload.totalTransactions });

    const revenueSheet = workbook.addWorksheet('Revenue Overview');
    revenueSheet.columns = [
      { header: 'Date Period', key: 'date', width: 20 },
      { header: 'Currency', key: 'currency', width: 15 },
      { header: 'Revenue', key: 'value', width: 20 },
    ];
    revenueSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    revenueSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0284C7' },
    };

    for (const rev of payload.revenueOverview.data) {
      revenueSheet.addRow(rev);
    }

    const categorySheet = workbook.addWorksheet('Category Distribution');
    categorySheet.columns = [
      { header: 'Transaction Type', key: 'type', width: 25 },
      { header: 'Volume Amount', key: 'value', width: 20 },
      { header: 'Transactions Count', key: 'transactionsCount', width: 20 },
    ];
    categorySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    categorySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0284C7' },
    };

    for (const cat of payload.categoryDistribution.data) {
      categorySheet.addRow(cat);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
