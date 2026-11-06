import { z } from "zod";

export const LoginSchema = z.object({
    username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginForm = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
    first_name: z.string().min(2, 'Nombre es requerido'),
    last_name: z.string().min(2, 'Apellido es requerido'),
    email: z.string().email('Correo inválido'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export type RegisterForm = z.infer<typeof RegisterSchema>;

export const CustomerLoginSchema = z.object({
    email: z.string().email('Correo inválido'),
    password: z.string().min(6, 'La contraseña es requerida'),
});

export type CustomerLoginForm = z.infer<typeof CustomerLoginSchema>;
