import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type {
  CurrencyEnumType,
  TransactionTypeEnumType,
  TransactionStatusEnumType,
} from '@/modules/transactions/types';
import {
  currencyEnum,
  transactionStatusEnum,
  transactionTypeEnum,
} from '@/modules/transactions/types';
import { Exclude } from 'class-transformer';

@Entity()
@Index(['dateOfOperation', 'status', 'currency'])
export class Transactions {
  @PrimaryGeneratedColumn()
  transactionId: number;
  @Column()
  sender: string;
  @Column()
  receiver: string;
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) =>
        value !== null && value !== undefined ? parseFloat(value) : value,
    },
  })
  amount: number;
  @Column({
    type: 'enum',
    enum: currencyEnum,
  })
  currency: CurrencyEnumType;
  @Column({
    type: 'enum',
    enum: transactionTypeEnum,
  })
  type: TransactionTypeEnumType;
  @Column({
    type: 'enum',
    enum: transactionStatusEnum,
  })
  status: TransactionStatusEnumType;
  @CreateDateColumn()
  dateOfOperation: Date;
  @Column({ type: 'varchar', length: 12, unique: true })
  @Exclude()
  rrn: string;
  @Column()
  merchantName: string;
  @Column()
  @Exclude()
  operationId: number;
  @Exclude()
  @Column()
  mcc: number;
  @Exclude()
  @Column()
  merchantId: number;
  @Exclude()
  @Column()
  terminalId: string;
}
