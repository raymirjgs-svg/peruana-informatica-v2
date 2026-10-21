import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';
import generatedPaths from './openapi.paths.json';

type Operation = Record<string, unknown>;
type Paths = Record<string, Record<string, Operation>>;

const schemas = {
  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string' },
      errors: { type: 'array', items: { type: 'object' } },
    },
  },
  Pagination: {
    type: 'object',
    properties: {
      total: { type: 'integer' },
      totalPages: { type: 'integer' },
      page: { type: 'integer' },
      limit: { type: 'integer' },
    },
  },
  Category: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string', nullable: true },
      image: { type: 'string', nullable: true },
    },
  },
  Brand: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      slug: { type: 'string' },
      logo: { type: 'string', nullable: true },
    },
  },
  Product: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string', nullable: true },
      price: { type: 'number' },
      stock: { type: 'integer' },
      is_active: { type: 'boolean' },
      is_featured: { type: 'boolean' },
      image: { type: 'string', nullable: true },
      productBrand: { $ref: '#/components/schemas/Brand' },
      productCategory: { $ref: '#/components/schemas/Category' },
      images: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            cod_galeria: { type: 'integer' },
            imagen: { type: 'string' },
          },
        },
      },
    },
  },
  ProductList: {
    allOf: [
      { $ref: '#/components/schemas/Pagination' },
      {
        type: 'object',
        properties: {
          products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
        },
      },
    ],
  },
  ProductInput: {
    type: 'object',
    required: ['name', 'price', 'stock'],
    properties: {
      codigo_interno: { type: 'string' },
      erp_name: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number' },
      stock: { type: 'integer' },
      category_id: { type: 'integer', nullable: true },
      brand_id: { type: 'integer', nullable: true },
      image: { type: 'string' },
      keywords: { type: 'string' },
      seo_title: { type: 'string' },
      seo_description: { type: 'string' },
      subcategory_ids: { type: 'array', items: { type: 'integer' } },
      is_active: { type: 'boolean' },
      is_featured: { type: 'boolean' },
    },
  },
  ProductBulkUpdate: {
    type: 'object',
    required: ['product_ids'],
    properties: {
      product_ids: { type: 'array', items: { type: 'integer' } },
      category_id: { type: 'integer', nullable: true },
      brand_id: { type: 'integer', nullable: true },
      is_active: { type: 'boolean' },
      is_featured: { type: 'boolean' },
    },
  },
  User: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      email: { type: 'string' },
      name: { type: 'string' },
      role: { type: 'string', enum: ['admin', 'customer'] },
    },
  },
  AuthResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      data: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          refreshToken: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', format: 'password' },
    },
  },
  RegisterRequest: {
    type: 'object',
    required: ['email', 'password', 'name'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', format: 'password', minLength: 8 },
      name: { type: 'string' },
      phone: { type: 'string' },
    },
  },
  Order: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      order_code: { type: 'string' },
      status: { type: 'string' },
      total: { type: 'number' },
      customer_name: { type: 'string' },
      created_at: { type: 'string', format: 'date-time' },
    },
  },
  OrderList: {
    type: 'object',
    properties: {
      orders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
      total: { type: 'integer' },
      totalPages: { type: 'integer' },
    },
  },
  ReviewInput: {
    type: 'object',
    required: ['product_id', 'rating'],
    properties: {
      product_id: { type: 'integer' },
      rating: { type: 'integer', minimum: 1, maximum: 5 },
      comment: { type: 'string' },
    },
  },
  CouponApplyRequest: {
    type: 'object',
    required: ['code'],
    properties: {
      code: { type: 'string' },
      subtotal: { type: 'number' },
    },
  },
};

const jsonBody = (schema: string, required = true) => ({
  required,
  content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}` } } },
});

const ok = (description: string, schema?: string) => ({
  description,
  ...(schema ? { content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}` } } } } : {}),
});

const errorResponse = (description: string) => ({ description });

