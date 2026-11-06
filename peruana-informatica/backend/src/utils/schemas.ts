import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres').max(255),
  description: z.string().optional(),
  price: z.number().positive('El precio debe ser positivo'),
  stock: z.number().int().min(0, 'Stock no puede ser negativo').default(0),
  sku: z.string().optional(),
  brand_id: z.number().int().positive().optional(),
  category_id: z.number().int().positive().optional(),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createOrderSchema = z.object({
  customer_name: z.string().min(1, 'Nombre es requerido'),
  customer_email: z.string().email('Email inválido'),
  customer_phone: z.string().optional(),
  customer_document: z.string().optional(),
  items: z.array(z.object({
    product_id: z.number().int().positive('ID de producto inválido'),
    quantity: z.number().int().positive('Cantidad debe ser al menos 1'),
  })).min(1, 'Debe incluir al menos un producto'),
});

export const createReviewSchema = z.object({
  product_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(100),
  comment: z.string().min(10).max(1000),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional(),
});

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, 'Mensaje debe tener al menos 10 caracteres').max(1000),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
  phone: z.string().optional(),
});

export const createCouponSchema = z.object({
  code: z.string().min(3, 'Código debe tener al menos 3 caracteres').max(50),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive('Valor debe ser positivo'),
  min_purchase: z.number().optional(),
  max_uses: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Código es requerido'),
  purchase_amount: z.number().positive(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(100),
  slug: z.string().optional(),
  description: z.string().optional(),
  parent_id: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
});

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(100),
  slug: z.string().optional(),
  description: z.string().optional(),
  logo_url: z.string().url().optional(),
  is_active: z.boolean().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100, { message: 'El límite máximo es 100' }).default(20),
}).transform(data => ({
  ...data,
  limit: Math.min(data.limit, 100)
}));

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
