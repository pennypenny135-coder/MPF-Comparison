import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  const pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({ connectionString: databaseUrl });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }
  return drizzle(pool);
}

export { getDb };

// Lazy singleton - only created when first used
let _db: ReturnType<typeof drizzle> | null = null;

export function getDbInstance() {
  if (!_db) {
    _db = getDb();
  }
  return _db;
}

// For backward compatibility - will throw if DATABASE_URL not set
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return getDbInstance()[prop as keyof ReturnType<typeof drizzle>];
  },
});

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required");
    const p =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({ connectionString: databaseUrl });
    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = p;
    }
    return p[prop as keyof Pool];
  },
});
