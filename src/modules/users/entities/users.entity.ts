import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type {
  UserStatusEnumType,
  UserRolesEnumType,
} from '../types/users.type';
import { UsersRoles, UserStatusEnum } from '../types/users.type';
import { Exclude } from 'class-transformer';
import { Merchant } from '@/modules/merchants/entities/merchant.entity';
import type { PermissionType } from '@/common/types/permission.type';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @Column({ unique: true })
  email: string;
  @Column()
  @Exclude()
  password: string;
  @Column()
  name: string;
  @Column()
  lastname: string;
  @Column({ default: false })
  verificated: boolean;
  @Column({
    type: 'enum',
    enum: UserStatusEnum,
    default: UserStatusEnum.ForceChangePassword,
  })
  status: UserStatusEnumType;
  @Column({
    type: 'enum',
    enum: UsersRoles,
    default: UsersRoles.Employee,
  })
  role: UserRolesEnumType;
  @Column({ nullable: true })
  merchantId: number | null;
  @ManyToOne(() => Merchant, (merchant) => merchant.users, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;
  @Column({
    type: 'text',
    array: true,
    default: '{}',
    nullable: true,
  })
  permissions: PermissionType[] | null;
}
