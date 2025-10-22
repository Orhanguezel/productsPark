import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT || 8080),
  NODE_ENV: process.env.NODE_ENV || 'development',

  DB: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'app',
    name: process.env.DB_NAME || 'app',
  },

  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'cookie-secret',

  CORS_ORIGIN: (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  CLOUDINARY: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
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
    TEST_MODE: process.env.PAYTR_TEST_MODE || '1',
    DIRECT_REQUEST: process.env.PAYTR_DIRECT_REQUEST === '1',
  },

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',

  PUBLIC_URL: process.env.PUBLIC_URL || '',
  FRONTEND_URL: process.env.FRONTEND_URL || '',
};
