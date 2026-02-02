# ✅ Checklist de Verificación y Guía de Solución de Problemas

Sigue estos pasos para validar tu despliegue en `200.58.98.122`.

## 1. Preparación del Servidor
- [ ] Renombrar `.env.production.template` a `.env.production`.
- [ ] Editar `.env.production` y colocar las contraseñas reales y URLs.
- [ ] Asegurar que el puerto 80 no esté ocupado por otro servicio (`netstat -tulpn | grep :80`).

## 2. Despliegue
- [ ] Ejecutar `./deploy.sh`.
- [ ] Verificar que no haya errores en la salida del script.
- [ ] Verificar estado de contenedores: `docker ps`. Deberían estar (frontend, backend, db, redis, nginx) en estado "Up".

## 3. Verificación de Conectividad (Backend)
Desde tu máquina local o el servidor:
```bash
# Prueba de salud de Nginx -> Backend
curl -I http://200.58.98.122/api/health

# Respuesta esperada: HTTP/1.1 200 OK
```

Verificar logs si falla:
```bash
docker logs peruana-backend --tail 50
```
Busca: "Connected to Database" y "Server running on ...".

## 4. Verificación Frontend
- [ ] Entrar a `http://200.58.98.122`.
- [ ] Abrir Developer Tools (F12) -> Network.
- [ ] Recargar la página.
- [ ] Verificar petición a `/api/categories`.
    - **Bien**: URL es `http://200.58.98.122/api/categories`.
    - **Mal**: URL es `http://200.58.98.122/api/api/categories` (Doble api).
    - **Mal**: Error 500 (Revisar logs del backend).

## 🚑 Troubleshooting (Solución de Problemas)

### Error 500 en todas las APIs
1. **Causa Probable**: El backend no puede conectar a la base de datos.
2. **Diagnóstico**:
   ```bash
   docker logs peruana-backend
   ```
   Si ves `SequelizeConnectionError`, verifica user/pass en `.env.production`.
3. **Solución**: Corrige `.env.production`, y reinicia: `docker-compose -f docker-compose.production.yml up -d backend`.

### Error "Invalid URL" o Doble /api/api
1. **Causa Probable**: Mala configuración en `.env.production` o caché del navegador.
2. **Solución**:
   - Asegura que en `.env.production`: `NEXT_PUBLIC_API_URL=http://200.58.98.122/api` (sin slash al final).
   - Reconstruye el frontend: `docker-compose -f docker-compose.production.yml up -d --build frontend`.

### Base de Datos Vacía
Si el backend arranca pero no devuelve productos:
```bash
# Entrar al contenedor del backend
docker exec -it peruana-backend sh

# Ejecutar script de seed (si tienes uno configurado en package.json)
npm run init-db
# o reiniciar datos
npm run seed
```

### Reinicio Total de Emergencia
Si todo falla y quieres empezar de cero (¡CUIDADO CON LOS DATOS!):
```bash
docker-compose -f docker-compose.production.yml down -v
./deploy.sh
```
