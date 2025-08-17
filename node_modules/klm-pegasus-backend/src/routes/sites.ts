import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '@/middleware/errorHandler';
import { requirePlan } from '@/middleware/auth';
import { logBusinessEvent } from '@/config/logger';

const router = express.Router();
const prisma = new PrismaClient();

// Validation rules
const createSiteValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Site name must be between 2 and 100 characters'),
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Industry must not exceed 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
];

const updateSiteValidation = [
  param('id').isUUID().withMessage('Invalid site ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Site name must be between 2 and 100 characters'),
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('domain')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Domain must not exceed 255 characters'),
  body('status')
    .optional()
    .isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
    .withMessage('Status must be DRAFT, PUBLISHED, or ARCHIVED'),
];

// Helper function to generate unique slug
const generateSlug = async (name: string, userId: string): Promise<string> => {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingSite = await prisma.site.findFirst({
      where: {
        slug,
        userId,
      },
    });

    if (!existingSite) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// Get all sites for the authenticated user
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const offset = (page - 1) * limit;
  const status = req.query.status as string;
  const search = req.query.search as string;

  // Build where clause
  const where: any = {
    userId: req.user!.id,
  };

  if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { domain: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get sites with pagination
  const [sites, total] = await Promise.all([
    prisma.site.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            pages: true,
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.site.count({ where }),
  ]);

  res.json({
    sites,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

// Get a specific site
router.get('/:id', param('id').isUUID(), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Invalid site ID', 400, true, 'VALIDATION_ERROR');
  }

  const site = await prisma.site.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
    include: {
      pages: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          pageType: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
      products: {
        select: {
          id: true,
          title: true,
          sku: true,
          price: true,
          status: true,
          stockQuantity: true,
          createdAt: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          pages: true,
          products: true,
          orders: true,
          customers: true,
        },
      },
    },
  });

  if (!site) {
    throw new AppError('Site not found', 404, true, 'SITE_NOT_FOUND');
  }

  res.json({ site });
}));

