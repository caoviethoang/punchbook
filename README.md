# PunchBook

> **Replace traditional customer management notebooks in seconds.**

[![Ruby on Rails](https://img.shields.io/badge/Ruby_on_Rails-8.0-CC0000?style=for-the-badge&logo=ruby-on-rails&logoColor=white)](https://rubyonrails.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![payOS](https://img.shields.io/badge/payOS-Integrated-0052CC?style=for-the-badge)](https://payos.vn/)
[![Zalo ZBS](https://img.shields.io/badge/Zalo_ZBS-Automated-0068FF?style=for-the-badge)](https://zalo.me)

---

## Product Overview

**PunchBook** is a simple, specialized membership package management software solution designed for small and medium-sized service businesses (**Spas, Nail Salons, Gyms, Massages, Clinics...**) that still manage operations using paper notebooks, Excel files, or manual tracking.

The product focuses on solving **ONE CORE PROBLEM**: 
> **Manage customers, service packages, and check-ins FASTEST — SIMPLEST — MOST ACCURATELY.**

---

## Key Features

### 1. Ultra-fast Check-in Screen (Staff UX)
- **1-Click Check-in**: Complete check-in in under 3 seconds.
- **Smart Phone & Name Search**: Flexible search by name or phone number (automatically stripping spaces, dots, and hyphens regardless of format).
- **Instant Response (Optimistic Update)**: Deduct sessions immediately on the UI, with automatic rollback if an API error occurs.
- **Race-Condition Safe**: Automatic data stream locking via Pessimistic Locking (`with_lock`) to prevent conflicts when two staff members check in concurrently.

### 2. Payment & Package Renewal via payOS
- **Instant Payment QR Generation**: Automatically create VietQR bank transfer payment links via the payOS gateway.
- **Absolute Security**: HMAC signature verification for Webhooks (`/webhooks/payos`) before package renewal.
- **Idempotency Guarantee**: Process invoices exactly once to prevent duplicate session additions.

### 3. Automated Reminders via Zalo ZBS (Paid Plan)
- **Daily Sidekiq Cron Job**: Automatically scan members with `<= 3 sessions` remaining or expiring within `7 days` for shops on the `paid` plan.
- **Send Zalo Message with Payment Link**: Automatically send renewal reminders with online payment links to customers' Zalo accounts.

### 4. Owner Dashboard & Multi-sheet Excel Reports
- **Overview Metrics**: Monthly revenue, active members, members nearing expiration.
- **Professional Excel Export**: Download multi-sheet Excel reports (Overview, Invoice Details, Member List) with a single click.

### 5. Progressive Web App (PWA)
- Supports direct installation (**Installable Web App**) on Chrome, Edge & Safari for tablets/laptops at checkout counters.

---

## System Architecture & Monorepo Layout

```text
punchbook/
├── backend/            # Rails 8 API (PostgreSQL, Redis, Sidekiq, Devise Auth, GraphQL)
├── frontend/           # React 19 + TypeScript + Vite + Tailwind CSS v4 + Apollo Client
├── docs/               # Product design documents, Business Rules, Steps & New Issues
```

### Technology Stack:

| Component | Technology |
|---|---|
| **Backend API** | Ruby on Rails 8, PostgreSQL 16, Redis 7, Sidekiq, Devise, JWT, RSpec |
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Apollo Client |
| **Integrations** | **payOS** Payment Gateway, **Zalo ZBS** Messaging Service |

---

## Getting Started

### Option 1: Quick Start with Docker Compose (Recommended)

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/caoviethoang/punchbook.git
   cd punchbook
   ```

2. Start all services (PostgreSQL, Redis, Backend, Frontend):
   ```bash
   docker compose up --build -d
   ```

3. Initialize the Database:
   ```bash
   docker compose exec backend bundle exec rails db:create db:migrate db:seed
   ```

**Access URLs:**
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000)

---

### Option 2: Manual Start (Development Mode)

#### 1. Backend (Rails API)
```bash
cd backend
bundle install
rails db:create db:migrate db:seed
bin/dev # Or rails server -p 3000
```

#### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## Quality Assurance & Testing

The project strictly follows automated testing workflows on GitHub Actions CI/CD:

### Backend Tests & Linting
```bash
cd backend
bundle exec rubocop    # Check Code Style standards (0 offenses requirement)
bundle exec rspec      # Run 137+ automated test cases (100% pass)
```

### Frontend Type-check & Linting
```bash
cd frontend
npm run lint           # ESLint check
npm run build          # TypeScript type-check & Vite production build
```

---

## Technical Documentation & Issue Backlog

- [`docs/product.md`](docs/product.md) — Product vision & design philosophy.
- [`docs/business-rules.md`](docs/business-rules.md) — Business logic rules.
- [`docs/new_issues.md`](docs/new_issues.md) — List of 8 post-MVP feature expansion issues (QR Code Check-in, Excel Import, Audit Logs, etc.).

---

## License & Owner

Developed by **Louis Cao** — Dedicated to replacing paper notebooks for small businesses in Vietnam.
