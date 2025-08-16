import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config/config';
import { logger, logSecurityEvent, logBusinessEvent } from '@/config/logger';
import { AppError, asyncHandler } from '@/middleware/errorHandler';
import { authMiddleware } from '@/middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name must not exceed 100 characters'),
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Industry must not exceed 50 characters'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

// Helper function to generate JWT tokens
const generateTokens = (user: any) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionStatus: user.subscriptionStatus,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

// Helper function to hash password
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.bcrypt.rounds);
};

// Helper function to verify password
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Register endpoint
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, true, 'VALIDATION_ERROR');
  }

  const { email, password, firstName, lastName, companyName, industry } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    logSecurityEvent('Registration attempt with existing email', 'low', {
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    throw new AppError('User with this email already exists', 409, true, 'USER_EXISTS');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      companyName,
      industry,
      role: 'USER',
      subscriptionPlan: 'BASIC',
      subscriptionStatus: 'ACTIVE',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      companyName: true,
      industry: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Create session
  await prisma.userSession.create({
    data: {
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  logBusinessEvent('User registered', {
    userId: user.id,
    email: user.email,
    subscriptionPlan: user.subscriptionPlan,
    ip: req.ip,
  });

  res.status(201).json({
    message: 'User registered successfully',
    user,
    tokens: {
      accessToken,
      refreshToken,
    },
  });
}));

// Login endpoint
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, true, 'VALIDATION_ERROR');
  }

  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    logSecurityEvent('Login attempt with non-existent email', 'medium', {
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    throw new AppError('Invalid email or password', 401, true, 'INVALID_CREDENTIALS');
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    logSecurityEvent('Login attempt with invalid password', 'medium', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    throw new AppError('Invalid email or password', 401, true, 'INVALID_CREDENTIALS');
  }

  // Check if account is active
  if (user.subscriptionStatus !== 'ACTIVE') {
    logSecurityEvent('Login attempt with inactive account', 'low', {
      userId: user.id,
      subscriptionStatus: user.subscriptionStatus,
      ip: req.ip,
    });
    
    throw new AppError('Account is not active', 403, true, 'ACCOUNT_INACTIVE');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Create session
  await prisma.userSession.create({
    data: {
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  logBusinessEvent('User logged in', {
    userId: user.id,
    email: user.email,
    ip: req.ip,
  });

  // Return user data without password
  const { passwordHash, ...userWithoutPassword } = user;

  res.json({
    message: 'Login successful',
    user: userWithoutPassword,
    tokens: {
      accessToken,
      refreshToken,
    },
  });
}));

// Refresh token endpoint
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400, true, 'MISSING_REFRESH_TOKEN');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

    // Find session
    const session = await prisma.userSession.findFirst({
      where: {
        refreshToken,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
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

    if (!session) {
      logSecurityEvent('Invalid refresh token used', 'high', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      throw new AppError('Invalid refresh token', 401, true, 'INVALID_REFRESH_TOKEN');
    }

    // Check if user is still active
    if (session.user.subscriptionStatus !== 'ACTIVE') {
      throw new AppError('Account is not active', 403, true, 'ACCOUNT_INACTIVE');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.user);

    // Update session
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        token: accessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    res.json({
      message: 'Tokens refreshed successfully',
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logSecurityEvent('Invalid refresh token format', 'medium', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      throw new AppError('Invalid refresh token', 401, true, 'INVALID_REFRESH_TOKEN');
    }
    throw error;
  }
}));

// Logout endpoint
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.substring(7); // Remove 'Bearer ' prefix

  if (token) {
    // Deactivate session
    await prisma.userSession.updateMany({
      where: {
        token,
        userId: req.user!.id,
      },
      data: {
        isActive: false,
      },
    });
  }

  logBusinessEvent('User logged out', {
    userId: req.user!.id,
    ip: req.ip,
  });

  res.json({
    message: 'Logout successful',
  });
}));

// Logout from all devices
router.post('/logout-all', authMiddleware, asyncHandler(async (req, res) => {
  // Deactivate all sessions for the user
  await prisma.userSession.updateMany({
    where: {
      userId: req.user!.id,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  logBusinessEvent('User logged out from all devices', {
    userId: req.user!.id,
    ip: req.ip,
  });

  res.json({
    message: 'Logged out from all devices successfully',
  });
}));

// Change password endpoint
router.post('/change-password', authMiddleware, changePasswordValidation, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, true, 'VALIDATION_ERROR');
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });

  if (!user) {
    throw new AppError('User not found', 404, true, 'USER_NOT_FOUND');
  }

  // Verify current password
  const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    logSecurityEvent('Invalid current password in change password attempt', 'medium', {
      userId: user.id,
      ip: req.ip,
    });
    
    throw new AppError('Current password is incorrect', 400, true, 'INVALID_CURRENT_PASSWORD');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  });

  // Deactivate all sessions except current one
  const authHeader = req.headers.authorization;
  const currentToken = authHeader?.substring(7);

  await prisma.userSession.updateMany({
    where: {
      userId: user.id,
      isActive: true,
      token: { not: currentToken },
    },
    data: {
      isActive: false,
    },
  });

  logBusinessEvent('User changed password', {
    userId: user.id,
    ip: req.ip,
  });

  res.json({
    message: 'Password changed successfully',
  });
}));

// Get current user endpoint
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      profileImageUrl: true,
      phone: true,
      companyName: true,
      industry: true,
      timezone: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      lastLogin: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, true, 'USER_NOT_FOUND');
  }

  res.json({
    user,
  });
}));

export default router;