// Create a new site
router.post('/', createSiteValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, true, 'VALIDATION_ERROR');
  }

  const { name, slug: providedSlug, industry, description } = req.body;

  // Check site limits based on subscription plan
  const userSitesCount = await prisma.site.count({
    where: { userId: req.user!.id },
  });

  const siteLimits = {
    BASIC: 1,
    PREMIUM: 5,
    ENTERPRISE: -1, // Unlimited
  };

  const limit = siteLimits[req.user!.subscriptionPlan as keyof typeof siteLimits];
  if (limit !== -1 && userSitesCount >= limit) {
    throw new AppError(
      `Your ${req.user!.subscriptionPlan} plan allows only ${limit} site(s). Please upgrade to create more sites.`,
      403,
      true,
      'SITE_LIMIT_EXCEEDED'
    );
  }

  // Generate slug
  const slug = providedSlug || await generateSlug(name, req.user!.id);

  // Check if slug is unique globally
  const existingSlug = await prisma.site.findUnique({
    where: { slug },
  });

  if (existingSlug) {
    throw new AppError('This slug is already taken', 409, true, 'SLUG_TAKEN');
  }

  // Create site with default configuration
  const site = await prisma.site.create({
    data: {
      userId: req.user!.id,
      name,
      slug,
      status: 'DRAFT',
      configJson: {
        industry,
        description,
        theme: 'default',
        colors: {
          primary: '#3B82F6',
          secondary: '#64748B',
          accent: '#F59E0B',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        layout: {
          header: 'default',
          footer: 'default',
        },
      },
      seoConfig: {
        title: name,
        description: description || `Welcome to ${name}`,
        keywords: industry ? [industry] : [],
        ogImage: null,
      },
      analyticsConfig: {
        googleAnalytics: null,
        facebookPixel: null,
        customScripts: [],
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      configJson: true,
      seoConfig: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Create default pages
  const defaultPages = [
    {
      title: 'Home',
      slug: 'home',
      pageType: 'HOME',
      contentJson: {
        blocks: [
          {
            id: 'hero-1',
            type: 'hero',
            content: {
              title: `Welcome to ${name}`,
              subtitle: description || 'Your amazing online store',
              buttonText: 'Shop Now',
              buttonLink: '/products',
            },
          },
        ],
      },
    },
    {
      title: 'About',
      slug: 'about',
      pageType: 'ABOUT',
      contentJson: {
        blocks: [
          {
            id: 'text-1',
            type: 'text',
            content: {
              title: 'About Us',
              text: 'Tell your story here. What makes your business unique?',
            },
          },
        ],
      },
    },
    {
      title: 'Contact',
      slug: 'contact',
      pageType: 'CONTACT',
      contentJson: {
        blocks: [
          {
            id: 'contact-1',
            type: 'contact',
            content: {
              title: 'Get in Touch',
              email: req.user!.email,
              showForm: true,
            },
          },
        ],
      },
    },
  ];

  await Promise.all(
    defaultPages.map((page, index) =>
      prisma.page.create({
        data: {
          siteId: site.id,
          title: page.title,
          slug: page.slug,
          pageType: page.pageType as any,
          contentJson: page.contentJson,
          status: 'PUBLISHED',
          sortOrder: index,
          metaTitle: `${page.title} - ${name}`,
          metaDescription: `${page.title} page for ${name}`,
        },
      })
    )
  );

  logBusinessEvent('Site created', {
    userId: req.user!.id,
    siteId: site.id,
    siteName: name,
    slug,
    subscriptionPlan: req.user!.subscriptionPlan,
  });

  res.status(201).json({
    message: 'Site created successfully',
    site,
  });
}));

// Update a site
router.put('/:id', updateSiteValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, true, 'VALIDATION_ERROR');
  }

  const { name, slug, domain, status, configJson, brandingJson, seoConfig } = req.body;

  // Check if site exists and belongs to user
  const existingSite = await prisma.site.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });

  if (!existingSite) {
    throw new AppError('Site not found', 404, true, 'SITE_NOT_FOUND');
  }

  // Check if slug is unique (if provided and different)
  if (slug && slug !== existingSite.slug) {
    const existingSlug = await prisma.site.findFirst({
      where: {
        slug,
        id: { not: req.params.id },
      },
    });

    if (existingSlug) {
      throw new AppError('This slug is already taken', 409, true, 'SLUG_TAKEN');
    }
  }

  // Prepare update data
  const updateData: any = {};
  if (name) updateData.name = name;
  if (slug) updateData.slug = slug;
  if (domain) updateData.domain = domain;
  if (status) updateData.status = status;
  if (configJson) updateData.configJson = configJson;
  if (brandingJson) updateData.brandingJson = brandingJson;
  if (seoConfig) updateData.seoConfig = seoConfig;

  // Set published date if publishing for the first time
  if (status === 'PUBLISHED' && existingSite.status !== 'PUBLISHED') {
    updateData.publishedAt = new Date();
  }

  // Update site
  const site = await prisma.site.update({
    where: { id: req.params.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      status: true,
      publishedAt: true,
      configJson: true,
      brandingJson: true,
      seoConfig: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logBusinessEvent('Site updated', {
    userId: req.user!.id,
    siteId: site.id,
    changes: Object.keys(updateData),
  });

  res.json({
    message: 'Site updated successfully',
    site,
  });
}));

// Delete a site
router.delete('/:id', param('id').isUUID(), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Invalid site ID', 400, true, 'VALIDATION_ERROR');
  }

  // Check if site exists and belongs to user
  const site = await prisma.site.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });

  if (!site) {
    throw new AppError('Site not found', 404, true, 'SITE_NOT_FOUND');
  }

  // Prevent deletion if there are orders (for data integrity)
  if (site._count.orders > 0) {
    throw new AppError(
      'Cannot delete site with existing orders. Archive the site instead.',
      400,
      true,
      'SITE_HAS_ORDERS'
    );
  }

  // Delete site (cascade will handle related records)
  await prisma.site.delete({
    where: { id: req.params.id },
  });

  logBusinessEvent('Site deleted', {
    userId: req.user!.id,
    siteId: site.id,
    siteName: site.name,
  });

  res.json({
    message: 'Site deleted successfully',
  });
}));

