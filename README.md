# PunchBook

> Replace the customer notebook with one tap.

PunchBook is a digital membership app for small service shops in Vietnam — spas, nail salons, gyms, massage studios, and clinics — that still track customers with paper notebooks, Excel, or memory.

## Purpose

Small shops sell prepaid packages (e.g. “10 massage sessions” or “30-day gym access”). Staff need to know, in seconds:

- Does this customer still have sessions (or days) left?
- Can we check them in right now?
- Who is about to expire and needs a renewal?

Today that usually means flipping through a notebook, arguing over remaining sessions, and forgetting renewals — which loses revenue and trust.

**PunchBook’s job is narrow on purpose:** manage customers, packages, check-ins, renewals, and simple payments accurately — not become a CRM, ERP, booking system, or full POS.

If a shop can throw away its membership notebook, PunchBook has done its job.

## Who it’s for

| Role | What they need |
|------|----------------|
| **Staff** (front desk) | Find a customer and check in in under ~5 seconds, with large clear UI |
| **Owner** | See today’s/month revenue, who’s active, and who’s about to expire |

Typical shop size: 1 location, 2–10 staff, ~100–1000 customers. Owners are often not tech-savvy; the product assumes phone/tablet use and almost no training.

## Core capabilities (MVP direction)

- Create service packages (by session count or by duration in days)
- Add members and track remaining sessions / expiry
- Fast check-in with automatic session deduction (and race-safe locking)
- Owner dashboard: revenue and expiring members
- Renewal payments via payOS (planned)
- Optional paid-plan reminders via Zalo (planned)
- Installable PWA for tablet/desktop use (planned)

**Out of scope for MVP:** booking, multi-branch, loyalty/marketing CRM, native mobile apps.

## Repository layout

This monorepo contains:

- `backend/` — Rails 8 API (PostgreSQL, Redis, Sidekiq, JWT; GraphQL today)
- `frontend/` — React + TypeScript + Vite + Tailwind CSS v4 + Apollo Client
- `docs/` — product vision, steps, and build phases

## Setup and Running

The easiest way to run the entire project is using Docker Compose.

### Prerequisites

- Docker and Docker Compose installed.

### Start the Services

1. Clone the repository and navigate to the directory.
2. Build and start the containers in the background:

   ```bash
   docker compose up --build -d
   ```

3. Initialize the database:

   ```bash
   docker compose exec backend bundle exec rails db:create db:migrate
   ```

Now you can access:

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **API / GraphQL**: [http://localhost:3000/graphql](http://localhost:3000/graphql)

---

## Development

### Backend (Rails)

- **Run tests**:

  ```bash
  docker compose exec backend bundle exec rspec
  ```

- **Lint code**:

  ```bash
  docker compose exec backend bundle exec rubocop
  ```

### Frontend (React)

- **Build**:

  ```bash
  docker compose exec frontend npm run build
  ```

- **Lint**:

  ```bash
  docker compose exec frontend npm run lint
  ```

## Working Hello GraphQL Query

The project includes a dummy `hello` query to test end-to-end integration.

Query:

```graphql
query {
  hello {
    message
  }
}
```

Response:

```json
{
  "data": {
    "hello": {
      "message": "Hello PunchBook"
    }
  }
}
```

This query is consumed by Apollo Client on the frontend, and the message `Hello PunchBook` is displayed on the main page.

## Further reading

- [`docs/README.md`](docs/README.md) — product overview and principles
- [`docs/steps.md`](docs/steps.md) — phased build guide
- [`docs/product.md`](docs/product.md) — product vision
