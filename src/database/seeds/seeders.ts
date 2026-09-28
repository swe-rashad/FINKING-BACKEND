import { DataSource } from 'typeorm';

import { seedTransactions } from './transactions.seeder';

const seeders = [seedTransactions];

export async function runSeeders(dataSource: DataSource) {
  for (const seeder of seeders) {
    await seeder(dataSource);
  }
}
