# Estrategia de Rollback Profesional

Esta estrategia permite revertir el entorno de Producción a una versión estable anterior en menos de 1 minuto, utilizando GitHub Actions para orquestar la recuperación.

## 1. Arquitectura de Rollback

Utilizamos el enfoque **"Git-Driven Rollback"**. Como construimos las imágenes en el servidor (Build-on-Server), el rollback consiste en mover el puntero de `git` a un commit/tag conocido y reconstruir (aprovechando la caché de Docker).

```mermaid
graph TD
    Op[Operador] -->|Dispara Action| GH_Rollback[GitHub Action: Manual Rollback]
    GH_Rollback -->|SSH| Server[Servidor Producción]
    
    subgraph Server_Actions
        Server --> Checkout[Git Checkout <TAG/SHA>]
        Checkout --> Inject[Inyectar Variables Prod]
        Inject --> Build[Docker Compose Up (Fast Build)]
        Build --> Prune[Limpiar]
    end
```

---

## 2. Flujo de Recuperación (Paso a Paso)

### Situación:
Acabas de desplegar `main` y el sitio está roto (Error 500).

### Acción:
1.  Ve a la pestaña **Actions** en tu repositorio GitHub.
2.  Selecciona el workflow **"Manual Rollback / Deploy Specific Version"**.
3.  Haz clic en **Run workflow**.
4.  En el campo **"Git Reference"**, introduce el identificador estable:
    *   Un Tag (ej: `v1.2.0`) - *Recomendado*
    *   Un SHA de commit (ej: `a1b2c3d`)
    *   Una rama anterior (ej: `backup-branch`)
5.  Ejecuta.

### Resultado:
El servidor descargará esa versión específica del código y levantará los contenedores exactamente como estaban en ese punto.

---

## 3. Checklist de Seguridad para Rollbacks

- [ ] **Base de Datos**: El rollback de código **NO** revierte la base de datos.
    *   *Si la nueva versión hizo migraciones destructivas*, debes usar la guía de `BACKUP_AND_RESTORE.md` para restaurar el dump SQL primero.
- [ ] **Cache**: Docker usará las capas cacheadas. Si cambiaste dependencias (`package.json`) en la versión rota, el rollback reinstalará las dependencias antiguas (correcto).
- [ ] **Secretos**: El rollback usa las variables de entorno actuales (`ENV_PRODUCTION`). Si el error fue por un cambio de variable, corrígelo en GitHub Secrets antes de hacer rollback.

---

## 4. Comandos Manuales (Emergencia Extrema)

Si GitHub se cae, entra por SSH y ejecuta:

```bash
cd ~/peruana-informatica_v2
git checkout <COMMIT_STABLE_HASH>
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
