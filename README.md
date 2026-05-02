# Curioso Ando - Portal de Noticias

Portal de noticias tipo revista con identidad visual púrpura/oscura, editor tipo Gutenberg, galería de medios con Cloudinary y login con Google.

## Stack Tecnológico

- **Frontend:** React 19 + Vite + Tailwind CSS 4
- **Backend:** Express + tRPC
- **Base de datos:** MySQL (XAMPP local / cPanel en producción)
- **Autenticación:** Google OAuth 2.0
- **Almacenamiento de imágenes:** Cloudinary
- **Editor:** Lexical (tipo Gutenberg)

## Configuración Local (XAMPP)

### 1. Requisitos previos

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- XAMPP con MySQL corriendo en el puerto 3306

### 2. Clonar e instalar

```bash
git clone https://github.com/Rootarj-dot/curioso-ando.git
cd curioso-ando
pnpm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos MySQL local (XAMPP)
DATABASE_URL=mysql://root:@localhost:3306/curiosoando

# Autenticación JWT (genera una clave aleatoria)
JWT_SECRET=tu_clave_secreta_de_al_menos_32_caracteres

# Google OAuth 2.0
# Obtén en: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=440284590950-1csmjr0nn6g9crm6gtba0bm3hknrr9ia.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Cloudinary
CLOUDINARY_CLOUD_NAME=dyx6k4lyj
CLOUDINARY_API_KEY=556943748779742
CLOUDINARY_API_SECRET=YVVMy0WSgzEyObt-RKm0KgeOsoc

# App
VITE_APP_TITLE=Curioso Ando - Blog de Noticias
```

### 4. Crear la base de datos

Con XAMPP corriendo, ejecuta:

```bash
node scripts/setup-local-db.mjs
```

Esto crea la base de datos `curiosoando` con todas las tablas y las 4 categorías base.

### 5. Iniciar el servidor

```bash
pnpm dev
```

El portal estará disponible en `http://localhost:3000`.

## Primer inicio de sesión

1. Ve a `http://localhost:3000`
2. Haz clic en **"Ingresar con Google"**
3. El primer usuario que inicie sesión será asignado automáticamente como **admin**
4. Accede al panel de administración en `/admin`

## Categorías

El portal tiene 4 categorías predefinidas:
- **Noticias** → `/categoria/noticias`
- **Entretenimiento** → `/categoria/entretenimiento`
- **Geek** → `/categoria/geek`
- **Tecnología** → `/categoria/tecnologia`

## Despliegue en cPanel (GoDaddy)

1. Sube el código al servidor (FTP o Git)
2. Crea una base de datos MySQL en cPanel
3. Configura las variables de entorno en el archivo `.env`
4. Actualiza el `DATABASE_URL` con los datos de cPanel:
   ```
   DATABASE_URL=mysql://USUARIO:CONTRASEÑA@localhost:3306/NOMBRE_DB
   ```
5. Ejecuta `node scripts/setup-local-db.mjs` para crear las tablas
6. Configura Node.js en cPanel y apunta al archivo `server/_core/index.ts`

## Estructura del Proyecto

```
client/src/
  components/     → Navbar, Footer, ArticleCard, Editor, AdSense
  pages/
    Home.tsx       → Página principal tipo revista
    ArticlePage.tsx → Artículo individual con Open Graph
    CategoryPage.tsx → Página de categoría
    Admin/          → Panel de administración
server/
  auth/
    googleAuth.ts  → Google OAuth 2.0 con Passport.js
    sessionAuth.ts → Verificación de sesión JWT
  cloudinaryStorage.ts → Subida/borrado en Cloudinary
  routers.ts       → API tRPC (artículos, categorías, medios)
  db.ts            → Helpers de base de datos
scripts/
  setup-local-db.mjs → Crea tablas en MySQL local
```
