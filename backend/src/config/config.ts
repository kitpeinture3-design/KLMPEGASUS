import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  
  // Database URLs
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  MONGODB_URI: z.string().optional(),
  REDIS_URL: z.string().optional(),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Bcrypt Configuration
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  
  // Frontend URL
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  
  // AI Service Configuration
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_API_BASE: z.string().url().optional(),
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_ENVIRONMENT: z.string().optional(),
  PINECONE_INDEX: z.string().optional(),
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('eu-west-1'),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_CLOUDFRONT_DOMAIN: z.string().optional(),
  
  // Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Monitoring and Logging
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Email Configuration (for future use)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('1000'),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/webp,image/gif'),
});

// Validate environment variables
const env = envSchema.parse(process.env);

// Export configuration object
export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  
  database: {
    url: env.DATABASE_URL,
  },
  
  mongodb: {
    uri: env.MONGODB_URI,
  },
  
  redis: {
    url: env.REDIS_URL,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  bcrypt: {
    rounds: env.BCRYPT_ROUNDS,
  },
  
  frontend: {
    url: env.FRONTEND_URL,
  },
  
  ai: {
    serviceUrl: env.AI_SERVICE_URL,
    openai: {
      apiKey: env.OPENAI_API_KEY,
      apiBase: env.OPENAI_API_BASE,
    },
    pinecone: {
      apiKey: env.PINECONE_API_KEY,
      environment: env.PINECONE_ENVIRONMENT,
      index: env.PINECONE_INDEX,
    },
  },
  
  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    s3: {
      bucket: env.AWS_S3_BUCKET,
    },
    cloudfront: {
      domain: env.AWS_CLOUDFRONT_DOMAIN,
    },
  },
  
  stripe: {
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
  
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    logLevel: env.LOG_LEVEL,
  },
  
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  },
  
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    allowedFileTypes: env.ALLOWED_FILE_TYPES.split(','),
  },
  
  // Feature flags
  features: {
    aiEnabled: !!env.OPENAI_API_KEY,
    stripeEnabled: !!env.STRIPE_SECRET_KEY,
    awsEnabled: !!env.AWS_ACCESS_KEY_ID && !!env.AWS_SECRET_ACCESS_KEY,
    emailEnabled: !!env.SMTP_HOST && !!env.SMTP_USER,
    monitoringEnabled: !!env.SENTRY_DSN,
  },
} as const;

// Type for configuration
export type Config = typeof config;

// Validate required configuration for production
if (config.env === 'production') {
  const requiredForProduction = [
    config.jwt.secret,
    config.jwt.refreshSecret,
    config.database.url,
  ];
  
  const missing = requiredForProduction.filter(value => !value);
  if (missing.length > 0) {
    throw new Error(`Missing required configuration for production: ${missing.join(', ')}`);
  }
}

