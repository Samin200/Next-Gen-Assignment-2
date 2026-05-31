import pg from "pg";
const { Pool } = pg;

/** PostgreSQL connection pool — connects via DATABASE_URL (Supabase). */
// The pool is initialised lazily — connections are only created on first query.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: Number(process.env.DB_POOL_MAX ?? 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("Unexpected error on idle pg client", err);
});

export default pool;
