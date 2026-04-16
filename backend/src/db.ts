import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/calclone';
const replicaConnectionString = process.env.REPLICA_DATABASE_URL || null;

// Pool tuning - make Node's pg Pool friendly for PgBouncer or other connection poolers.
// Set `DB_POOL_MAX` to control the maximum number of client connections the app will open.
// Recommended: set DB_POOL_MAX to ~200 for production behind PgBouncer.
const POOL_MAX = Number(process.env.DB_POOL_MAX || 200);
const IDLE_TIMEOUT_MS = Number(process.env.DB_IDLE_TIMEOUT_MS || 30_000);
const CONNECTION_TIMEOUT_MS = Number(process.env.DB_CONNECTION_TIMEOUT_MS || 2_000);

let _pool: Pool | null = null;
let _replicaPool: Pool | null = null;

function makePool(connStr: string) {
  return new Pool({
    connectionString: connStr,
    max: POOL_MAX,
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    // allow process to exit when idle (helpful for tests/containers)
    // supported in modern node-postgres versions
    // @ts-ignore
    allowExitOnIdle: true,
  });
}

function getPool(): Pool {
  if (!_pool) {
    _pool = makePool(connectionString);
  }
  return _pool;
}

function getReplicaPool(): Pool | null {
  if (!_replicaPool && replicaConnectionString) {
    _replicaPool = makePool(replicaConnectionString);
  }
  return _replicaPool;
}

export async function query(text: string, params?: any[]): Promise<QueryResult<any>> {
  return getPool().query(text, params);
}

export async function queryRead(text: string, params?: any[]): Promise<QueryResult<any>> {
  const rp = getReplicaPool();
  if (rp) return rp.query(text, params);
  return getPool().query(text, params);
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export const pool = {
  query: (text: string, params?: any[]) => getPool().query(text, params),
  connect: () => getPool().connect(),
  end: () => getPool().end(),
};

export default pool;
