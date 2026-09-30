# FinKing Backend — Merchant Panel Platform

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat\&logo=nodedotjs\&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=flat\&logo=nestjs\&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat\&logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat\&logo=postgresql\&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat\&logo=redis\&logoColor=white)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Distributed_Queues-orange?style=flat)](https://bullmq.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat\&logo=docker\&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-142%20Passed-brightgreen?style=flat\&logo=jest\&logoColor=white)](https://jestjs.io/)
[![Frontend](https://img.shields.io/badge/Frontend-FINKING--FRONTEND-61DAFB?style=flat\&logo=react\&logoColor=black)](https://github.com/swe-rashad/FINKING-FRONTEND)

FinKing Backend is the backend system powering the **FinKing Merchant Panel**, designed for merchant management, financial operations, transaction monitoring, and multi-tier access control. Built with **Node.js** and **NestJS 11**, the platform handles asynchronous background processing with **BullMQ + Redis**, transaction ingestion, financial analytics, token rotation, and automated report generation.

Frontend Repository: https://github.com/swe-rashad/FINKING-FRONTEND

![FinKing Platform Dashboard](screenshots/dashboard-preview.png)

---

## Architecture Overview

```mermaid
flowchart TB
  subgraph Client ["Client Layer"]
    FE["FINKING-FRONTEND (Next.js 16 + React 19 Merchant Panel)"]
  end

  subgraph Gateway ["Security & HTTP Pipeline"]
    Helmet["Helmet Security Headers"]
    Filter["AllExceptionsFilter (src/common/filters)"]
    Guards["Auth Pipeline: JwtAuthGuard -> RolesGuard -> PermissionsGuard"]
  end

  subgraph Modules ["Domain Modules"]
    Auth["AuthModule (Token Rotation, Sign-In, Sign-Up)"]
    Users["UsersModule (Roles, Permissions, Block/Unblock)"]
    Merchants["MerchantsModule (Merchant Profiles)"]
    TxProvider["DatabaseTransactionProvider (Ingestion)"]
    Transactions["TransactionsModule (Filters, Details)"]
    Statistics["StatisticsModule (KPIs, Charts)"]
  end

  subgraph AsyncWorker ["ExportModule (Background Worker)"]
    Queue["BullMQ Queue ('export-queue')"]
    Worker["ExportProcessor (WorkerHost)"]
    Excel["ExcelJS (.xlsx Generation)"]
    Mail["MailService (Nodemailer SMTP Dispatch)"]
  end

  subgraph DataStores ["Storage & In-Memory"]
    Postgres[("PostgreSQL 16 (Relational DB)")]
    Redis[("Redis 7 (Token Blocklist + BullMQ Streams)")]
  end

  FE -->|Bearer JWT| Helmet
  Helmet --> Filter
  Filter --> Guards
  Guards --> Modules

  Auth --> Postgres
  Auth -->|Token Blocklist / JTI| Redis
  Users --> Postgres
  Merchants --> Postgres
  TxProvider -->|Ingest Stream| Transactions
  Transactions --> Postgres
  Statistics --> Postgres

  Transactions -->|Push Export Job| Queue
  Statistics -->|Push Export Job| Queue
  Queue --> Worker
  Worker --> Postgres
  Worker --> Excel
  Excel --> Mail
```

---

## Core Architectural Capabilities

### 1. Authentication, Authorization & Token Management

* **Token Rotation**: Access tokens are short-lived, while refresh tokens carry unique cryptographic UUID identifiers (`jti`). Upon token refresh, the previous `jti` is immediately blacklisted in Redis with an exact TTL, preventing replay attacks and token reuse.
* **Three-Tier Authorization Chain**: Enforces granular access control through a composable pipeline: `JwtAuthGuard` -> `RolesGuard` -> `PermissionsGuard`, combining Role-Based (RBAC) and Permission-Based (PBAC) access control.
* **Active Status Enforcement**: User revocation or account suspension is checked at the guard level; blocked accounts are denied access even when using an otherwise valid token.
* **Global Exception Handling & Traceability**: `AllExceptionsFilter` intercepts unhandled runtime exceptions, hides sensitive database and ORM details from external responses, and attaches unique correlation trace IDs.
* **Security Headers**: HTTP transport security, frame protection, and content type sniffing prevention are enforced globally through **Helmet**.

### 2. Transaction Ingestion & Ledger Architecture

* **Provider Strategy Pattern**: Transactions are ingested through an abstracted `TransactionProvider` interface, separating the transaction domain from specific storage implementations and allowing integrations with external Core Banking systems, payment gateways, or POS terminal feeds.
* **Multi-Dimensional Query Filtering**: Transaction queries support filters across execution status, transaction type, multi-currency values, sender/receiver identifiers, merchant references, RRN codes, and date ranges.
* **Multi-Tenant Merchant Isolation**: Merchant accounts are scoped to their own transaction streams and related business metrics.

### 3. Background Processing with BullMQ & Redis

* **Background Queues**: Heavy workloads such as transaction exports and analytics generation are processed through Redis-backed **BullMQ** queues using the `export-queue`.
* **Dedicated Worker Processing**: Background jobs are consumed by separate `ExportProcessor` workers outside the HTTP request flow, with automated retries, error handling, and progress tracking.
* **Automated Multi-Sheet Report Generation**: Datasets are formatted, styled, and serialized into multi-worksheet `.xlsx` spreadsheets using **ExcelJS**, then sent to authenticated recipients through **Nodemailer** with email templates.

### 4. Financial Analytics & Aggregations

* **Dynamic Time-Series Analytics**: Aggregates gross revenue, transaction velocity, average transaction value (AOV), and active user metrics across dynamic time horizons (Weekly, Monthly, Yearly) using database-level time truncation with `DATE_TRUNC`.
* **Merchant Category Distribution**: Aggregates transaction volumes by business sector for financial reporting and fraud anomaly detection.
* **KPI Reporting**: Calculates summary KPIs used by administrative dashboards without requiring full-table scans.

---

## Tech Stack

| Technology        | Purpose                                 |
| ----------------- | --------------------------------------- |
| **NestJS 11**     | Backend framework                       |
| **TypeScript 5**  | Static type checking and DTO contracts  |
| **PostgreSQL 16** | Relational database                     |
| **TypeORM 1.x**   | ORM and migrations                      |
| **Redis 7**       | Token blocklist and BullMQ queue broker |
| **BullMQ**        | Background job queue                    |
| **ExcelJS**       | Excel (.xlsx) file generation           |
| **Nodemailer**    | SMTP email delivery                     |
| **Helmet**        | HTTP security headers                   |
| **Jest**          | Unit and integration testing            |

---

## Getting Started

### Option A: Using Docker Compose

Run the platform services, PostgreSQL, and Redis together:

```bash
docker compose up --build
```

The service will start at `http://localhost:3000`.

---

### Option B: Local Setup with PNPM

#### 1. Prerequisites

* Node.js 20+
* PNPM (`npm install -g pnpm`)
* PostgreSQL 16 and Redis 7 running locally

#### 2. Environment Configuration

```bash
cp .env.sample .env
```

Update `.env` with your database, Redis, and SMTP settings.

#### 3. Install Dependencies

```bash
pnpm install
```

#### 4. Run Migrations & Seeds (Optional)

```bash
pnpm db:seed
```

#### 5. Start the Server

```bash
# Development with hot-reload
pnpm start:dev

# Production build and run
pnpm build
pnpm start:prod
```

---

## Database Migrations

TypeORM CLI commands for database schema updates:

```bash
# Generate a migration based on entity changes
pnpm migration:generate src/database/migrations/YourMigrationName

# Run pending migrations
pnpm migration:run

# Revert the latest migration
pnpm migration:revert
```

---

## Running Tests

Unit tests cover services, guards, controllers, processors, and filters:

```bash
# Run all unit tests
pnpm test

# Run tests with coverage
pnpm test:cov
```

All 23 test suites and 142 unit tests pass.

---

## License

This project is licensed under the MIT License.
