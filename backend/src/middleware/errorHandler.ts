import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger, logError } from '@/config/logger';
import { config } from '@/config/config';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, isOperational = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: any;
  stack?: string;
  timestamp: string;
  path: string;
  method: string;
}

// Handle Prisma errors
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target as string[] | undefined;
      const fieldName = field ? field[0] : 'field';
      return new AppError(
        `A record with this ${fieldName} already exists`,
        409,
        true,
        'DUPLICATE_ENTRY'
      );

    case 'P2025':
      // Record not found
      return new AppError(
        'The requested resource was not found',
        404,
        true,
        'NOT_FOUND'
      );

    case 'P2003':
      // Foreign key constraint violation
      return new AppError(
        'Cannot delete or update a parent row: a foreign key constraint fails',
        400,
        true,
        'FOREIGN_KEY_CONSTRAINT'
      );

    case 'P2014':
      // Required relation violation
      return new AppError(
        'The change you are trying to make would violate the required relation',
        400,
        true,
        'REQUIRED_RELATION_VIOLATION'
      );

    case 'P2000':
      // Value too long
      return new AppError(
        'The provided value is too long for the field',
        400,
        true,
        'VALUE_TOO_LONG'
      );

    case 'P2001':
      // Record does not exist
      return new AppError(
        'The record searched for in the where condition does not exist',
        404,
        true,
        'RECORD_NOT_FOUND'
      );

    case 'P2015':
      // Related record not found
      return new AppError(
        'A related record could not be found',
        400,
        true,
        'RELATED_RECORD_NOT_FOUND'
      );

    case 'P2016':
      // Query interpretation error
      return new AppError(
        'Query interpretation error',
        400,
        true,
        'QUERY_INTERPRETATION_ERROR'
      );

    case 'P2017':
      // Records not connected
      return new AppError(
        'The records for relation are not connected',
        400,
        true,
        'RECORDS_NOT_CONNECTED'
      );

    default:
      return new AppError(
        'Database operation failed',
        500,
        false,
        'DATABASE_ERROR'
      );
  }
};

// Handle Zod validation errors
const handleZodError = (error: ZodError): AppError => {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return new AppError(
    'Validation failed',
    400,
    true,
    'VALIDATION_ERROR'
  );
};

// Handle MongoDB errors
const handleMongoError = (error: any): AppError => {
  if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyPattern)[0];
    return new AppError(
      `A record with this ${field} already exists`,
      409,
      true,
      'DUPLICATE_ENTRY'
    );
  }

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
    }));

    return new AppError(
      'Validation failed',
      400,
      true,
      'VALIDATION_ERROR'
    );
  }

  if (error.name === 'CastError') {
    return new AppError(
      `Invalid ${error.path}: ${error.value}`,
      400,
      true,
      'INVALID_ID'
    );
  }

  return new AppError(
    'Database operation failed',
    500,
    false,
    'DATABASE_ERROR'
  );
};

// Handle JWT errors
const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError(
      'Invalid token',
      401,
      true,
      'INVALID_TOKEN'
    );
  }

  if (error.name === 'TokenExpiredError') {
    return new AppError(
      'Token has expired',
      401,
      true,
      'TOKEN_EXPIRED'
    );
  }

  return new AppError(
    'Authentication failed',
    401,
    true,
    'AUTH_ERROR'
  );
};

// Handle Stripe errors
const handleStripeError = (error: any): AppError => {
  switch (error.type) {
    case 'StripeCardError':
      return new AppError(
        error.message,
        400,
        true,
        'CARD_ERROR'
      );

    case 'StripeRateLimitError':
      return new AppError(
        'Too many requests made to the API too quickly',
        429,
        true,
        'RATE_LIMIT_ERROR'
      );

    case 'StripeInvalidRequestError':
      return new AppError(
        'Invalid parameters were supplied to Stripe API',
        400,
        true,
        'INVALID_REQUEST'
      );

    case 'StripeAPIError':
      return new AppError(
        'An error occurred internally with Stripe API',
        500,
        false,
        'STRIPE_API_ERROR'
      );

    case 'StripeConnectionError':
      return new AppError(
        'Some kind of error occurred during the HTTPS communication',
        500,
        false,
        'STRIPE_CONNECTION_ERROR'
      );

    case 'StripeAuthenticationError':
      return new AppError(
        'You probably used an incorrect API key',
        401,
        true,
        'STRIPE_AUTH_ERROR'
      );

    default:
      return new AppError(
        'Payment processing failed',
        500,
        false,
        'PAYMENT_ERROR'
      );
  }
};

// Main error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Convert known errors to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error instanceof ZodError) {
    appError = handleZodError(error);
  } else if (error.name === 'MongoError' || error.name === 'ValidationError' || error.name === 'CastError') {
    appError = handleMongoError(error);
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    appError = handleJWTError(error);
  } else if (error.constructor.name.startsWith('Stripe')) {
    appError = handleStripeError(error);
  } else {
    // Unknown error
    appError = new AppError(
      config.env === 'production' ? 'Something went wrong' : error.message,
      500,
      false,
      'INTERNAL_ERROR'
    );
  }

  // Log error
  logError(
    `${appError.statusCode} - ${appError.message}`,
    error,
    {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      body: req.body,
      query: req.query,
      params: req.params,
    }
  );

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: getErrorName(appError.statusCode),
    message: appError.message,
    code: appError.code,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  // Add stack trace in development
  if (config.env === 'development') {
    errorResponse.stack = error.stack;
  }

  // Add details for validation errors
  if (error instanceof ZodError) {
    errorResponse.details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
  }

  // Send error response
  res.status(appError.statusCode).json(errorResponse);
};

// Get error name from status code
const getErrorName = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Unprocessable Entity';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Internal Server Error';
    case 502:
      return 'Bad Gateway';
    case 503:
      return 'Service Unavailable';
    default:
      return 'Error';
  }
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    true,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise,
  });
  
  // Close server gracefully
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
  });
  
  // Close server gracefully
  process.exit(1);
});