// Duplicate a site
router.post('/:id/duplicate', param('id').isUUID(), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Invalid site ID', 400, true, 'VALIDATION_ERROR');
  }

  // Check site limits
  const userSitesCount = await prisma.site.count({
    where: { userId: req.user!.id },
  });

  const siteLimits = {
    BASIC: 1,
    PREMIUM: 5,
    ENTERPRISE: -1,
  };

  const limit = siteLimits[req.user!.subscriptionPlan as keyof typeof siteLimits];
  if (limit !== -1 && userSitesCount >= limit) {
    throw new AppError(
      `Your ${req.user!.subscriptionPlan} plan allows only ${limit} site(s). Please upgrade to create more sites.`,
      403,
      true,
      'SITE_LIMIT_EXCEEDED'
    );
  }

  // Get original site
  const originalSite = await prisma.site.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
    include: {
      pages: true,
      products: true,
    },
  });

  if (!originalSite) {
    throw new AppError('Site not found', 404, true, 'SITE_NOT_FOUND');
  }

  // Generate new slug
  const newSlug = await generateSlug(`${originalSite.name} Copy`, req.user!.id);

  // Create duplicated site
  const duplicatedSite = await prisma.site.create({
    data: {
      userId: req.user!.id,
      name: `${originalSite.name} Copy`,
      slug: newSlug,
      status: 'DRAFT',
      configJson: originalSite.configJson,
      brandingJson: originalSite.brandingJson,
      seoConfig: originalSite.seoConfig,
      analyticsConfig: originalSite.analyticsConfig,
      customCss: originalSite.customCss,
      customJs: originalSite.customJs,
    },
  });

  // Duplicate pages
  if (originalSite.pages.length > 0) {
    await Promise.all(
      originalSite.pages.map(page =>
        prisma.page.create({
          data: {
            siteId: duplicatedSite.id,
            title: page.title,
            slug: page.slug,
            contentJson: page.contentJson,
            metaTitle: page.metaTitle,
            metaDescription: page.metaDescription,
            metaKeywords: page.metaKeywords,
            status: page.status,
            pageType: page.pageType,
            sortOrder: page.sortOrder,
          },
        })
      )
    );
  }

  // Duplicate products
  if (originalSite.products.length > 0) {
    await Promise.all(
      originalSite.products.map(product =>
        prisma.product.create({
          data: {
            siteId: duplicatedSite.id,
            sku: `${product.sku}-copy`,
            title: product.title,
            description: product.description,
            shortDescription: product.shortDescription,
            price: product.price,
            comparePrice: product.comparePrice,
            costPrice: product.costPrice,
            stockQuantity: 0, // Reset stock for duplicated products
            trackInventory: product.trackInventory,
            weight: product.weight,
            dimensionsJson: product.dimensionsJson,
            imagesJson: product.imagesJson,
            variantsJson: product.variantsJson,
            seoTitle: product.seoTitle,
            seoDescription: product.seoDescription,
            tags: product.tags,
            categoryId: product.categoryId,
            status: 'INACTIVE', // Set as inactive for review
            featured: false,
          },
        })
      )
    );
  }

  logBusinessEvent('Site duplicated', {
    userId: req.user!.id,
    originalSiteId: originalSite.id,
    duplicatedSiteId: duplicatedSite.id,
    newSlug,
  });

  res.status(201).json({
    message: 'Site duplicated successfully',
    site: {
      id: duplicatedSite.id,
      name: duplicatedSite.name,
      slug: duplicatedSite.slug,
      status: duplicatedSite.status,
      createdAt: duplicatedSite.createdAt,
    },
  });
}));

export default router;

