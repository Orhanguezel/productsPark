import 'dotenv/config';

const toInt = (v: string | undefined, d: number) => {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : d;
};
const toBool = (v: string | undefined, d = false) => {
  if (v == null) return d;
  const s = v.toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(s);
};
const toList = (v: string | undefined) =>
  (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const CORS_LIST = toList(process.env.CORS_ORIGIN);
const CORS_ORIGIN = CORS_LIST.length ? CORS_LIST : [FRONTEND_URL];

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: toInt(process.env.PORT, 8081),
   QUIZ: {
      DURATION_SECONDS: Number(process.env.QUIZ_DURATION_SECONDS ?? 60),
    },


  DB: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'app',
    name: process.env.DB_NAME || 'app',
  },

  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'cookie-secret',

  CORS_ORIGIN,

  CLOUDINARY: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'uploads',
    basePublic: process.env.CLOUDINARY_BASE_PUBLIC || '',
    publicStorageBase: process.env.PUBLIC_STORAGE_BASE || '',
  },

  PAYTR: {
    MERCHANT_ID: process.env.PAYTR_MERCHANT_ID || '',
    MERCHANT_KEY: process.env.PAYTR_MERCHANT_KEY || '',
    MERCHANT_SALT: process.env.PAYTR_MERCHANT_SALT || '',
    BASE_URL: process.env.PAYTR_BASE_URL || 'https://www.paytr.com/odeme',
    OK_URL: process.env.PAYTR_OK_URL || '',
    FAIL_URL: process.env.PAYTR_FAIL_URL || '',
    TEST_MODE: (process.env.PAYTR_TEST_MODE ?? '1') as '0' | '1',
    DIRECT_REQUEST: toBool(process.env.PAYTR_DIRECT_REQUEST, false),
  },

  // Yeni yapı
  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
  },

  // Geriye dönük uyumluluk (auth/controller.ts bu alanları bekliyor)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',

  PUBLIC_URL: process.env.PUBLIC_URL || 'http://localhost:8081',
  FRONTEND_URL: FRONTEND_URL,
} as const;

export type AppEnv = typeof env;
