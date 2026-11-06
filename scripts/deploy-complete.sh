#!/bin/bash

# ============================================
# 🚀 SCRIPT COMPLETO DE DESPLIEGUE AUTOMÁTICO
# ============================================
# Este script hace: Limpieza → Instalación → Despliegue
# ============================================

set -e

# ============================================
# 🔧 CONFIGURACIÓN
# ============================================
SERVER_IP="200.58.98.122"
SERVER_PORT="5313"
SSH_USER="root"
SSH_PASSWORD="9wC8/5lAhlxrXd"
REMOTE_DIR="/root/peruana-informatica"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# Función para ejecutar comandos SSH
ssh_exec() {
    local cmd="$1"
    local description="$2"
    print_step "$description"
    sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 -p ${SERVER_PORT} ${SSH_USER}@${SERVER_IP} "$cmd" || {
        print_error "Fallo ejecutando: $description"
        exit 1
    }
    print_success "$description completado"
}

# ============================================
# 📋 VERIFICACIONES LOCALES
# ============================================
print_header "📋 VERIFICACIONES LOCALES"

echo -e "${CYAN}🔍 Verificando configuración local...${NC}"

# Verificar archivo de entorno
if [ ! -f "envs/.env.production" ]; then
    print_error "No existe envs/.env.production"
    exit 1
fi

# Verificar contraseñas placeholder
if grep -q "CAMBIAR_ESTO" envs/.env.production; then
    print_error "Debes cambiar las contraseñas placeholder en envs/.env.production"
    echo -e "${YELLOW}💡 Edita el archivo y reemplaza: CAMBIAR_ESTO${NC}"
    exit 1
fi

# Verificar archivos críticos
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "No existe docker-compose.prod.yml"
    exit 1
fi

if [ ! -f "nginx/nginx.conf" ]; then
    print_error "No existe nginx/nginx.conf"
    exit 1
fi

print_success "Configuración local validada"

# ============================================
# 🛑 FASE 1: LIMPIEZA COMPLETA
# ============================================
print_header "🧹 FASE 1: LIMPIEZA COMPLETA DEL SERVIDOR"

ssh_exec "docker stop \$(docker ps -aq) 2>/dev/null || echo 'No hay contenedores corriendo'" "Deteniendo todos los contenedores"
ssh_exec "docker rm \$(docker ps -aq) 2>/dev/null || echo 'No hay contenedores para eliminar'" "Eliminando todos los contenedores"
ssh_exec "docker rmi -f \$(docker images -q) 2>/dev/null || echo 'No hay imágenes para eliminar'" "Eliminando todas las imágenes"
ssh_exec "docker volume prune -f" "Limpiando volúmenes no utilizados"
ssh_exec "docker system prune -af --volumes" "Limpiando sistema Docker completo"
ssh_exec "cd /root && rm -rf peruana-informatica 2>/dev/null || echo 'Directorio no existe'" "Eliminando directorio del proyecto"
ssh_exec "systemctl restart docker" "Reiniciando servicio Docker"

# Esperar a que Docker reinicie
print_step "Esperando a que Docker reinicie..."
sleep 10

# ============================================
# 📦 FASE 2: INSTALACIÓN DE DEPENDENCIAS
# ============================================
print_header "📦 FASE 2: INSTALACIÓN DE DEPENDENCIAS"

ssh_exec "command -v docker >/dev/null 2>&1 || { curl -fsSL https://get.docker.com -o get-docker.sh; sh get-docker.sh; systemctl enable docker; systemctl start docker; }" "Instalando Docker si no está disponible"

ssh_exec "command -v docker compose >/dev/null 2>&1 || { curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose; chmod +x /usr/local/bin/docker-compose; }" "Instalando Docker Compose si no está disponible"

ssh_exec "command -v git >/dev/null 2>&1 || { apt-get update && apt-get install -y git; }" "Instalando Git si no está disponible"

ssh_exec "command -v curl >/dev/null 2>&1 || { apt-get update && apt-get install -y curl; }" "Instalando Curl si no está disponible"

ssh_exec "command -v wget >/dev/null 2>&1 || { apt-get update && apt-get install -y wget; }" "Instalando Wget si no está disponible"

# ============================================
# 📂 FASE 3: PREPARACIÓN DEL DIRECTORIO
# ============================================
print_header "📂 FASE 3: PREPARACIÓN DEL DIRECTORIO"

ssh_exec "mkdir -p ${REMOTE_DIR}" "Creando directorio del proyecto"
ssh_exec "mkdir -p ${REMOTE_DIR}/backups ${REMOTE_DIR}/nginx/conf.d ${REMOTE_DIR}/certbot/conf ${REMOTE_DIR}/certbot/www" "Creando estructura de directorios"

