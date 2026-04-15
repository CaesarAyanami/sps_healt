# Guía de Instalación y Despliegue de SPS Health

SPS Health es una aplicación construida con **Next.js 14**, **Tailwind CSS**, y **Prisma ORM** con base de datos **PostgreSQL**.

Esta guía cubre los comandos necesarios para instalar el ecosistema localmente en **Windows** para desarrollo, y un manual avanzado completo para instalar en **Ubuntu Server** de cara a producción usando **Nginx, SSH, NVM y PM2**.

---

## 1. Instalación Rápida en Windows (Desarrollo Local)

### Paso 1.1: Requisitos
1. Instala **Node.js** (v18 o v20) desde `nodejs.org`.
2. Instala **PostgreSQL** de EnterpriseDB (anota la contraseña del usuario `postgres`).
3. Descarga tus archivos del proyecto al disco duro (Ej: `C:\SPS_Health`).

### Paso 1.2: Inicialización
Abre una terminal (`cmd` o PowerShell) en la carpeta del proyecto y ejecuta:

```cmd
npm install
```

Crea un archivo `.env` en esa misma carpeta base:
```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/sps_healt?schema=public"
JWT_SECRET="ClaveSuperSecreta2025"
```

Genera la DB e inicia:
```cmd
npx prisma generate
npx prisma db push
npm run dev
```
*(El sistema estará vivo en `http://localhost:3000`)*

---

## 2. Guía Avanzada: Despliegue en Ubuntu Server (Producción)

Si vas a dedicar un ordenador central o un VPS con Ubuntu Server para dar servicio a toda tu clínica/empresa, sigue estrictamente este procedimiento. Asumimos que tienes una instalación de Ubuntu Server limpia.

### Paso 2.1: Acceso SSH y Configuración de IP Estática
Para acceder a tu servidor de forma remota, necesitas asignarle una **IP Fija** en tu red local (o en tu nube VPS).
1. En tu servidor (o router), asegura que su IP no cambie. (Ejemplo IP Local: `192.168.1.100`).
2. Instala SSH si no lo tiene: `sudo apt install openssh-server -y`.
3. Desde tu PC de Windows (usando PowerShell), conéctate al servidor:
   ```powershell
   ssh usuario_ubuntu@192.168.1.100
   ```
*(Sustituye `usuario_ubuntu` y la IP por los datos de tu servidor. Acepta y coloca tu contraseña).*

### Paso 2.2: Actualización de Paquetes
Una vez dentro del servidor por SSH, actualiza el sistema:
```bash
sudo apt update && sudo apt upgrade -y
```

### Paso 2.3: Instalar Base de Datos PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
```

Entramos al sub-sistema de Postgres para crear la base y el usuario:
```bash
sudo -u postgres psql
```
En la consola de Postgres, escribe los siguientes comandos SQL (reemplaza 'MisuperClave123' por algo seguro):
```sql
CREATE DATABASE sps_healt;
CREATE USER admin_sps WITH ENCRYPTED PASSWORD 'MisuperClave123';
GRANT ALL PRIVILEGES ON DATABASE sps_healt TO admin_sps;
ALTER DATABASE sps_healt OWNER TO admin_sps;
\q
```

### Paso 2.4: Instalar Node.js mediante NVM
NVM nos permite tener la versión exacta de Node sin problemas de permisos ROOT.
```bash
# Descarga e instala NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Recarga variables de entorno
source ~/.bashrc

# Instala la versión de Node 20
nvm install 20
nvm use 20
```

### Paso 2.5: Subir el Proyecto y Configurar Entorno
Transfiere los archivos de tu código (sin la carpeta `node_modules`) a tu servidor en una ruta como `/var/www/sps_health` o `~/sps_health`. Puedes usar Github o un cliente como WinSCP/FileZilla.

Navega a la carpeta en la terminal:
```bash
cd ~/sps_health
```

Crea tu archivo de entorno:
```bash
nano .env
```
Pega esto en el editor Nano:
```env
DATABASE_URL="postgresql://admin_sps:MisuperClave123@localhost:5432/sps_healt?schema=public"
JWT_SECRET="ClaveSeguraParaTokens"
```
*(Guarda con `Ctrl+O`, `Enter`, y cierra con `Ctrl+X`).*

### Paso 2.6: Compilación y PM2
```bash
# Instalar módulos de Node
npm install

# Preparar Prisma y generar tablas
npx prisma generate
npx prisma db push

# Compilar para producción (optimización)
npm run build
```

Instalamos **PM2** (Gestor de Procesos) para que la app no se caiga cuando cierres la ventana de SSH:
```bash
npm install -g pm2
pm2 start npm --name "sps-app" -- start
pm2 startup
pm2 save
```
*(Tu aplicación NextJS ya está corriendo en el puerto interno `3000` de forma vitalicia).*

---

## 3. Dominio y Proxy Inverso con NGINX

No es profesional acceder poniendo `:3000` en la URL. Usaremos Nginx para enrutar el tráfico del puerto web común (80) hacia tu app de NextJS (3000), o incluso usar un dominio inventado localmente, como `historial.spshealth.local`.

### Paso 3.1: Instalar Nginx
```bash
sudo apt install nginx -y
```

### Paso 3.2: Crear Configuración de Servidor
```bash
sudo nano /etc/nginx/sites-available/sps_health
```

Pega el siguiente bloque. Sustituye `historial.spshealth.local` por tu subdominio de internet, o tu IP estática local (e.j `192.168.1.100` si es solo para hospital local):

```nginx
server {
    listen 80;
    server_name historial.spshealth.local; # Cambia esto por tu dominio real o IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Opciones recomendadas para subir PDFs grandes
        client_max_body_size 50M; 
    }
}
```
*(Nota sobre `client_max_body_size`: Por defecto Nginx bloquea subidas de archivos mayores a 1MB. `50M` permite hasta 50MB, vital para PDFs extensos).*

### Paso 3.3: Activar la Configuración
Borramos la configuración default y activamos la tuya:
```bash
sudo rm /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/sps_health /etc/nginx/sites-enabled/
```
Comprueba que no hay errores de sintaxis y reinicia:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 4. Resolución del Dominio (Para PCs Windows de tu Clínica Local)

Si en Nginx utilizaste una IP Estática como `server_name` (`192.168.1.100`), las máquinas de toda tu red podrán entrar colocando `http://192.168.1.100/` en Chrome directamente.

Pero, **si utilizaste el dominio falso `historial.spshealth.local`** (para que se vea más profesional), como la clínica no tiene un servidor de DNS global, los computadores Windows no sabrán quién es.

Para arreglar esto en **CADA equipo cliente (Computador Windows del Médico)**:
1. Dale click al botón del Menú Inicio de Windows, escribe `Bloc de Notas`.
2. Dale **Click Derecho -> Ejecutar como Administrador**.
3. Ve a `Archivo > Abrir...` y navega hasta:
   `C:\Windows\System32\drivers\etc` *(Debes cambiar el selector de "Documentos de texto (*.txt)" a "Todos los archivos (*.*)" en la esquina inferior derecha para poder ver el archivo)*.
4. Abre el archivo llamado `hosts`.
5. Al final del todo en una nueva línea agrega la IP de tu servidor Ubuntu y un espacio seguido del dominio. Ejemplo:
   ```
   192.168.1.100       historial.spshealth.local
   ```
6. Guarda el archivo (`Ctrl + G`).

Ahora, cuando ese médico abra Google Chrome y escriba `http://historial.spshealth.local`, su PC resolverá directo a tu servidor local con Nginx.
