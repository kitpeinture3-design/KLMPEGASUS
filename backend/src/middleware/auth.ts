import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config/config';
import { logger, logSecurityEvent } from '@/config/logger';

const prisma = new PrismaClient();

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        subscriptionPlan: string;
        subscriptionStatus: string;
      };
    }
  }
}

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  iat: number;
  exp: number;
}

// Authentication middleware
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logSecurityEvent('Missing or invalid authorization header', 'low', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token is required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      logSecurityEvent('Token valid but user not found', 'medium', {
        userId: decoded.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    if (user.subscriptionStatus !== 'ACTIVE') {
      logSecurityEvent('User with inactive subscription attempted access', 'low', {
        userId: user.id,
        subscriptionStatus: user.subscriptionStatus,
        ip: req.ip,
      });
      
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account is not active',
      });
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Attach user to request object
    req.user = user;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logSecurityEvent('Invalid JWT token', 'medium', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid access token',
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      logSecurityEvent('Expired JWT token', 'low', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token has expired',
      });
    }

    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
      },
    });

    if (user && user.subscriptionStatus === 'ACTIVE') {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors in optional middleware
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      logSecurityEvent('Insufficient permissions', 'medium', {
        userId: req.user.id,
        requiredRoles: roles,
        userRole: req.user.role,
        path: req.path,
      });
      
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

// Subscription plan authorization middleware
export const requirePlan = (plans: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!plans.includes(req.user.subscriptionPlan)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Upgrade your subscription to access this feature',
        requiredPlans: plans,
        currentPlan: req.user.subscriptionPlan,
      });
    }

    next();
  };
};

// Admin only middleware
export const requireAdmin = requireRole(['ADMIN', 'SUPER_ADMIN']);

// Super admin only middleware
export const requireSuperAdmin = requireRole(['SUPER_ADMIN']);

// Premium plan or higher middleware
export const requirePremium = requirePlan(['PREMIUM', 'ENTERPRISE']);

// Enterprise plan middleware
export const requireEnterprise = requirePlan(['ENTERPRISE']);

// Rate limiting per user middleware
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(); // Skip rate limiting for unauthenticated requests
    }

    const userId = req.user.id;
    const now = Date.now();
    const userLimit = userRequests.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize user limit
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      logSecurityEvent('User rate limit exceeded', 'medium', {
        userId,
        maxRequests,
        windowMs,
        path: req.path,
      });
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded for your account',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
      });
    }

    userLimit.count++;
    next();
  };
};

// API key authentication middleware (for external integrations)
export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key is required',
      });
    }

    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    if (!keyRecord || !keyRecord.isActive) {
      logSecurityEvent('Invalid API key used', 'high', {
        apiKey: apiKey.substring(0, 8) + '...',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key has expired',
      });
    }

    if (keyRecord.user.subscriptionStatus !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account is not active',
      });
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsed: new Date() },
    });

    req.user = keyRecord.user;
    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
};

