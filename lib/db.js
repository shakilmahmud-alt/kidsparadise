import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool = null;
let useBridgeFallback = false;

const BRIDGE_URL = process.env.DB_BRIDGE_URL || 'https://kidsparadise.com.bd/api.php';
const BRIDGE_SECRET = process.env.JWT_SECRET || 'kidsparadise_jwt_secret_key_2026';

// Automatically detect Vercel serverless environment or remote hosting
const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
const isRemoteHost = Boolean(process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1');
const preferBridge = isVercel || process.env.USE_DB_BRIDGE === 'true' || (isRemoteHost && process.env.DIRECT_MYSQL !== 'true');

export function getPool() {
  if (!pool) {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kidsparadise',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 2000,
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

export async function queryViaBridge(sql, params = [], retries = 2) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Secret': BRIDGE_SECRET
        },
        body: JSON.stringify({ action: 'query', sql, params }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        if (text.includes('508') || text.includes('Resource Limit')) {
          throw new Error('Server is temporarily busy (cPanel 508 Resource Limit). Retrying...');
        }
        throw new Error(text.substring(0, 150) || 'Invalid response from database bridge');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Database bridge query failed');
      }

      return data.results;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }

  console.error('PHP Bridge Query Error:', lastError?.message, 'SQL:', sql);
  throw lastError;
}

export async function query(sql, params = []) {
  if (preferBridge || useBridgeFallback) {
    return await queryViaBridge(sql, params);
  }

  try {
    const db = getPool();
    const [results] = await db.query(sql, params);
    return results;
  } catch (error) {
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'EHOSTUNREACH' ||
      error.code === 'ENOTFOUND' ||
      error.message?.includes('connect')
    ) {
      console.warn(`Direct MySQL failed (${error.code || error.message}). Falling back to HTTPS PHP Database Bridge...`);
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
