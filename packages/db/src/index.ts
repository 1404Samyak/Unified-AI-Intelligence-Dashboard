import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | undefined;
let warned = false;

export const hasDatabaseUrl = () => Boolean(process.env.DATABASE_URL);

export const getPool = () => {
  if (!process.env.DATABASE_URL) {
    return undefined;
  }

  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL
  });

  return pool;
};

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  const activePool = getPool();
  if (!activePool) {
    throw new Error("DATABASE_URL is not configured");
  }

  return activePool.query<T>(text, params);
}

export async function tryQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  try {
    return await query<T>(text, params);
  } catch (error) {
    if (!warned) {
      warned = true;
      console.warn(
        `Postgres unavailable, using in-memory demo data where possible: ${
          error instanceof Error ? error.message : "unknown database error"
        }`
      );
    }
    return undefined;
  }
}

export async function ensureAuthTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS public.users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL DEFAULT 'student' CHECK (role = 'student'),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      year_of_study INTEGER,
      branch TEXT,
      semester INTEGER CHECK (semester IN (1, 2)),
      enrollment_number TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}