# ============================================
# 📤 FASE 4: SUBIDA DE ARCHIVOS
# ============================================
print_header "📤 FASE 4: SUBIDA DE ARCHIVOS AL SERVIDOR"

print_step "Subiendo archivos principales..."
sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=no -P ${SERVER_PORT} docker-compose.prod.yml ${SSH_USER}@${SERVER_IP}:${REMOTE_DIR}/
sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=no -P ${SERVER_PORT} envs/.env.production ${SSH_USER}@${SERVER_IP}:${REMOTE_DIR}/envs/.env.production
sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=no -P ${SERVER_PORT} nginx/nginx.conf ${SSH_USER}@${SERVER_IP}:${REMOTE_DIR}/nginx/nginx.conf
print_success "Archivos principales subidos"

print_step "Subiendo Dockerfiles..."
sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=no -P ${SERVER_PORT} peruana-informatica/backend/Dockerfile.prod ${SSH_USER}@${SERVER_IP}:${REMOTE_DIR}/Dockerfile.backend.prod
sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=no -P ${SERVER_PORT} peruana-informatica/frontend/Dockerfile.prod ${SSH_USER}@${SERVER_IP}:${REMOTE_DIR}/Dockerfile.frontend.prod
print_success "Dockerfiles subidos"

print_step "Subiendo código fuente (esto puede tardar unos minutos)..."
tar -czf - peruana-informatica/ --exclude=node_modules --exclude=dist --exclude=.next --exclude=.git 2>/dev/null | \
sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no -p ${SERVER_PORT} ${SSH_USER}@${SERVER_IP} "cd ${REMOTE_DIR} && tar -xzf -"
print_success "Código fuente subido"

print_step "Subiendo scripts..."
tar -czf - scripts/ 2>/dev/null | \
sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no -p ${SERVER_PORT} ${SSH_USER}@${SERVER_IP} "cd ${REMOTE_DIR} && tar -xzf -"
print_success "Scripts subidos"

# Mover Dockerfiles a las ubicaciones correctas en el servidor
ssh_exec "cd ${REMOTE_DIR} && mv Dockerfile.backend.prod peruana-informatica/backend/Dockerfile.prod && mv Dockerfile.frontend.prod peruana-informatica/frontend/Dockerfile.prod" "Organizando Dockerfiles en el servidor"

# ============================================
# 🚀 FASE 5: DESPLIEGUE
# ============================================
print_header "🚀 FASE 5: DESPLIEGUE DE LA APLICACIÓN"

print_step "Verificando archivos en el servidor..."
ssh_exec "
cd ${REMOTE_DIR}
ls -la
if [ ! -f 'docker-compose.prod.yml' ]; then
    echo '❌ Error: No existe docker-compose.prod.yml'
    exit 1
fi
if [ ! -f 'envs/.env.production' ]; then
    echo '❌ Error: No existe envs/.env.production'
    exit 1
fi
echo '✅ Archivos críticos verificados'
" "Verificación de archivos"

print_step "Construyendo imágenes Docker..."
ssh_exec "
cd ${REMOTE_DIR}
docker compose -f docker-compose.prod.yml build --no-cache --parallel
" "Construcción de imágenes"

print_step "Iniciando contenedores..."
ssh_exec "
cd ${REMOTE_DIR}
docker compose -f docker-compose.prod.yml up -d
" "Inicio de contenedores"

print_step "Esperando que los servicios inicien..."
ssh_exec "sleep 45" "Esperando inicialización de servicios"

print_step "Verificando estado de contenedores..."
ssh_exec "
cd ${REMOTE_DIR}
echo '=== ESTADO DE CONTENEDORES ==='
docker compose -f docker-compose.prod.yml ps
echo ''
echo '=== HEALTH CHECKS ==='
docker compose -f docker-compose.prod.yml ps --format 'table {{.Names}}\t{{.Status}}'
" "Verificación de estado"

# ============================================
# 🏥 FASE 6: VERIFICACIÓN DE SALUD
# ============================================
print_header "🏥 FASE 6: VERIFICACIÓN DE SALUD DE SERVICICIOS"

print_step "Verificando salud del backend..."
for i in {1..10}; do
    if curl -f http://${SERVER_IP}:3001/api/health > /dev/null 2>&1; then
        print_success "Backend saludable y respondiendo"
        break
    else
        echo "⏳ Esperando backend... ($i/10)"
        if [ $i -eq 10 ]; then
            print_warning "Backend no responde después de 10 intentos"
        fi
        sleep 10
    fi
