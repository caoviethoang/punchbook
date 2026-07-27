# PunchBook (Sổ Khách)

PunchBook is a SaaS application for small businesses (Spa, Nail, Gym, Massage, Clinic) to manage customers and memberships.

This monorepo contains:
- `backend/`: Rails 8 GraphQL API (using PostgreSQL, Redis, Sidekiq, and JWT authentication).
- `frontend/`: React + TypeScript + Vite + Tailwind CSS v4 + Apollo Client.

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
3. Initialize the database (run Rails db:create and db:migrate):
   ```bash
   docker compose exec backend bundle exec rails db:create db:migrate
   ```

Now you can access:
- **Frontend App**: [http://localhost:5173](http://localhost:5173) (runs Vite Dev Server)
- **GraphQL Endpoint**: [http://localhost:3000/graphql](http://localhost:3000/graphql)

---

## Development

### Backend (Rails)
To run tasks, lint, or run tests inside backend:
- **Run tests**:
  ```bash
  docker compose exec backend bundle exec rspec
  ```
- **Lint code**:
  ```bash
  docker compose exec backend bundle exec rubocop
  ```

### Frontend (React)
To build or lint the frontend:
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
