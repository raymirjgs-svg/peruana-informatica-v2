import { z } from 'zod';

/**
 * Schema de validación para el formulario de contacto
 */
export const contactSchema = z.object({
    fullName: z
        .string()
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre es demasiado largo')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo debe contener letras'),

    email: z
        .string()
        .min(1, 'El email es requerido')
        .email('Email inválido')
        .max(100, 'El email es demasiado largo')
        .toLowerCase(),

    phone: z
        .string()
        .regex(/^[0-9]{9}$/, 'El teléfono debe tener 9 dígitos')
        .optional()
        .or(z.literal('')),

    subject: z
        .string()
        .min(3, 'El asunto debe tener al menos 3 caracteres')
        .max(200, 'El asunto es demasiado largo')
        .optional(),

    message: z
        .string()
        .min(10, 'El mensaje debe tener al menos 10 caracteres')
        .max(1000, 'El mensaje es demasiado largo'),

    acceptTerms: z
        .boolean()
        .refine((val) => val === true, {
            message: 'Debes aceptar los términos y condiciones',
        }),
});

export type ContactFormData = z.infer<typeof contactSchema>;

/**
 * Schema de validación para cotizaciones de laptop
 */
export const laptopQuotationSchema = z.object({
    fullName: z
        .string()
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre es demasiado largo'),

    email: z
        .string()
        .email('Email inválido')
        .max(100, 'El email es demasiado largo'),

    phone: z
        .string()
        .regex(/^[0-9]{9}$/, 'El teléfono debe tener 9 dígitos'),

    company: z
        .string()
        .min(2, 'El nombre de la empresa es muy corto')
        .max(200, 'El nombre de la empresa es muy largo')
        .optional()
        .or(z.literal('')),

    // Especificaciones de la laptop
    usage: z
        .string()
        .min(2, 'Especifica el uso previsto')
        .max(500, 'Descripción demasiado larga'),

    processor: z
        .enum(['intel_i3', 'intel_i5', 'intel_i7', 'intel_i9', 'amd_ryzen3', 'amd_ryzen5', 'amd_ryzen7', 'amd_ryzen9', 'other']),

    ram: z
        .enum(['4gb', '8gb', '16gb', '32gb', '64gb']),

    storage: z
        .enum(['256gb_ssd', '512gb_ssd', '1tb_ssd', '2tb_ssd', '1tb_hdd', '2tb_hdd', 'hybrid']),

    gpu: z
        .enum(['integrated', 'dedicated_entry', 'dedicated_mid', 'dedicated_high', 'workstation'])
        .optional(),

    screenSize: z
        .enum(['13', '14', '15.6', '17'])
        .optional(),

    budget: z
        .number({
            message: 'El presupuesto es requerido y debe ser numérico'
        })
        .min(500, 'El presupuesto mínimo es S/. 500')
        .max(50000, 'El presupuesto máximo es S/. 50,000'),

    quantity: z
        .number()
        .int('La cantidad debe ser un número entero')
        .min(1, 'La cantidad mínima es 1')
        .max(100, 'La cantidad máxima es 100')
        .default(1),

    notes: z
        .string()
        .max(1000, 'Las notas son demasiado largas')
        .optional()
        .or(z.literal('')),
});

export type LaptopQuotationFormData = z.infer<typeof laptopQuotationSchema>;

/**
 * Schema de validación para cotizaciones de PC
 */
