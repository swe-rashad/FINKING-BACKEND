# FinKing Backend — Merchant Panel Platform

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Distributed_Queues-orange?style=flat)](https://bullmq.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-142%20Passed-brightgreen?style=flat&logo=jest&logoColor=white)](https://jestjs.io/)
[![Frontend](https://img.shields.io/badge/Frontend-FINKING--FRONTEND-61DAFB?style=flat&logo=react&logoColor=black)](https://github.com/swe-rashad/FINKING-FRONTEND)

FinKing Backend is the core system powering the **FinKing Merchant Panel**, designed for merchant management, financial operations, transaction monitoring, and multi-tier access control. Built with **Node.js** and **NestJS 11**, the platform handles asynchronous distributed queue processing (**BullMQ + Redis**), multi-source transaction ingestion, real-time analytics aggregation, cryptographic session security with token rotation, and automated financial report generation.

Frontend Repository: [swe-rashad/FINKING-FRONTEND](https://github.com/swe-rashad/FINKING-FRONTEND)

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

### 1. Zero-Trust Security & Cryptographic Token Rotation Pipeline
* **Cryptographic Token Rotation**: Access tokens are short-lived, while refresh tokens carry unique cryptographic UUID identifiers (`jti`). Upon token refresh, the previous `jti` is immediately blacklisted in Redis with an exact TTL, preventing replay attacks and token reuse.
* **Three-Tier Authorization Chain**: Enforces granular access control through a composable pipeline: `JwtAuthGuard` -> `RolesGuard` -> `PermissionsGuard`, unifying Role-Based (RBAC) and Permission-Based (PBAC) security models.
* **Active Status Enforcement**: User revocation or account suspension is enforced synchronously at the guard level; blocked accounts are immediately denied at the gateway, neutralizing stolen tokens in real-time.
* **Global Exception Shielding & Traceability**: The enterprise `AllExceptionsFilter` intercepts unhandled runtime exceptions, masks sensitive database and ORM internals from external consumers, and attaches unique correlation trace IDs for auditability.
* **Security Header Hardening**: HTTP transport security, frame protection, and content type sniffing prevention enforced globally via **Helmet**.

### 2. Decoupled Financial Ingestion & Ledger Architecture
* **Provider Strategy Pattern**: Transactions are ingested through an abstracted `TransactionProvider` interface, decoupling the core financial domain from specific underlying storage engines and enabling plug-and-play integrations with external Core Banking systems, payment gateways, or POS terminal feeds.
* **Multi-Dimensional Query Filtering**: High-performance transaction queries supporting granular filters across execution status, transaction type, multi-currency values, sender/receiver identifiers, merchant references, RRN codes, and arbitrary date windows.
* **Multi-Tenant Merchant Isolation**: Automatic tenant scoping ensuring merchant accounts only access isolated transaction streams and localized business metrics.

### 3. Distributed Asynchronous Processing Engine (BullMQ & Redis)
* **Non-Blocking Distributed Queues**: Heavy computational workloads (such as enterprise transaction exports and comprehensive analytics generation) are offloaded to Redis-backed **BullMQ** distributed queues (`export-queue`), ensuring sub-50ms HTTP response times.
* **Dedicated Worker Host Architecture**: Background jobs are consumed by decoupled `ExportProcessor` workers running outside the HTTP event loop, featuring automated retries, error resilience, and progress tracking.
* **Automated Multi-Sheet Report Generation**: Dynamically formats, styles, and serializes high-volume datasets into multi-worksheet `.xlsx` spreadsheets using **ExcelJS**, dispatched directly to authenticated recipients via **Nodemailer** with branded email templates.

### 4. Real-Time Financial Intelligence & Analytics Aggregations
* **Dynamic Time-Series Analytics**: Aggregates gross revenue, transaction velocity, average transaction value (AOV), and active user metrics across dynamic time horizons (Weekly, Monthly, Yearly) using native database-level time truncations (`DATE_TRUNC`).
* **Merchant Category Distribution**: Real-time aggregation of transaction volumes categorized by business sector for instant financial visibility and fraud anomaly detection.
* **Executive Summary Reporting**: Real-time KPI calculations powering administrative dashboards without incurring full-table scan overhead.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **NestJS 11** | Backend framework |
| **TypeScript 5** | Static type checking and DTO contracts |
| **PostgreSQL 16** | Relational database |
| **TypeORM 1.x** | ORM and migrations |
| **Redis 7** | Token blocklist and BullMQ queue broker |
| **BullMQ** | Background job queue |
| **ExcelJS** | Excel (.xlsx) file generation |
| **Nodemailer** | SMTP email delivery |
| **Helmet** | HTTP security headers |
| **Jest** | Unit and integration testing |

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
