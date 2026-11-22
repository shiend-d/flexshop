import { Pool, type QueryResultRow } from "pg";

const globalForPg = globalThis as unknown as {
  flexshopPool?: Pool;
  flexshopPoolUrl?: string;
};

export function getPool(): Pool {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL belum diatur. Buat .env.local (lihat .env.example) atau jalankan aplikasi lewat Docker Compose.",
    );
  }

  if (!globalForPg.flexshopPool || globalForPg.flexshopPoolUrl !== url) {
    const previous = globalForPg.flexshopPool;
    if (previous) {
      void previous.end().catch(() => {});
    }

    globalForPg.flexshopPool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    globalForPg.flexshopPoolUrl = url;
  }

  return globalForPg.flexshopPool;
}

export type SqlParam = string | number | boolean | null | Date;

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: SqlParam[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}
