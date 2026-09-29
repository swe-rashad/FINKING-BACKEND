# FinKing Backend — Node.js & NestJS Financial Platform API

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Background_Queues-orange?style=flat)](https://bullmq.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-142%20Passed-brightgreen?style=flat&logo=jest&logoColor=white)](https://jestjs.io/)
[![Frontend](https://img.shields.io/badge/Frontend-FINKING--FRONTEND-61DAFB?style=flat&logo=react&logoColor=black)](https://github.com/swe-rashad/FINKING-FRONTEND)

FinKing Backend is a RESTful API service for financial operations and reporting, built with **Node.js** and **NestJS**. It handles user authentication with JWT token rotation, role-based access control, transaction history, platform analytics, and background report exports via email.

Frontend Repository: [swe-rashad/FINKING-FRONTEND](https://github.com/swe-rashad/FINKING-FRONTEND)

![FinKing Platform Dashboard](screenshots/dashboard-preview.png)

---

## Architecture Overview

```mermaid
flowchart TB
  subgraph Client ["Client Layer"]
    FE["FINKING-FRONTEND (Next.js 16 + React 19)"]
  end

  subgraph Gateway ["Security & HTTP Pipeline"]
    Helmet["Helmet Security Headers"]
    Filter["AllExceptionsFilter (src/common/filters)"]
    Guards["Auth Pipeline: JwtAuthGuard -> RolesGuard -> PermissionsGuard"]
  end

  subgraph Modules ["Domain Modules"]
    Auth["AuthModule (Token Rotation, Sign-In, Sign-Up)"]
    Users["UsersModule (CRUD, Roles, Block/Unblock)"]
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

## Key Features

### 1. Authentication & Security
* **JWT with Refresh Token Rotation**: Access tokens expire in 1 day; refresh tokens use a unique UUID (`jti`). When a refresh token is used, its `jti` is stored in Redis until its TTL expires, preventing reuse.
* **Role-Based & Permission-Based Access**: Supports roles (`Admin`, `Employee`, `Customer`) and permissions (`users:read`, `users:create`, `transactions:read`, etc.).
* **Account Status Checks**: Blocked users are stopped directly at the `JwtAuthGuard` level with a 403 response.
* **Centralized Exception Handling**: `AllExceptionsFilter` catches uncaught errors, hides database error details from clients, and logs trace IDs for debugging.
* **Architectural Note on Rate Limiting**: Application-level rate limiting was omitted here. In enterprise systems, rate limiting and traffic management are handled upstream by an API Gateway (such as Kong Gateway or Cloudflare). Keeping it outside the service code simplifies local development while following microservice separation of concerns.

### 2. Transactions & Statistics
* **Transaction Ingestion**: `DatabaseTransactionProvider` simulates transactions from payment gateways and terminals, making transaction data independent from user tables.
* **Filtering & Pagination**: Query transactions by status, type, currency, sender, receiver, merchant, and date range.
* **Analytics**: Aggregates total revenue, transaction counts, average amount, and category distribution for the dashboard.

### 3. Background Job Processing (BullMQ & Redis)
* Export endpoints (`POST /transactions/export` and `POST /statistics/export`) add jobs to `export-queue` in BullMQ and return immediately.
* `ExportProcessor` runs in the background, pulls data from PostgreSQL, creates an `.xlsx` spreadsheet using **ExcelJS**, and emails it to the user with **Nodemailer**.

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

Run the API, PostgreSQL, and Redis together:

```bash
docker compose up --build
```

The API will start at `http://localhost:3000`.

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
