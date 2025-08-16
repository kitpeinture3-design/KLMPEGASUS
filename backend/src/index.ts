import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import Redis from 'ioredis';

// Import routes
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import siteRoutes from '@/routes/sites';
import pageRoutes from '@/routes/pages';
import productRoutes from '@/routes/products';
import orderRoutes from '@/routes/orders';
import webhookRoutes from '@/routes/webhooks';
import aiRoutes from '@/routes/ai';

// Import middleware
import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';
import { authMiddleware } from '@/middleware/auth';

// Import config
import { config } from '@/config/config';
import { logger } from '@/config/logger';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Initialize database connections
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

let redis: Redis;
if (config.redis.url) {
  redis = new Redis(config.redis.url, {
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      config.frontend.url,
      'http://localhost:3000',
      'http://localhost:3001',
      'https://klm-pegasus.vercel.app',
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check Redis connection
    let redisStatus = 'not configured';
    if (redis) {
      try {
        await redis.ping();
        redisStatus = 'connected';
      } catch (error) {
        redisStatus = 'disconnected';
      }
    }

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.env,
      services: {
        database: 'connected',
        mongodb: mongoStatus,
        redis: redisStatus,
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/sites', authMiddleware, siteRoutes);
app.use('/api/pages', authMiddleware, pageRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/webhooks', webhookRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist.`,
  });
});

// Global error handler
app.use(errorHandler);

// Database connections
async function connectDatabases() {
  try {
    // Connect to PostgreSQL via Prisma
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database');

    // Connect to MongoDB
    if (config.mongodb.uri) {
      await mongoose.connect(config.mongodb.uri, {
        dbName: 'klm_pegasus',
      });
      logger.info('Connected to MongoDB database');
    }

    // Connect to Redis
    if (redis) {
      await redis.connect();
      logger.info('Connected to Redis cache');
    }
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Received shutdown signal, closing server gracefully...');
  
  try {
    await prisma.$disconnect();
    logger.info('Disconnected from PostgreSQL');
    
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
    
    if (redis) {
      redis.disconnect();
      logger.info('Disconnected from Redis');
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
async function startServer() {
  try {
    await connectDatabases();
    
    const port = config.port;
    const server = app.listen(port, '0.0.0.0', () => {
      logger.info(`🚀 KLM Pegasus Backend Server running on port ${port}`);
      logger.info(`📖 Environment: ${config.env}`);
      logger.info(`🔗 Health check: http://localhost:${port}/health`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();

// Export for testing
export { app, prisma, redis };

