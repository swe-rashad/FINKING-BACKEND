import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          synchronize: process.env.NODE_ENV !== 'production',
          migrationsRun: process.env.NODE_ENV === 'production',
          migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
          autoLoadEntities: true,
        };
      },
    }),
  ],
})
export class DatabaseModule { }
