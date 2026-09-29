import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1790623329418 implements MigrationInterface {
  name = 'InitialMigration1790623329418';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "users_status_enum" AS ENUM('active', 'blocked', 'forceChangePassword')`,
    );
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM('admin', 'employee', 'customer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "lastname" character varying NOT NULL, "verificated" boolean NOT NULL DEFAULT false, "status" "users_status_enum" NOT NULL DEFAULT 'forceChangePassword', "role" "users_role_enum" NOT NULL DEFAULT 'employee', "merchantId" integer, "permissions" text array DEFAULT '{}', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "merchants_status_enum" AS ENUM('active', 'blocked', 'pending', 'otpActivation')`,
    );
    await queryRunner.query(
      `CREATE TABLE "merchants" ("id" SERIAL NOT NULL, "merchantName" character varying NOT NULL, "email" character varying, "status" "merchants_status_enum" NOT NULL DEFAULT 'otpActivation', "verificated" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_bd4ad2105f5795eb64352ebb41e" UNIQUE ("merchantName"), CONSTRAINT "PK_4fd312ef25f8e05ad47bfe7ed25" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "transactions_currency_enum" AS ENUM('eur', 'usd', 'gbp')`,
    );
    await queryRunner.query(
      `CREATE TYPE "transactions_type_enum" AS ENUM('payment', 'topup', 'transfer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "transactions_status_enum" AS ENUM('failed', 'completed', 'pending')`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("transactionId" SERIAL NOT NULL, "sender" character varying NOT NULL, "receiver" character varying NOT NULL, "amount" numeric(15,2) NOT NULL, "currency" "transactions_currency_enum" NOT NULL, "type" "transactions_type_enum" NOT NULL, "status" "transactions_status_enum" NOT NULL, "dateOfOperation" TIMESTAMP NOT NULL DEFAULT now(), "rrn" character varying(12) NOT NULL, "merchantName" character varying NOT NULL, "operationId" integer NOT NULL, "mcc" integer NOT NULL, "merchantId" integer NOT NULL, "terminalId" character varying NOT NULL, CONSTRAINT "UQ_cdcac1e1f1a3a55ff17042d907d" UNIQUE ("rrn"), CONSTRAINT "PK_1eb69759461752029252274c105" PRIMARY KEY ("transactionId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5c7c7165c6d42a730b2e60436f" ON "transactions" ("dateOfOperation", "status", "currency")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_af94df2e060180b6043d5e45042" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_af94df2e060180b6043d5e45042"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_5c7c7165c6d42a730b2e60436f"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "transactions_status_enum"`);
    await queryRunner.query(`DROP TYPE "transactions_type_enum"`);
    await queryRunner.query(`DROP TYPE "transactions_currency_enum"`);
    await queryRunner.query(`DROP TABLE "merchants"`);
    await queryRunner.query(`DROP TYPE "merchants_status_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
    await queryRunner.query(`DROP TYPE "users_status_enum"`);
  }
}
