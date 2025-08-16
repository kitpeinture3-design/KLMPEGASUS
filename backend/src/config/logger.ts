import winston from 'winston';
import { config } from './config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for each log level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaString = '';
    if (Object.keys(meta).length > 0) {
      metaString = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport (always enabled in development)
if (config.env === 'development') {
  transports.push(
    new winston.transports.Console({
      level: config.monitoring.logLevel,
      format: consoleFormat,
    })
  );
}

// File transports (for production and development)
if (config.env === 'production' || config.env === 'development') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      level: config.monitoring.logLevel,
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  levels,
  level: config.monitoring.logLevel,
  format: fileFormat,
  defaultMeta: {
    service: 'klm-pegasus-backend',
    environment: config.env,
    version: process.env.npm_package_version || '1.0.0',
  },
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP request logging
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Helper functions for structured logging
export const logError = (message: string, error?: Error, meta?: any) => {
  logger.error(message, {
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined,
    ...meta,
  });
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Performance logging helper
export const logPerformance = (operation: string, startTime: number, meta?: any) => {
  const duration = Date.now() - startTime;
  logger.info(`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...meta,
  });
};

// Database query logging helper
export const logDatabaseQuery = (query: string, duration: number, meta?: any) => {
  logger.debug('Database Query', {
    query,
    duration: `${duration}ms`,
    ...meta,
  });
};

// API request logging helper
export const logApiRequest = (method: string, url: string, statusCode: number, duration: number, meta?: any) => {
  const level = statusCode >= 400 ? 'warn' : 'info';
  logger.log(level, 'API Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    ...meta,
  });
};

// Security event logging
export const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high', meta?: any) => {
  const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
  logger.log(level, `Security Event: ${event}`, {
    severity,
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

// Business event logging
export const logBusinessEvent = (event: string, meta?: any) => {
  logger.info(`Business Event: ${event}`, {
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

// Ensure logs directory exists
import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