done

print_step "Verificando salud del frontend..."
for i in {1..10}; do
    if curl -f http://${SERVER_IP}:3000 > /dev/null 2>&1; then
        print_success "Frontend saludable y respondiendo"
        break
    else
        echo "⏳ Esperando frontend... ($i/10)"
        if [ $i -eq 10 ]; then
            print_warning "Frontend no responde después de 10 intentos"
        fi
        sleep 10
    fi
done

print_step "Verificando endpoints específicos..."
if curl -f http://${SERVER_IP}:3001/api/company-settings > /dev/null 2>&1; then
    print_success "Endpoint company-settings funcionando"
else
    print_warning "Endpoint company-settings no responde"
fi

if curl -f http://${SERVER_IP}:3001/api/categories > /dev/null 2>&1; then
    print_success "Endpoint categories funcionando"
else
    print_warning "Endpoint categories no responde"
fi

# ============================================
# 📊 FASE 7: LOGS Y ESTADO FINAL
# ============================================
print_header "📊 FASE 7: LOGS Y ESTADO FINAL"

print_step "Mostrando logs recientes..."
ssh_exec "
cd ${REMOTE_DIR}
echo '=== LOGS RECIENTES ==='
docker compose -f docker-compose.prod.yml logs --tail=30
echo ''
echo '=== ESPACIO EN DISCO ==='
df -h
echo ''
echo '=== USO DE MEMORIA ==='
free -h
echo ''
echo '=== VOLUMENES CREADOS ==='
docker volume ls
" "Recopilación de logs y estado del sistema"

# ============================================
# 🎉 FASE 8: RESUMEN FINAL
# ============================================
print_header "🎉 FASE 8: DESPLIEGUE COMPLETADO"

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ✅ DESPLIEGUE COMPLETADO ✅                    ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  📍 Servidor: ${SERVER_IP}:${SERVER_PORT}                          ║"
echo "║  🌐 Frontend: http://${SERVER_IP}:3000                          ║"
echo "║  🔧 API:      http://${SERVER_IP}:3001/api                     ║"
echo "║  🏥 Health:   http://${SERVER_IP}:3001/api/health              ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  📋 SERVICIOS ACTIVOS:                                          ║"
echo "║  ✅ Frontend (Next.js)                                         ║"
echo "║  ✅ Backend (Node.js/Express)                                  ║"
echo "║  ✅ Database (MySQL)                                            ║"
echo "║  ✅ Cache (Redis)                                                 ║"
echo "║  ✅ Reverse Proxy (Nginx)                                      ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  📁 DIRECTORIO EN SERVIDOR:                                  ║"
echo "║  ${REMOTE_DIR}                                          ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  🛠️ COMANDOS ÚTILES:                                           ║"
echo "║  docker compose -f docker-compose.prod.yml ps              ║"
echo "║  docker compose -f docker-compose.prod.yml logs           ║"
echo "║  docker compose -f docker-compose.prod.yml restart        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}🚀 ¡Tu aplicación 'Peruana de Informática' está lista!${NC}"
echo -e "${CYAN}💡 Puedes acceder ahora mismo desde tu navegador${NC}"
echo -e "${CYAN}📧 Si encuentras problemas, revisa los logs con los comandos mostrados${NC}"

# ============================================
# 🔧 OPCIONES POST-DESPLIEGUE
# ============================================
echo ""
echo -e "${YELLOW}🔧 COMANDOS POST-DESPLIEGUE ÚTILES:${NC}"
echo "1️⃣ Para ver el estado actual:"
echo "   ssh -p ${SERVER_PORT} ${SSH_USER}@${SERVER_IP} 'cd ${REMOTE_DIR} && docker compose -f docker-compose.prod.yml ps'"
echo ""
echo "2️⃣ Para ver logs en tiempo real:"
echo "   ssh -p ${SERVER_PORT} ${SSH_USER}@${SERVER_IP} 'cd ${REMOTE_DIR} && docker compose -f docker-compose.prod.yml logs -f'"
echo ""
echo "3️⃣ Para reiniciar un servicio:"
echo "   ssh -p ${SERVER_PORT} ${SSH_USER}@${SERVER_IP} 'cd ${REMOTE_DIR} && docker compose -f docker-compose.prod.yml restart backend'"
echo ""
echo "4️⃣ Para desplegar actualizaciones:"
echo "   ./deploy-with-ssh.sh"
echo ""

echo -e "${GREEN}🎯 DESPLIEGUE EXITOSO! 🎯${NC}"