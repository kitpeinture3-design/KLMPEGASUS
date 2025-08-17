import { Request, Response, NextFunction } from 'express';
import { logApiRequest, logger } from '@/config/logger';
import { config } from '@/config/config';

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Skip logging for health checks in production
  if (config.env === 'production' && req.path === '/health') {
    return next();
  }

  // Log request start
  logger.debug('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
  });

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    
    // Log API request
    logApiRequest(
      req.method,
      req.url,
      res.statusCode,
      duration,
      {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        contentLength: res.get('Content-Length'),
        referer: req.get('Referer'),
      }
    );

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

