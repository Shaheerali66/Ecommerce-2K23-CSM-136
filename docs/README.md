# Kaarigar Backend — Local Artisan Marketplace

Sprint 2: Catalog Data Foundation. Full write-up: [`docs/SPRINT_2.md`](docs/SPRINT_2.md).
Sprint 1 architecture/scope doc: [`docs/SPRINT_1.md`](docs/SPRINT_1.md).

## Stack
Node.js + Express, PostgreSQL, Knex (migrations, query builder, seeds), JWT auth, Jest +
Supertest for tests.

## Local setup

**Requirements:** Node.js 18+, PostgreSQL 14+ running locally (or reachable).

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file and fill in your own values:
   ```bash
   cp .env.example .env
   ```
   | Variable | Purpose |
   |---|---|
   | `PORT` | Port the API listens on (default `4000`). |
   | `DATABASE_URL` | Full Postgres connection string. If unset, the individual `DB_*` fields below are used instead. |
   | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Dev database connection. |
   | `TEST_DB_NAME` | Separate database used only when `NODE_ENV=test` (keeps test runs from touching dev data). |
   | `JWT_SECRET` | Secret used to sign/verify admin login tokens. Use a long random string; never commit the real value. |
   | `JWT_EXPIRES_IN` | Token lifetime, e.g. `1d`. |

   **Never commit your real `.env` file or secrets** — only `.env.example` is tracked.

3. Create the databases (once):
   ```sql
   CREATE DATABASE kaarigar_dev;
   CREATE DATABASE kaarigar_test;
   ```

4. Run migrations and seed sample data:
   ```bash
   npx knex migrate:latest
   npx knex seed:run
   ```
   This creates a demo admin user: `admin@kaarigar.pk` / `Admin@123` — change or remove this
   before any real deployment.

5. Start the server:
   ```bash
   npm start
   ```
   Health check: `GET http://localhost:4000/health` → `{"status":"ok"}`.

## Running tests

Tests run against `NODE_ENV=test`'s database (real Postgres, not a mock) and truncate the
catalog tables between tests:

```bash
NODE_ENV=test npx knex migrate:latest --env test
npm test
```

## Project layout

```
migrations/   Knex migrations — one table per file, in dependency order
seeds/        Seed data: admin user, category tree, sample products/variants/SKUs
src/
  controllers/  Request handling + business rules (cycle checks, publish validation, etc.)
  middleware/   JWT auth, role checks, centralized error formatting
  routes/       Express route definitions, grouped by resource
  db.js         Shared Knex connection
  app.js        Express app (no listener — used directly by tests)
  server.js     Starts the HTTP listener
tests/        Jest + Supertest test suites, one per resource
docs/         SPRINT_1.md and SPRINT_2.md deliverables
```
