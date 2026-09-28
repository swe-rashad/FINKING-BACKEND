import { PaginationResponseData } from '@/common/types/pagination.type';
import { GetTransactionsDto } from '@/modules/transactions/dto/get-transactions.dto';
import { Transactions } from '@/modules/transactions/entities/transaction.entity';

export interface TransactionProvider {
  getTransactions(
    params: GetTransactionsDto,
  ): Promise<PaginationResponseData<Transactions>>;
}
