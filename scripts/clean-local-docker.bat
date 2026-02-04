# 🔧 LIMPIEZA COMPLETA - DOCKER LOCAL

echo "🧹 Iniciando limpieza completa del entorno Docker local..."

# 1. Detener y eliminar todos los contenedores
echo "🔸 Deteniendo contenedores..."
docker compose -f docker-compose.local.yml down 2>/dev/null || echo "No hay contenedores corriendo"

# 2. Eliminar todos los contenedores (incluyendo los que podrían estar huérfanos)
echo "🗑️ Eliminando contenedores huérfanos..."
docker rm -f $(docker ps -aq) 2>/dev/null || echo "No hay contenedores para eliminar"

# 3. Eliminar todas las imágenes Docker
echo "🗑️ Eliminando imágenes Docker..."
docker rmi -f $(docker images -q) 2>/dev/null || echo "No hay imágenes para eliminar"

# 4. Limpiar sistema Docker completo
echo "🧹 Limpiando sistema Docker..."
docker system prune -af --volumes

# 5. Eliminar todos los volúmenes del proyecto local
echo "📦 Eliminando volúmenes locales..."
docker volume rm peruana-informatica_v2_mysql_data_local 2>/dev/null || echo "Volumen mysql no existe"
docker volume rm peruana-informatica_v2_uploads_data_local 2>/dev/null || echo "Volumen uploads no existe"
docker volume rm peruana-informatica_v2_backend_node_modules 2>/dev/null || echo "Volumen backend modules no existe"
docker volume rm peruana-informatica_v2_frontend_node_modules 2>/dev/null || echo "Volumen frontend modules no existe"

echo "✅ Limpieza Docker local completada"

# 6. Verificar que todo esté limpio
echo "🔍 Verificando limpieza..."
docker ps -a
docker images
docker volume ls