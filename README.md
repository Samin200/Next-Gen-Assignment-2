# DevPulse — Tech Issue Tracker REST API

A Node.js + TypeScript + Express REST API for tracking technical issues. Backed by
PostgreSQL with the native `pg` driver and raw SQL (no ORMs, no JOINs).

## Stack

- **Runtime:** Node.js (LTS)
- **Language:** TypeScript (strict mode, no `any`)
- **Framework:** Express.js
- **Database:** PostgreSQL via `pg` (native driver, raw SQL)
- **Auth:** `bcrypt` (10 rounds) + `jsonwebtoken`
- **HTTP:** `http-status-codes`

## Project Structure

```
src/
  index.ts                 ← server bootstrap
  app.ts                   ← express app factory
  config/
    db.ts                  ← pg Pool
    env.ts                 ← env loader
  middleware/
    auth.ts                ← JWT verify (Authorization: <token>)
    role.ts                ← role gate
    error.ts               ← centralized error handler + 404
  modules/
    auth/
      auth.router.ts
      auth.controller.ts
      auth.service.ts
    issues/
      issues.router.ts
      issues.controller.ts
      issues.service.ts
  utils/
    response.ts            ← sendSuccess / sendError / AppError helpers
    types.ts               ← shared interfaces
    validators.ts          ← enum guards + validators
schema.sql                 ← DDL (run once against Postgres)
```

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create the database**

   ```bash
   createdb devpulse
   psql devpulse < schema.sql
   ```

3. **Configure env** (`.env` — all values have sensible defaults)

   ```env
   PORT=3000
   JWT_SECRET=change-me
   JWT_EXPIRES_IN=7d
   BCRYPT_ROUNDS=10
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=devpulse
   ```

4. **Run in dev**

   ```bash
   npx tsx watch src/index.ts
   ```

5. **Build / type-check**

   ```bash
   npm run build
   ```

## Endpoints

| Method   | Path                | Access        | Notes |
| -------- | ------------------- | ------------- | ----- |
| `POST`   | `/api/auth/signup`  | public        | 201 + user (no password) |
| `POST`   | `/api/auth/login`   | public        | 200 + `{ token, user }` |
| `POST`   | `/api/issues`       | authenticated | `reporter_id` derived from JWT |
| `GET`    | `/api/issues`       | public        | Filters: `sort`, `type`, `status` |
| `GET`    | `/api/issues/:id`   | public        | Nested `reporter` object |
| `PATCH`  | `/api/issues/:id`   | authenticated | See permission rules below |
| `DELETE` | `/api/issues/:id`   | maintainer    | Returns body (no 204) |

### Authorization header

```
Authorization: <jwt>
```

> **No `Bearer` prefix** — the token is sent raw.

### PATCH permission rules

- **Maintainer** → can update any issue.
- **Contributor** → must be the reporter AND issue must be `open`.
  - Updating someone else's issue → **403 Forbidden**
  - Updating a non-`open` issue → **409 Conflict**

### No JOINs

Reporter info is fetched in a **separate query** using `WHERE id IN (...)` after
the issues query returns.

## Response Envelope

```json
// success
{ "success": true, "message": "...", "data": ... }

// error
{ "success": false, "message": "...", "errors": ... }
```

## Status Codes

| Code | Meaning |
| ---- | ------- |
| 200  | GET / PATCH / DELETE success |
| 201  | POST success |
| 400  | Validation error or duplicate resource |
| 401  | Missing / invalid / expired JWT |
| 403  | Valid token, wrong role or not owner |
| 404  | Resource not found |
| 409  | Business logic conflict |
| 500  | Unexpected server error |
# Next-Gen-Assignment-2
