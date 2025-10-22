// src/db/seed/index.ts
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { env } from '@/core/env';
import { cleanSql, splitStatements, logStep } from './utils';

type Flags = {
  noDrop?: boolean;
  only?: string[]; // ör: ["40","41","50"] -> sadece o dosyalar
};

function parseFlags(argv: string[]): Flags {
  const flags: Flags = {};
  for (const a of argv.slice(2)) {
    if (a === '--no-drop') flags.noDrop = true;
    else if (a.startsWith('--only=')) {
      flags.only = a.replace('--only=', '').split(',').map(s => s.trim());
    }
  }
  return flags;
}

function assertSafeToDrop(dbName: string) {
  const allowDrop = process.env.ALLOW_DROP === 'true';
  const isProd = process.env.NODE_ENV === 'production';
  const isSystem = ['mysql','information_schema','performance_schema','sys'].includes(dbName.toLowerCase());
  if (isSystem) throw new Error(`Sistem DB'si drop edilemez: ${dbName}`);
  if (isProd && !allowDrop) throw new Error('Prod ortamda DROP için ALLOW_DROP=true bekleniyor.');
  // İstersen ek güvenlik: yalnızca *_dev, *_local gibi isimlere izin ver
  // if (!dbName.endsWith('_dev') && !allowDrop) throw new Error('DB adı *_dev değilken drop yasak. ALLOW_DROP=true ver.');
}

async function dropAndCreate(root: mysql.Connection) {
  assertSafeToDrop(env.DB.name);
  await root.query(`DROP DATABASE IF EXISTS \`${env.DB.name}\`;`);
  await root.query(
    `CREATE DATABASE \`${env.DB.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
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
    charset: 'utf8mb4_general_ci',
  });
}

function shouldRun(file: string, flags: Flags) {
  if (!flags.only?.length) return true;
  // dosya adı başındaki numara ile filtre
  const m = path.basename(file).match(/^(\d+)/);
  const prefix = m?.[1];
  return prefix ? flags.only.includes(prefix) : false;
}

async function runSqlFile(conn: mysql.Connection, absPath: string) {
  const name = path.basename(absPath);
  logStep(`⏳ ${name} çalışıyor...`);
  const raw = fs.readFileSync(absPath, 'utf8');
  const sql = cleanSql(raw);                  // yorumları temizle
  const statements = splitStatements(sql);    // ; ile ayrıştır
  // İsteğe bağlı: tek transaction içinde çalıştırmak istersen (DDL’ler için gerekmez)
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

  // 1) Root ile drop + create (opsiyonel)
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

  // 2) DB bağlantısı
  const conn = await createConnToDb();

  try {
    // 3) sql dizinindeki dosyaları sırayla çalıştır
    const sqlDir = path.resolve(__dirname, 'sql');
    const files = fs.readdirSync(sqlDir)
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (const f of files) {
      const abs = path.join(sqlDir, f);
      if (!shouldRun(abs, flags)) {
        logStep(`⏭️ ${f} atlandı (--only filtresi)`);
        continue;
      }
      await runSqlFile(conn, abs);
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
