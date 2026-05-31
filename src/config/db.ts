import pg from "pg";

const { Pool } = pg;

/** PostgreSQL connection pool using env defaults (or .env overrides). */
// The pool is initialised lazily — connections are only created on first query.

export const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  database: process.env.DB_NAME ?? "devpulse",
  max: Number(process.env.DB_POOL_MAX ?? 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("Unexpected error on idle pg client", err);
});

export default pool;
