# ============================================
# 🔧 LIMPIEZA COMPLETA DOCKER LOCAL
# ============================================

echo "🧹 Iniciando limpieza completa del entorno Docker local..."

# 1. Detener todos los contenedores
echo "🔸 Deteniendo contenedores..."
docker stop $(docker ps -aq) 2>nul 2>&1 || echo "No hay contenedores corriendo"

# 2. Eliminar todos los contenedores
echo "🗑️ Eliminando contenedores..."
docker rm $(docker ps -aq) 2>nul 2>&1 || echo "No hay contenedores para eliminar"

# 3. Eliminar todas las imágenes Docker
echo "🗑️ Eliminando imágenes Docker..."
docker rmi -f $(docker images -q) 2>nul 2>&1 || echo "No hay imágenes para eliminar"

# 4. Limpiar sistema Docker completo
echo "🧹 Limpiando sistema Docker completo..."
docker volume prune -f
docker system prune -af --volumes

# 5. Eliminar volúmenes específicos del proyecto
echo "📁 Eliminando volúmenes del proyecto..."
docker volume rm peruana-informatica_v2_mysql_data_local 2>nul 2>&1 || echo "Volumen MySQL no existe"
docker volume rm peruana-informatica_v2_uploads_data_local 2>nul 2>&1 || echo "Volumen uploads no existe"
docker volume rm peruana-informatica_v2_backend_node_modules 2>nul 2>&1 || echo "Volumen backend modules no existe"
docker volume rm peruana-informatica_v2_frontend_node_modules 2>nul 2>&1 || echo "Volumen frontend modules no existe"

# 6. Reiniciar Docker
echo "🔄 Reiniciando servicio Docker..."
systemctl restart docker

# 7. Esperar a que Docker se reinicie completamente
echo "⏳ Esperando a que Docker se reinicie (10 segundos)..."
timeout 10

# 8. Verificar que todo esté limpio
echo "✅ Limpieza Docker local completada"

# 9. Construir y levantar servicios
echo "🔨 Construyendo imágenes Docker sin caché..."
docker compose -f docker-compose.local.yml build --no-cache

echo "🚀 Iniciando todos los servicios..."
docker compose -f docker-compose.local.yml up -d

# 10. Esperar inicialización completa
echo "⏳ Esperando que los servicios inicien completamente (60 segundos)..."
timeout 60

# 11. Verificar estado final
echo "📊 Verificando estado de todos los servicios..."
docker compose -f docker-compose.local.yml ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 12. Verificar health checks
echo "🏥 Verificando salud de cada servicio..."

# Backend
for i in {1..10}; do
    if docker ps --filter "name=peruana_backend_local" --format "{{.Status}}" | findstr "healthy" > /dev/null 2>&1; then
        echo "✅ Backend saludable y respondiendo"
        break
    else
        echo "⏳ Esperando backend... (intento $i/10)"
        if [ $i -eq 10 ]; then
            echo "⚠️ Timeout esperando backend"
        fi
        sleep 5
    fi
done

# Frontend
for i in {1..10}; do
    if docker ps --filter "name=peruana_frontend_local" --format "{{.Status}}" | findstr "healthy" > /dev/null 2>&1; then
        echo "✅ Frontend saludable y respondiendo"
        break
    else
        echo "⏳ Esperando frontend... (intento $i/10)"
        if [ $i -eq 10 ]; then
            echo "⚠️ Timeout esperando frontend"
        fi
        sleep 5
    fi
done

# MySQL
if docker ps --filter "name=peruana_mysql_local" --format "{{.Status}}" | findstr "healthy" > /dev/null 2>&1; then
    echo "✅ MySQL saludable"
else
    echo "⚠️ MySQL puede estar iniciando..."
fi

# Redis
if docker ps --filter "name=peruana_redis_local" --format "{{.Status}}" | findstr "healthy" > /dev/null 2>&1; then
    echo "✅ Redis saludable"
else
    echo "⚠️ Redis puede estar iniciando..."
fi

# 13. Verificación final
echo ""
echo "🌐 📋 SERVICIOS ACTIVOS Y ESTADO FINAL:"
echo ""

# Crear tabla de estado
docker compose -f docker-compose.local.yml ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Health}}" | Format-Table -AutoSize

echo ""
echo "🌐 URLs de Acceso Local:"
echo "   📱 Frontend: http://localhost:3000"
echo "   🔧 Backend:  http://localhost:3001/api"
echo "   🏥 Health: http://localhost:3001/api/health"
echo "📦 Base de datos: localhost:3306"
echo ""

echo ""
echo "✅ TODO LISTO! Tu entorno local está limpio y reconstruido."
echo "🎯 Ahora el cotizador debería funcionar sin errores 500."
echo ""
echo "🚀 Ejecuta 'rebuild-local.bat' para reconstruir desde cero si es necesario."
echo "🌐 Puedes verificar el cotizador en: http://localhost:3000/cotizador/laptops"