const overrides: Paths = {
  '/auth/login': {
    post: {
      summary: 'Log in a customer and receive JWT tokens',
      requestBody: jsonBody('LoginRequest'),
      responses: { '200': ok('Authenticated', 'AuthResponse'), '401': errorResponse('Invalid credentials') },
    },
  },
  '/auth/register': {
    post: {
      summary: 'Register a customer account',
      requestBody: jsonBody('RegisterRequest'),
      responses: { '201': ok('Account created', 'AuthResponse'), '409': errorResponse('Email already registered') },
    },
  },
  '/auth/social-login': {
    post: {
      summary: 'Log in with a social provider',
      requestBody: jsonBody('LoginRequest', false),
      responses: { '200': ok('Authenticated', 'AuthResponse') },
    },
  },
  '/admin/login': {
    post: {
      summary: 'Log in an admin and receive a JWT',
      requestBody: jsonBody('LoginRequest'),
      responses: { '200': ok('Authenticated', 'AuthResponse'), '401': errorResponse('Invalid credentials') },
      security: [],
    },
  },
  '/admin/me': {
    get: {
      summary: 'Return the authenticated admin profile',
      responses: { '200': ok('Admin profile', 'User'), '401': errorResponse('Missing or invalid token') },
    },
  },
  '/products': {
    get: {
      summary: 'List public products with filters and pagination',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'category', in: 'query', schema: { type: 'string' } },
        { name: 'brand', in: 'query', schema: { type: 'string' } },
        { name: 'sort', in: 'query', schema: { type: 'string' } },
        { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
      ],
      responses: { '200': ok('Product page', 'ProductList') },
    },
  },
  '/products/{id}': {
    get: { summary: 'Get a public product by id', responses: { '200': ok('Product', 'Product'), '404': errorResponse('Not found') } },
  },
  '/products/slug/{slug}': {
    get: { summary: 'Get a public product by slug', responses: { '200': ok('Product', 'Product'), '404': errorResponse('Not found') } },
  },
  '/categories': {
    get: { summary: 'List active categories', responses: { '200': ok('Categories') } },
  },
  '/brands': {
    get: { summary: 'List active brands', responses: { '200': ok('Brands') } },
  },
  '/admin/products': {
    get: { summary: 'List products for the admin panel', responses: { '200': ok('Product page', 'ProductList') } },
    post: { summary: 'Create a product', requestBody: jsonBody('ProductInput'), responses: { '201': ok('Created', 'Product') } },
  },
  '/admin/products/{id}': {
    get: { summary: 'Get a product by id', responses: { '200': ok('Product', 'Product'), '404': errorResponse('Not found') } },
    put: { summary: 'Update a product', requestBody: jsonBody('ProductInput', false), responses: { '200': ok('Updated', 'Product') } },
    delete: { summary: 'Delete a product', responses: { '200': ok('Deleted') } },
  },
  '/admin/products/bulk-update': {
    patch: { summary: 'Apply changes to many products', requestBody: jsonBody('ProductBulkUpdate'), responses: { '200': ok('Updated') } },
  },
  '/orders': {
    post: { summary: 'Create an order', requestBody: jsonBody('ProductInput', false), responses: { '201': ok('Created', 'Order') } },
  },
  '/admin/orders': {
    get: { summary: 'List orders for the admin panel', responses: { '200': ok('Order page', 'OrderList') } },
  },
  '/coupons/apply': {
    post: { summary: 'Apply a coupon to a cart subtotal', requestBody: jsonBody('CouponApplyRequest'), responses: { '200': ok('Coupon applied') } },
  },
  '/reviews': {
    post: { summary: 'Create a product review', requestBody: jsonBody('ReviewInput'), responses: { '201': ok('Created') } },
  },
};

const paths = JSON.parse(JSON.stringify(generatedPaths)) as Paths;
const skipped: string[] = [];

for (const [routePath, operations] of Object.entries(overrides)) {
  for (const [method, operation] of Object.entries(operations)) {
    const target = paths[routePath];
    if (!target || !target[method]) {
      skipped.push(`${method.toUpperCase()} ${routePath}`);
      continue;
    }
    target[method] = { ...target[method], ...operation };
  }
}

if (skipped.length) {
  console.warn(`[swagger] documented operations not mounted: ${skipped.join(', ')}`);
}

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Peruana de Informática API',
      version,
      description: 'OpenAPI specification generated from the mounted Express routers.',
      contact: { name: 'API Support', email: 'support@peruanainformatica.com' },
    },
    servers: [
      { url: 'http://localhost:3001/api', description: 'Local server' },
      { url: 'https://peruanainformatica.com/api', description: 'Production server' },
    ],
    tags: [
      'Products',
      'Categories',
      'Brands',
      'Orders',
      'Payments',
      'Auth',
      'Customers',
      'Blog',
      'SEO',
      'Quotations',
      'Cart',
      'Wishlist',
      'Reviews',
      'Coupons',
      'Admin Auth',
      'Admin Products',
      'Admin Orders',
      'Admin Settings',
      'Admin Analytics',
      'Admin System',
    ].map((name) => ({ name })),
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas,
    },
    paths,
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
