import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extender Request interface localmente
interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        role?: string;
    };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }
        (req as AuthRequest).user = user;
        next();
    });
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as AuthRequest).user?.role;
    // Allow admin, super-admin, etc.
    if (userRole && ['admin', 'super-admin'].includes(userRole)) {
        next();
    } else {
        return res.status(403).json({ error: 'Role unauthorized' });
    }
};
