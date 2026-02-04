# 🔄 RECONSTRUCCIÓN COMPLETA DESDE CERO

echo "🔄 Iniciando reconstrucción completa desde cero..."

# 1. Detener cualquier servicio restante
docker compose -f docker-compose.local.yml down 2>/dev/null || echo "No hay contenedores activos"

# 2. Construir desde cero sin caché
echo "🔨 Construyendo imágenes Docker desde cero (sin caché)..."
docker compose -f docker-compose.local.yml build --no-cache --pull

# 3. Iniciar servicios
echo "🚀 Iniciando todos los servicios..."
docker compose -f docker-compose.local.yml up -d

# 4. Esperar a que todo esté saludable
echo "⏳ Esperando inicialización completa (60 segundos)..."
sleep 60

# 5. Verificar estado final
echo "📊 Verificando estado final de todos los servicios..."

echo "=== ESTADO DE CONTENEDORES ==="
docker compose -f docker-compose.local.yml ps

echo "=== HEALTH CHECKS ==="
docker compose -f docker-compose.local.yml ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "=== ACCESO DESDE LOCAL ==="
echo "🌐 Frontend: http://localhost:3000"
echo "⚙️ Backend:  http://localhost:3001/api"
echo "🏥 Health Check: http://localhost:3001/api/health"
echo ""
echo "✅ Reconstrucción completada. Tu aplicación local estará funcionando perfectamente."

# 6. Abrir navegador automáticamente
echo "🌐 Abriendo navegador en http://localhost:3000"
start http://localhost:3000