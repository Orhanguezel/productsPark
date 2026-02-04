// =============================================================
// FILE: src/db/seed/index.ts
// FINAL — SQL Seed Runner (DETERMINISTIC bcrypt hash inject; cPanel-safe)
// - DROP/CREATE (opsiyonel --no-drop)
// - --only=10,20,30 filtre desteği
// - SQL placeholder inject: {{ADMIN_EMAIL}}, {{ADMIN_ID}}, {{ADMIN_PASSWORD_HASH}}
// - Session vars set: @ADMIN_EMAIL, @ADMIN_ID, @ADMIN_PASSWORD_HASH
// - argon2 REMOVED
// - ✅ DEFAULT admin hash is FIXED (admin123) so every seed is stable
// =============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

import { env } from '@/core/env';
import { cleanSql, splitStatements, logStep } from './utils';

// ESM için __dirname/__filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Flags = {
  noDrop?: boolean;
  only?: string[]; // ör: ["40","41","50"] -> sadece o dosyalar
};

function parseFlags(argv: string[]): Flags {
  const flags: Flags = {};
  for (const a of argv.slice(2)) {
    if (a === '--no-drop') flags.noDrop = true;
    else if (a.startsWith('--only=')) {
      flags.only = a
        .replace('--only=', '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return flags;
}

function assertSafeToDrop(dbName: string) {
  const allowDrop = process.env.ALLOW_DROP === 'true';
  const isProd = process.env.NODE_ENV === 'production';
  const isSystem = ['mysql', 'information_schema', 'performance_schema', 'sys'].includes(
    dbName.toLowerCase(),
  );
  if (isSystem) throw new Error(`Sistem DB'si drop edilemez: ${dbName}`);
  if (isProd && !allowDrop) throw new Error('Prod ortamda DROP için ALLOW_DROP=true bekleniyor.');
}

async function dropAndCreate(root: mysql.Connection) {
  assertSafeToDrop(env.DB.name);
  await root.query(`DROP DATABASE IF EXISTS \`${env.DB.name}\`;`);
  await root.query(
    `CREATE DATABASE \`${env.DB.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
  );
}

async function createRoot(): Promise<mysql.Connection> {
  return mysql.createConnection({
    host: env.DB.host,
    port: env.DB.port,
    user: env.DB.user,
    password: env.DB.password,
    multipleStatements: true,
  });
}

async function createConnToDb(): Promise<mysql.Connection> {
  return mysql.createConnection({
    host: env.DB.host,
    port: env.DB.port,
    user: env.DB.user,
    password: env.DB.password,
    database: env.DB.name,
    multipleStatements: true,
    charset: 'utf8mb4_unicode_ci',
  });
}

function shouldRun(file: string, flags: Flags) {
  if (!flags.only?.length) return true;
  const m = path.basename(file).match(/^(\d+)/);
  const prefix = m?.[1];
  return prefix ? flags.only.includes(prefix) : false;
}

/** SQL string güvenli tek tırnak escape */
function sqlStr(v: string) {
  return v.replaceAll("'", "''");
}

function isBcryptHash(v: string) {
  return v.startsWith('$2a$') || v.startsWith('$2b$') || v.startsWith('$2y$');
}

/**
 * ✅ Deterministic default bcrypt hash for "admin123"
 * - This is a PRECOMPUTED bcrypt hash (rounds=10).
 * - Stable across seeds (same string every time).
 *
 * Password: admin123
 */
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const DEFAULT_ADMIN_BCRYPT_HASH = '$2b$10$5SlniINQxYqlRnQhug9eFeG35jeLh/SzCmqGZ7WHxf7M8N6orJV2.';

/**
 * admin değişkenlerini ENV'den oku + hash seç
 *
 * Öncelik:
 * 1) ADMIN_PASSWORD_HASH -> direkt kullan (deterministic)
 * 2) (opsiyonel) ADMIN_PASSWORD + ALLOW_DYNAMIC_ADMIN_HASH=1 -> runtime hash üret (saltlı, değişir)
 * 3) default: sabit hash (admin123) -> her seed aynı
 */
async function getAdminVars(): Promise<{ email: string; id: string; passwordHash: string }> {
  const email = (process.env.ADMIN_EMAIL || 'orhanguzell@gmail.com').trim();
  const id = (process.env.ADMIN_ID || '4f618a8d-6fdb-498c-898a-395d368b2193').trim();

  const providedHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();
  if (providedHash) {
    if (!isBcryptHash(providedHash)) {
      throw new Error('ADMIN_PASSWORD_HASH must be a bcrypt hash ($2a/$2b/$2y).');
    }
    return { email, id, passwordHash: providedHash };
  }

  // Dynamic hash creation is OFF by default (to keep seeds stable)
  const allowDynamic =
    String(process.env.ALLOW_DYNAMIC_ADMIN_HASH || '')
      .trim()
      .toLowerCase() === '1' ||
    String(process.env.ALLOW_DYNAMIC_ADMIN_HASH || '')
      .trim()
      .toLowerCase() === 'true';

  const plainPassword = (process.env.ADMIN_PASSWORD || '').trim();
  if (allowDynamic && plainPassword) {
    // If you REALLY want to generate on the fly, enable this and add bcryptjs dependency.
    // We avoid importing bcryptjs unless this path is used.
    const bcrypt = await import('bcryptjs');
    const rounds = Number(process.env.BCRYPT_ROUNDS || '10');
    const passwordHash = bcrypt.hashSync(plainPassword, rounds);
    return { email, id, passwordHash };
  }

  // Default deterministic
  // If ADMIN_PASSWORD provided but dynamic disabled, we still keep deterministic
  // to avoid surprise password changes between seeds.
  return { email, id, passwordHash: DEFAULT_ADMIN_BCRYPT_HASH };
}

/** Dosyayı oku, temizle, admin değişkenleri enjekte et ve opsiyonel yer tutucu değiştir */
function prepareSqlForRun(
  rawSql: string,
  admin: { email: string; id: string; passwordHash: string },
) {
  let sql = cleanSql(rawSql);

  const header = [
    `SET @ADMIN_EMAIL := '${sqlStr(admin.email)}';`,
    `SET @ADMIN_ID := '${sqlStr(admin.id)}';`,
    `SET @ADMIN_PASSWORD_HASH := '${sqlStr(admin.passwordHash)}';`,
  ].join('\n');

  sql = sql
    .replaceAll('{{ADMIN_BCRYPT}}', admin.passwordHash) // legacy placeholder name
    .replaceAll('{{ADMIN_PASSWORD_HASH}}', admin.passwordHash)
    .replaceAll('{{ADMIN_EMAIL}}', admin.email)
    .replaceAll('{{ADMIN_ID}}', admin.id);

  return `${header}\n${sql}`;
}

async function runSqlFile(
  conn: mysql.Connection,
  absPath: string,
  adminVars: { email: string; id: string; passwordHash: string },
) {
  const name = path.basename(absPath);
  logStep(`⏳ ${name} çalışıyor...`);

  const raw = fs.readFileSync(absPath, 'utf8');
  const sql = prepareSqlForRun(raw, adminVars);
  const statements = splitStatements(sql);

  await conn.query('SET NAMES utf8mb4;');
  await conn.query("SET time_zone = '+00:00';");

  for (const stmt of statements) {
    if (!stmt) continue;
    await conn.query(stmt);
  }

  logStep(`✅ ${name} bitti`);
}

async function main() {
  const flags = parseFlags(process.argv);

  const root = await createRoot();
  try {
    if (!flags.noDrop) {
      logStep('💣 DROP + CREATE başlıyor');
      await dropAndCreate(root);
      logStep('🆕 DB oluşturuldu');
    } else {
      logStep('⤵️ --no-drop: DROP/CREATE atlanıyor');
    }
  } finally {
    await root.end();
  }

  const conn = await createConnToDb();

  try {
    const ADMIN = await getAdminVars();

    // küçük sanity log (hash’i yazma!)
    logStep(
      `👤 Admin seed: email=${ADMIN.email} id=${ADMIN.id} password=${
        process.env.ADMIN_PASSWORD_HASH
          ? 'ADMIN_PASSWORD_HASH'
          : process.env.ADMIN_PASSWORD
            ? 'DEFAULT(admin123) (deterministic)'
            : 'DEFAULT(admin123) (deterministic)'
      }`,
    );

    const envDir = process.env.SEED_SQL_DIR && process.env.SEED_SQL_DIR.trim();
    const distSql = path.resolve(__dirname, 'sql');
    const srcSql = path.resolve(__dirname, '../../../src/db/seed/sql');
    const sqlDir = envDir ? path.resolve(envDir) : fs.existsSync(distSql) ? distSql : srcSql;

    const files = fs
      .readdirSync(sqlDir)
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (const f of files) {
      const abs = path.join(sqlDir, f);
      if (!shouldRun(abs, flags)) {
        logStep(`⏭️ ${f} atlandı (--only filtresi)`);
        continue;
      }
      await runSqlFile(conn, abs, ADMIN);
    }

    logStep('🎉 Seed tamamlandı.');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
