import { Transactions } from '@/modules/transactions/entities/transaction.entity';
import { DataSource } from 'typeorm';
import { transactionsMock } from './data/transactions.mock';

export async function seedTransactions(dataSource: DataSource) {
  const transactionRepository = dataSource.getRepository(Transactions);
  const count = await transactionRepository.count();
  if (count > 0) {
    await transactionRepository.clear();
  }
  const transactions = transactionRepository.create(transactionsMock as any);
  await transactionRepository.save(transactions);
}
