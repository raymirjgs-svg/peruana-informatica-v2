# 🔐 Sistema de Autenticación

## Descripción

El sistema implementa autenticación basada en JWT (JSON Web Tokens) para proteger las rutas de administración.

---

## ⚙️ Configuración

### Variables de entorno

En `backend/.env`:

```env
# Secreto para firmar tokens JWT
JWT_SECRET=tu-secreto-super-seguro-aqui

# Tiempo de expiración del token
JWT_EXPIRES_IN=24h

# Tiempo de expiración del refresh token
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 🗂️ Modelo de Usuario

### User (Admin)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| email | STRING | Email único |
| password | STRING | Hash bcrypt |
| name | STRING | Nombre completo |
| role | ENUM | admin, operator, viewer |
| is_active | BOOLEAN | Usuario activo |
| last_login | DATETIME | Último acceso |
| created_at | DATETIME | Fecha creación |

### Roles

| Rol | Permisos |
|-----|----------|
| admin | Todo: productos, pedidos, usuarios, configuración |
| operator | Productos, pedidos, blog |
| viewer | Solo lectura |

---

## 🔌 API Endpoints

### Login

```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "admin@peruanainformatica.com",
  "password": "tu-password"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@peruanainformatica.com",
    "name": "Administrador",
    "role": "admin"
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

### Refresh Token

```http
POST /api/auth/refresh
```

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

### Obtener perfil

```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Cambiar contraseña

```http
POST /api/auth/change-password
Authorization: Bearer {token}
```

**Body:**
```json
{
  "currentPassword": "password-actual",
  "newPassword": "nuevo-password"
}
```

---

## 🛡️ Middleware de Autenticación

### authMiddleware

**Archivo:** `backend/src/middleware/auth.ts`

```typescript
import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};
```

### roleMiddleware

```typescript
export const roleMiddleware = (...roles: string[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    next();
  };
};
```

### Uso en rutas

```typescript
import { authMiddleware, roleMiddleware } from '../middleware/auth';

// Ruta protegida solo para admins
router.delete('/users/:id', 
  authMiddleware, 
  roleMiddleware('admin'), 
  deleteUser
);

// Ruta para admins y operadores
router.post('/products', 
  authMiddleware, 
  roleMiddleware('admin', 'operator'), 
  createProduct
);
```

---

## 🖥️ Frontend - Manejo de Auth

### AuthContext

**Archivo:** `frontend/src/context/AuthContext.tsx`

```tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  
  // Cargar token de localStorage al iniciar
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken);
    }
  }, []);
  
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
  };
  
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };
  
  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Uso en componentes

```tsx
import { useAuth } from '@/context/AuthContext';

function AdminDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return (
    <div>
      <h1>Hola, {user.name}</h1>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
```

### Interceptor de Axios

```typescript
// Agregar token a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejar errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 🔒 Seguridad

### Almacenamiento de contraseñas

```typescript
import bcrypt from 'bcrypt';

// Al crear usuario
const hashedPassword = await bcrypt.hash(password, 12);

// Al verificar login
const isValid = await bcrypt.compare(password, user.password);
```

### Estructura del JWT

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": 1,
    "email": "admin@example.com",
    "role": "admin",
    "iat": 1703350000,
    "exp": 1703436400
  }
}
```

---

## 📱 Flujo de Login

```
┌─────────────┐
│ Usuario en  │
│ /admin      │
└──────┬──────┘
       │ No autenticado
       ▼
┌─────────────┐
│ Redirigir a │
│ /login      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Ingresar    │
│ credenciales│
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ POST        │────►│ Validar     │
│ /auth/login │     │ credenciales│
└─────────────┘     └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │ Credenciales│          │ Credenciales│
       │ válidas     │          │ inválidas   │
       └──────┬──────┘          └──────┬──────┘
              │                        │
              ▼                        ▼
       ┌─────────────┐          ┌─────────────┐
       │ Generar JWT │          │ Mostrar     │
       │ + Refresh   │          │ error       │
       └──────┬──────┘          └─────────────┘
              │
              ▼
       ┌─────────────┐
       │ Guardar en  │
       │ localStorage│
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │ Redirigir a │
       │ /admin      │
       └─────────────┘
```

---

## 🐛 Solución de Problemas

### Error: Token expirado
- El frontend debe refrescar automáticamente
- O redirigir a login

### Error: Token inválido
- Puede haber sido manipulado
- JWT_SECRET cambió en el servidor
- Limpiar localStorage y re-login

### Error: Acceso denegado (403)
- El usuario no tiene el rol necesario
- Verificar permisos en el panel admin

### No se guarda la sesión
- Verificar localStorage habilitado
- Verificar que el token se guarde correctamente
