import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool = null;
let useBridgeFallback = false;

const BRIDGE_URL = process.env.DB_BRIDGE_URL || 'https://kidsparadise.com.bd/api.php';
const BRIDGE_SECRET = process.env.JWT_SECRET || 'kidsparadise_jwt_secret_key_2026';

export function getPool() {
  if (!pool) {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kidsparadise',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 3000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    };

    if (process.env.DB_SSL === 'true') {
      config.ssl = { rejectUnauthorized: false };
    }

    pool = mysql.createPool(config);
  }
  return pool;
}

export async function queryViaBridge(sql, params = []) {
  try {
    const res = await fetch(BRIDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Secret': BRIDGE_SECRET
      },
      body: JSON.stringify({ action: 'query', sql, params })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || data.message || 'Database bridge query failed');
    }
    return data.results;
  } catch (err) {
    console.error('PHP Bridge Query Error:', err.message, 'SQL:', sql);
    throw err;
  }
}

export async function query(sql, params = []) {
  // If bridge fallback was already triggered or explicit bridge mode
  if (useBridgeFallback || process.env.USE_DB_BRIDGE === 'true') {
    return await queryViaBridge(sql, params);
  }

  try {
    const db = getPool();
    const [results] = await db.query(sql, params);
    return results;
  } catch (error) {
    // If connection refused, timed out, or firewalled, fallback to HTTPS PHP bridge seamlessly
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'EHOSTUNREACH' ||
      error.code === 'ENOTFOUND' ||
      error.message?.includes('connect')
    ) {
      console.warn(`Direct MySQL failed (${error.code || error.message}). Falling back to HTTPS PHP Database Bridge at ${BRIDGE_URL}...`);
      useBridgeFallback = true;
      return await queryViaBridge(sql, params);
    }

    console.error('MySQL Query Error:', error.message, 'Query:', sql);
    throw error;
  }
}

export default {
  getPool,
  query,
  queryViaBridge
};
