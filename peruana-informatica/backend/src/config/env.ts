import { z } from 'zod';
import { logger } from './logger';

const boolEnv = (defaultValue: boolean) =>
    z.preprocess(
        (value) => (value === undefined || value === '')
            ? undefined
            : ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase()),
        z.boolean().default(defaultValue)
    );

const schema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),

    JWT_SECRET: z.string().min(8, 'JWT_SECRET must have at least 8 characters'),

    DB_HOST: z.string().min(1).default('localhost'),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
    DB_NAME: z.string().min(1).default('peruana_informatica'),
    DB_USER: z.string().min(1).default('root'),
    DB_PASSWORD: z.string().default(''),

    REDIS_ENABLED: boolEnv(false),
    REDIS_URL: z.string().min(1).optional(),
    REDIS_HOST: z.string().min(1).optional(),
    REDIS_PORT: z.coerce.number().int().min(1).max(65535).optional(),

    FRONTEND_URL: z.string().min(1).optional(),
    ALLOWED_ORIGINS: z.string().min(1).optional(),
    CORS_ORIGIN: z.string().min(1).optional(),
    API_URL: z.string().min(1).optional(),
    ADMIN_URL: z.string().min(1).optional(),

    API_PERUANA_TOKEN: z.string().min(1).optional(),

    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    ADMIN_EMAIL: z.string().min(1).optional(),

    MP_ACCESS_TOKEN: z.string().min(1).optional(),
    MP_PUBLIC_KEY: z.string().min(1).optional(),
    MP_WEBHOOK_SECRET: z.string().min(1).optional(),

    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    GEMINI_API_KEY: z.string().min(1).optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
    UNSPLASH_ACCESS_KEY: z.string().min(1).optional(),

    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
    ENABLE_FILE_LOGGING: boolEnv(false),
    ENABLE_REQUEST_LOGGING: boolEnv(false),
    ENABLE_CRON: boolEnv(true),

    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(1000),
    SEARCH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(500),

    METRICS_TOKEN: z.string().min(1).optional()
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function validateEnv(): Env {
    if (cached) return cached;

    const parsed = schema.safeParse(process.env);

    if (!parsed.success) {
        const details = parsed.error.issues
            .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
            .join('\n');
        throw new Error(`FATAL: invalid environment configuration:\n${details}`);
    }

    const env = parsed.data;

    if (env.NODE_ENV === 'production') {
        if (!env.DB_PASSWORD) {
            logger.warn('Environment warning: DB_PASSWORD is empty in production');
        }
        if (!env.MP_WEBHOOK_SECRET) {
            logger.warn('Environment warning: MP_WEBHOOK_SECRET is not set; Mercado Pago webhooks will be rejected');
        }
        if (env.JWT_SECRET.length < 32) {
            logger.warn('Environment warning: JWT_SECRET should have at least 32 characters in production');
        }
    }

    if (!env.MP_ACCESS_TOKEN) {
        logger.warn('Environment warning: MP_ACCESS_TOKEN is not set; payment preference creation will fail');
    }

    if (!env.FRONTEND_URL && !env.ALLOWED_ORIGINS && !env.CORS_ORIGIN) {
        logger.warn('Environment warning: no CORS origin configured (FRONTEND_URL/ALLOWED_ORIGINS/CORS_ORIGIN)');
    }

    cached = env;
    return env;
}

export function requireJwtSecret(): string {
    return validateEnv().JWT_SECRET;
}
