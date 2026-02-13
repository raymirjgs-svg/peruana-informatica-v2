import { 
    createProductSchema, 
    createOrderSchema, 
    loginSchema, 
    registerSchema,
    createCouponSchema,
    validateCouponSchema,
    contactFormSchema,
    createCategorySchema,
    paginationSchema
} from '../utils/schemas';

describe('Zod Schemas Validation', () => {
    describe('createProductSchema', () => {
        it('should validate a valid product', () => {
            const product = {
                name: 'Laptop HP',
                price: 1500,
                stock: 10,
                category_id: 1
            };
            expect(() => createProductSchema.parse(product)).not.toThrow();
        });

        it('should reject empty name', () => {
            const product = { name: '', price: 100 };
            expect(() => createProductSchema.parse(product)).toThrow();
        });

        it('should reject negative price', () => {
            const product = { name: 'Test', price: -100 };
            expect(() => createProductSchema.parse(product)).toThrow();
        });

        it('should reject name too short', () => {
            const product = { name: 'ab', price: 100 };
            expect(() => createProductSchema.parse(product)).toThrow();
        });

        it('should accept optional fields', () => {
            const product = {
                name: 'Laptop',
                price: 1500,
                description: 'Test description',
                is_featured: true
            };
            expect(() => createProductSchema.parse(product)).not.toThrow();
        });
    });

    describe('createOrderSchema', () => {
        it('should validate a valid order', () => {
            const order = {
                customer_name: 'Juan Perez',
                customer_email: 'juan@test.com',
                items: [
                    { product_id: 1, quantity: 2 },
                    { product_id: 2, quantity: 1 }
                ]
            };
            expect(() => createOrderSchema.parse(order)).not.toThrow();
        });

        it('should reject empty items array', () => {
            const order = {
                customer_name: 'Juan',
                customer_email: 'juan@test.com',
                items: []
            };
            expect(() => createOrderSchema.parse(order)).toThrow();
        });

        it('should reject invalid email', () => {
            const order = {
                customer_name: 'Juan',
                customer_email: 'invalid-email',
                items: [{ product_id: 1, quantity: 1 }]
            };
            expect(() => createOrderSchema.parse(order)).toThrow();
        });

        it('should reject zero quantity', () => {
            const order = {
                customer_name: 'Juan',
                customer_email: 'juan@test.com',
                items: [{ product_id: 1, quantity: 0 }]
            };
            expect(() => createOrderSchema.parse(order)).toThrow();
        });
    });

    describe('loginSchema', () => {
        it('should validate valid credentials', () => {
            const credentials = {
                email: 'test@test.com',
                password: 'password123'
            };
            expect(() => loginSchema.parse(credentials)).not.toThrow();
        });

        it('should reject invalid email', () => {
            const credentials = {
                email: 'invalid',
                password: 'password123'
            };
            expect(() => loginSchema.parse(credentials)).toThrow();
        });

        it('should reject short password', () => {
            const credentials = {
                email: 'test@test.com',
                password: '123'
            };
            expect(() => loginSchema.parse(credentials)).toThrow();
        });
    });

    describe('registerSchema', () => {
        it('should validate valid registration data', () => {
            const data = {
                name: 'Juan Perez',
                email: 'juan@test.com',
                password: 'Password123'
            };
            expect(() => registerSchema.parse(data)).not.toThrow();
        });

        it('should reject short password', () => {
            const data = {
                name: 'Juan',
                email: 'juan@test.com',
                password: '123'
            };
            expect(() => registerSchema.parse(data)).toThrow();
        });
    });

    describe('createCouponSchema', () => {
        it('should validate percentage coupon', () => {
            const coupon = {
                code: 'DESCUENTO10',
                type: 'percentage',
                value: 10
            };
            expect(() => createCouponSchema.parse(coupon)).not.toThrow();
        });

        it('should validate fixed coupon', () => {
            const coupon = {
                code: 'FIJO50',
                type: 'fixed',
                value: 50
            };
            expect(() => createCouponSchema.parse(coupon)).not.toThrow();
        });

        it('should reject invalid type', () => {
            const coupon = {
                code: 'TEST',
                type: 'invalid',
                value: 10
            };
            expect(() => createCouponSchema.parse(coupon)).toThrow();
        });

        it('should reject negative value', () => {
            const coupon = {
                code: 'TEST',
                type: 'percentage',
                value: -10
            };
            expect(() => createCouponSchema.parse(coupon)).toThrow();
        });
    });

    describe('validateCouponSchema', () => {
        it('should validate coupon validation request', () => {
            const data = {
                code: 'DESCUENTO10',
                purchase_amount: 100
            };
            expect(() => validateCouponSchema.parse(data)).not.toThrow();
        });

        it('should reject zero purchase amount', () => {
            const data = {
                code: 'DESCUENTO10',
                purchase_amount: 0
            };
            expect(() => validateCouponSchema.parse(data)).toThrow();
        });
    });

    describe('contactFormSchema', () => {
        it('should validate valid contact form', () => {
            const data = {
                name: 'Juan Perez',
                email: 'juan@test.com',
                message: 'This is a test message with enough characters'
            };
            expect(() => contactFormSchema.parse(data)).not.toThrow();
        });

        it('should reject short message', () => {
            const data = {
                name: 'Juan',
                email: 'juan@test.com',
                message: 'Short'
            };
            expect(() => contactFormSchema.parse(data)).toThrow();
        });
    });

    describe('paginationSchema', () => {
        it('should validate default pagination', () => {
            const data = {};
            const result = paginationSchema.parse(data);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
        });

        it('should parse string numbers', () => {
            const data = { page: '2', limit: '50' };
            const result = paginationSchema.parse(data);
            expect(result.page).toBe(2);
            expect(result.limit).toBe(50);
        });

        it('should cap limit at 100', () => {
            const data = { limit: '50' };
            const result = paginationSchema.parse(data);
            expect(result.limit).toBe(50);
        });
    });
});
