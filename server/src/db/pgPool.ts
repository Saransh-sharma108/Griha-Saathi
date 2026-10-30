import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DatabaseStatus {
  connected: boolean;
  type: 'postgresql' | 'file_persisted';
  poolSize?: number;
  databaseName?: string;
  host?: string;
  migrationsApplied: boolean;
  error?: string;
}

let pgPool: pkg.Pool | null = null;
let isConnected = false;
let migrationsRan = false;
let lastError: string | undefined = undefined;

export function getPgConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString && connectionString.trim().length > 0 && !connectionString.includes('YOUR_DATABASE_URL')) {
    return { connectionString: connectionString.trim() };
  }

  const host = process.env.PGHOST;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;
  const port = Number(process.env.PGPORT) || 5432;

  if (host && user && database && !host.includes('YOUR_') && !user.includes('YOUR_')) {
    return {
      host,
      port,
      user,
      password,
      database,
    };
  }

  return null;
}

/**
 * Initializes the PostgreSQL connection pool if configured.
 */
export async function initPostgresPool(): Promise<boolean> {
  const config = getPgConfig();
  if (!config) {
    isConnected = false;
    return false;
  }

  try {
    if (!pgPool) {
      pgPool = new Pool({
        ...config,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 3000,
      });

      pgPool.on('error', (err) => {
        console.error('[PostgreSQL Pool Unexpected Error]', err.message);
        lastError = err.message;
      });
    }

    // Test connection with a fast probe
    const client = await pgPool.connect();
    try {
      await client.query('SELECT 1');
      isConnected = true;
      lastError = undefined;

      // Run migrations automatically
      await applyMigrations(client);
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    isConnected = false;
    lastError = err.message || 'Unable to connect to PostgreSQL server';
    return false;
  }
}

/**
 * Executes SQL migrations from the migrations directory.
 */
async function applyMigrations(client: pkg.PoolClient): Promise<void> {
  if (migrationsRan) return;

  try {
    const migrationFile = path.resolve(__dirname, 'migrations', '001_auth_tables.sql');
    if (fs.existsSync(migrationFile)) {
      const sql = fs.readFileSync(migrationFile, 'utf8');
      await client.query(sql);
      migrationsRan = true;
      console.log('[PostgreSQL] Migrations verified & applied successfully (001_auth_tables.sql).');
    }
  } catch (err: any) {
    console.error('[PostgreSQL Migration Error]', err.message);
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  const config = getPgConfig();
  if (!config) {
    return {
      connected: false,
      type: 'file_persisted',
      migrationsApplied: false,
      error: 'DATABASE_URL or PGHOST is not configured in .env. Persistent disk engine active.',
    };
  }

  return {
    connected: isConnected,
    type: isConnected ? 'postgresql' : 'file_persisted',
    poolSize: isConnected ? 10 : undefined,
    databaseName: 'database' in config ? (config.database as string) : 'PostgreSQL DB',
    host: 'host' in config ? (config.host as string) : 'Remote Postgres',
    migrationsApplied: migrationsRan,
    error: isConnected ? undefined : lastError,
  };
}

export function getPool(): pkg.Pool | null {
  return isConnected ? pgPool : null;
}

/**
 * Executes a callback within a managed PostgreSQL transaction.
 */
export async function withTransaction<T>(callback: (client: pkg.PoolClient) => Promise<T>): Promise<T | null> {
  if (!pgPool || !isConnected) return null;

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

