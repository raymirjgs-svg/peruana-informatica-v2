# 🧪 E2E Testing con Playwright

Este directorio contiene pruebas End-to-End (E2E) para verificar la funcionalidad crítica de la aplicación.

## 📂 Estructura

- `shopping.spec.ts`: Pruebas de flujo de usuario (navegación, búsqueda, carrito).
- `admin-products.spec.ts`: Pruebas de administración (crear, editar, eliminar productos).

## 🚀 Cómo ejecutar los tests

### 1. Ejecutar todos los tests
```bash
npx playwright test
```

### 2. Ejecutar con interfaz visual (UI Mode)
Ideal para depurar y ver paso a paso.
```bash
npx playwright test --ui
```

### 3. Ejecutar un archivo específico
```bash
npx playwright test e2e/shopping.spec.ts
```

### 4. Ver reporte HTML
```bash
npx playwright show-report
```

## ⚙️ Configuración

La configuración se encuentra en `../playwright.config.ts`.
Por defecto, los tests intentarán levantar el servidor local en `http://localhost:3000`.