export const pcQuotationSchema = z.object({
    fullName: z
        .string()
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre es demasiado largo'),

    email: z
        .string()
        .email('Email inválido')
        .max(100, 'El email es demasiado largo'),

    phone: z
        .string()
        .regex(/^[0-9]{9}$/, 'El teléfono debe tener 9 dígitos'),

    company: z
        .string()
        .max(200, 'El nombre de la empresa es muy largo')
        .optional()
        .or(z.literal('')),

    // Componentes del PC
    usage: z
        .string()
        .min(2, 'Especifica el uso previsto')
        .max(500, 'Descripción demasiado larga'),

    processor: z.object({
        brand: z.enum(['intel', 'amd']),
        model: z.string().min(2, 'Especifica el modelo del procesador'),
    }),

    motherboard: z.object({
        chipset: z.string().min(2, 'Especifica el chipset'),
        formFactor: z.enum(['ATX', 'Micro-ATX', 'Mini-ITX']).optional(),
    }).optional(),

    ram: z.object({
        capacity: z.enum(['8gb', '16gb', '32gb', '64gb', '128gb']),
        type: z.enum(['DDR4', 'DDR5']),
        speed: z.string().optional(),
    }),

    storage: z.array(z.object({
        type: z.enum(['SSD_NVME', 'SSD_SATA', 'HDD']),
        capacity: z.string(),
    })).min(1, 'Debes especificar al menos un dispositivo de almacenamiento'),

    gpu: z.object({
        type: z.enum(['integrated', 'dedicated']),
        brand: z.enum(['nvidia', 'amd', 'intel']).optional(),
        model: z.string().optional(),
        vram: z.string().optional(),
    }).optional(),

    case: z.object({
        type: z.enum(['tower', 'mid-tower', 'mini-tower', 'htpc']).optional(),
        rgbLighting: z.boolean().optional(),
    }).optional(),

    psu: z.object({
        wattage: z.enum(['450w', '550w', '650w', '750w', '850w', '1000w']).optional(),
        certification: z.enum(['80Plus', '80Plus_Bronze', '80Plus_Silver', '80Plus_Gold', '80Plus_Platinum']).optional(),
    }).optional(),

    cooling: z.object({
        type: z.enum(['air', 'liquid_aio', 'custom_loop']).optional(),
    }).optional(),

    budget: z
        .number({
            message: 'El presupuesto es requerido y debe ser numérico'
        })
        .min(1000, 'El presupuesto mínimo es S/. 1,000')
        .max(100000, 'El presupuesto máximo es S/. 100,000'),

    quantity: z
        .number()
        .int()
        .min(1, 'La cantidad mínima es 1')
        .max(50, 'La cantidad máxima es 50')
        .default(1),

    notes: z
        .string()
        .max(1000, 'Las notas son demasiado largas')
        .optional()
        .or(z.literal('')),
});

export type PcQuotationFormData = z.infer<typeof pcQuotationSchema>;

/**
 * Schema de validación para cotizaciones genéricas
 */
export const quotationSchema = z.object({
    fullName: z
        .string()
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre es demasiado largo'),

    email: z
        .string()
        .email('Email inválido')
        .max(100, 'El email es demasiado largo'),

    phone: z
        .string()
        .regex(/^[0-9]{9}$/, 'El teléfono debe tener 9 dígitos'),

    company: z
        .string()
        .min(2, 'El nombre de la empresa es muy corto')
        .max(200, 'El nombre de la empresa es muy largo')
        .optional(),

    ruc: z
        .string()
        .regex(/^[0-9]{11}$/, 'El RUC debe tener 11 dígitos')
        .optional()
        .or(z.literal('')),

    notes: z
        .string()
        .max(500, 'Las notas son demasiado largas')
        .optional(),
});

export type QuotationFormData = z.infer<typeof quotationSchema>;

/**
 * Schema para newsletter/boletín
 */
export const newsletterSchema = z.object({
    email: z
        .string()
        .min(1, 'El email es requerido')
        .email('Email inválido')
        .max(100, 'El email es demasiado largo'),

    firstName: z
        .string()
        .min(2, 'El nombre es muy corto')
        .max(50, 'El nombre es muy largo')
        .optional(),
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;

/**
 * Schema para búsqueda de productos
 */
export const productSearchSchema = z.object({
    query: z
        .string()
        .min(2, 'La búsqueda debe tener al menos 2 caracteres')
        .max(100, 'La búsqueda es demasiado larga')
        .trim(),

    category: z.string().optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    inStock: z.boolean().optional(),
    sort: z.enum(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest']).optional(),
});

export type ProductSearchData = z.infer<typeof productSearchSchema>;

/**
 * Schema para reviews/reseñas (para futuro)
 */
export const reviewSchema = z.object({
    rating: z
        .number()
        .int()
        .min(1, 'La calificación mínima es 1')
        .max(5, 'La calificación máxima es 5'),

    title: z
        .string()
        .min(5, 'El título debe tener al menos 5 caracteres')
        .max(100, 'El título es demasiado largo'),

    comment: z
        .string()
        .min(20, 'El comentario debe tener al menos 20 caracteres')
        .max(500, 'El comentario es demasiado largo'),

    productId: z.number().int().positive(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

/**
 * Schema para login de admin
 */
export const adminLoginSchema = z.object({
    email: z
        .string()
        .min(1, 'El email es requerido')
        .email('Email inválido'),

    password: z
        .string()
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .max(100, 'La contraseña es demasiado larga'),

    rememberMe: z
        .boolean()
        .optional()
        .default(false),
});

export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
