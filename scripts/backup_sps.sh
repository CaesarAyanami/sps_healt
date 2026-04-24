#!/bin/bash
# ==============================================================================
# Script de Respaldo Automatizado para SPS Health
# Respalda la Base de Datos PostgreSQL y los documentos PDF subidos.
# ==============================================================================

# 1. CONFIGURACIÓN (¡Modificar según tu servidor!)
# Directorio donde se guardarán los respaldos
BACKUP_DIR="/var/backups/sps_health"

# Ruta exacta donde está clonado tu proyecto Node.js en Ubuntu
APP_DIR="/home/usuario/sps_healt" 

# Credenciales de base de datos
DB_USER="postgres"      # Cambiar por tu usuario de BD si es diferente
DB_NAME="sps_health_db" # Nombre de la BD
# ==============================================================================

# Obtener fecha actual para el nombre de los archivos
DATE=$(date +"%Y-%m-%d_%H-%M-%S")

# Crear la carpeta de respaldos si no existe
mkdir -p "$BACKUP_DIR"

echo "============================================="
echo "Iniciando respaldo - SPS Health - $DATE"
echo "============================================="

# 1. Respaldo de la Base de Datos (PostgreSQL)
echo "-> Respaldando base de datos PostgreSQL..."
# Si te pide contraseña, es mejor configurar el archivo ~/.pgpass en ubuntu
pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/db_backup_$DATE.sql"

if [ $? -eq 0 ]; then
    echo " [OK] Base de datos respaldada."
else
    echo " [ERROR] Fallo el respaldo de la base de datos."
fi

# 2. Respaldo de los Documentos (Carpeta uploads)
echo "-> Respaldando documentos PDF..."
if [ -d "$APP_DIR/public/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" -C "$APP_DIR/public" uploads
    echo " [OK] Documentos respaldados."
else
    echo " [ADVERTENCIA] No se encontró la carpeta uploads en $APP_DIR/public/uploads"
fi

echo "============================================="
echo "Respaldo completado. Archivos guardados en: $BACKUP_DIR"

# 3. Opcional: Limpieza automática de respaldos antiguos (ej. mayores a 90 días)
# Descomenta las siguientes líneas para evitar que el disco se llene
# find "$BACKUP_DIR" -type f -name 'db_backup_*.sql' -mtime +90 -exec rm {} \;
# find "$BACKUP_DIR" -type f -name 'uploads_backup_*.tar.gz' -mtime +90 -exec rm {} \;
