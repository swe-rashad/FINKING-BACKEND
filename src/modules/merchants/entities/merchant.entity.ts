import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/modules/users/entities/users.entity';
import type { MerchantStatusEnumType } from '../types/merchants.type';
import { MerchantStatusEnum } from '../types/merchants.type';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  merchantName: string;

  @Column({ nullable: true })
  email?: string;

  @Column({
    type: 'enum',
    enum: MerchantStatusEnum,
    default: MerchantStatusEnum.OtpActivation,
  })
  status: MerchantStatusEnumType;

  @Column({ default: false })
  verificated: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.merchant)
  users: User[];
}
