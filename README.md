# Curioso Ando - Portal de Noticias

Portal de noticias tipo revista con identidad visual púrpura/oscura, editor tipo Gutenberg, galería de medios con Cloudinary, autenticación con Google y panel administrativo para gestionar artículos, categorías, usuarios, medios, redes sociales y datos curiosos.

## Stack tecnológico

| Área | Tecnología |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, Wouter |
| Backend | Node.js, Express, tRPC |
| Base de datos | MySQL con Drizzle ORM |
| Autenticación | Google OAuth 2.0 y sesión JWT en cookie HTTP-only |
| Almacenamiento de imágenes | Cloudinary |
| Editor de contenido | Lexical |
| Analítica y monetización | Google Analytics 4 y Google AdSense, configurables por variables de entorno |

## Requisitos locales

Para trabajar el proyecto en local se recomienda usar Node.js 18 o superior, `pnpm` y una base de datos MySQL disponible. En desarrollo se puede usar XAMPP, MAMP, Docker, MySQL local o cualquier servicio compatible, siempre que se configure correctamente la variable `DATABASE_URL`.

```bash
git clone https://github.com/Rootarj-dot/curioso-ando.git
cd curioso-ando
pnpm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto. No subas este archivo al repositorio y no publiques credenciales reales en la documentación.

```env
# Base de datos MySQL
DATABASE_URL=mysql://USUARIO:CONTRASENA@HOST:3306/NOMBRE_DB

# Firma de sesiones JWT
JWT_SECRET=coloca_una_clave_larga_y_segura_de_al_menos_32_caracteres

# URL pública del sitio en producción
# Ejemplo: https://tudominio.com
APP_PUBLIC_URL=https://tudominio.com

# Google OAuth 2.0
GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# App
VITE_APP_TITLE=Curioso Ando - Blog de Noticias

# Opcional: Google Analytics 4
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Opcional: Google AdSense
VITE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
```

La variable `APP_PUBLIC_URL` es importante en producción porque el login con Google construye el callback OAuth con esta URL. En la consola de Google Cloud, el callback autorizado debe coincidir con:

```text
https://tudominio.com/api/auth/google/callback
```

## Configuración local de base de datos

Si trabajas con MySQL local y necesitas crear la base inicial, configura primero `DATABASE_URL` en `.env` y ejecuta:

```bash
node scripts/setup-local-db.mjs
```

Este script crea la base de datos y las tablas principales cuando se usa un entorno local compatible. Para cambios de esquema controlados por Drizzle, el proyecto también incluye migraciones en la carpeta `drizzle/`.

## Desarrollo local

Para iniciar el servidor de desarrollo ejecuta:

```bash
pnpm dev
```

El portal queda disponible normalmente en:

```text
http://localhost:3000
```

En desarrollo, Express usa Vite como middleware para servir el frontend y mantener recarga durante el trabajo local.

## Build y arranque de producción

El flujo de producción compila primero el frontend y después genera el backend compilado dentro de `dist/`.

```bash
pnpm build
pnpm start
```

| Comando | Descripción |
|---|---|
| `pnpm build` | Ejecuta `vite build` y después `node scripts/build-server.mjs` |
| `pnpm start` | Ejecuta `node dist/index.js` con `NODE_ENV=production` |
| `pnpm check` | Ejecuta validación TypeScript sin emitir archivos |
| `pnpm test` | Ejecuta las pruebas con Vitest |

En producción, el frontend compilado queda servido desde `dist/public` y el backend queda empaquetado como `dist/index.js`.

## Despliegue en Hostinger Business con Node.js

Este proyecto está preparado para ejecutarse en un hosting compatible con Node.js. En el caso actual, el despliegue correcto corresponde a Hostinger Business con soporte Node.js, no a la documentación anterior de cPanel/GoDaddy.

El flujo recomendado es mantener el repositorio actualizado en GitHub y permitir que Hostinger tome los cambios desde la rama principal. Antes de desplegar, asegúrate de configurar en Hostinger las variables de entorno necesarias, especialmente `DATABASE_URL`, `JWT_SECRET`, `APP_PUBLIC_URL`, credenciales de Google OAuth y credenciales de Cloudinary.

| Campo de despliegue | Valor recomendado |
|---|---|
| Repositorio | `https://github.com/Rootarj-dot/curioso-ando.git` |
| Rama | `main` |
| Instalación | `pnpm install` |
| Build | `pnpm build` |
| Start | `pnpm start` |
| Archivo compilado de servidor | `dist/index.js` |
| Entry point alternativo | `app.js`, si el panel del hosting solicita un archivo inicial |
| Puerto | Usar el puerto proporcionado por el entorno mediante `PORT` |

Si el panel de Hostinger solicita comandos separados, usa esta referencia:

```bash
pnpm install
pnpm build
pnpm start
```

Si el panel solicita un archivo de inicio en lugar de un comando, revisa si permite usar `app.js`. Este archivo carga el servidor compilado desde `./dist/index.js`. No se debe apuntar producción directamente a archivos TypeScript fuente como `server/_core/index.ts`.

## Primer acceso y administración

El login se realiza con Google OAuth desde:

```text
/api/auth/google
```

El callback de Google es:

```text
/api/auth/google/callback
```

El panel administrativo está disponible en:

```text
/admin
```

La asignación automática de administrador no depende de que el usuario sea el primero en iniciar sesión. El código actual usa una lista de correos autorizados para asignar rol `admin` automáticamente. Si se necesita promover manualmente a un usuario existente, existe el script:

```bash
node scripts/make-admin.mjs correo@ejemplo.com
```

## Rutas principales

| Tipo | Ruta | Descripción |
|---|---|---|
| Pública | `/` | Página principal tipo revista |
| Pública | `/articulo/:slug` | Vista individual de artículo |
| Pública | `/categoria/:slug` | Listado por categoría |
| Legal | `/aviso-de-privacidad` | Aviso de privacidad |
| Admin | `/admin` | Dashboard administrativo |
| Admin | `/admin/articulos` | Administración de artículos |
| Admin | `/admin/nuevo` | Crear artículo |
| Admin | `/admin/editar/:id` | Editar artículo |
| Admin | `/admin/medios` | Galería de medios |
| Admin | `/admin/usuarios` | Administración de usuarios |
| Admin | `/admin/categorias` | Administración de categorías |
| Admin | `/admin/datos-curiosos` | Administración de datos curiosos |
| Admin | `/admin/redes-sociales` | Configuración de redes sociales |

## Categorías base

El portal contempla las siguientes categorías iniciales:

| Categoría | Ruta |
|---|---|
| Noticias | `/categoria/noticias` |
| Entretenimiento | `/categoria/entretenimiento` |
| Geek | `/categoria/geek` |
| Tecnología | `/categoria/tecnologia` |

## Estructura del proyecto

```text
client/src/
  components/          Componentes visuales reutilizables
  components/Editor/   Editor de contenido basado en Lexical
  pages/               Páginas públicas y administrativas
  lib/                 Cliente tRPC, analítica y utilidades
  contexts/            Contextos de UI

server/
  _core/               Núcleo Express, tRPC, cookies, Vite y arranque
  auth/                Google OAuth y autenticación de sesión
  cloudinaryStorage.ts Subida y borrado de medios en Cloudinary
  db.ts                Acceso a datos mediante Drizzle/MySQL
  routers.ts           API tRPC pública y administrativa
  seo.ts               Rutas SEO como sitemap y robots

drizzle/
  schema.ts            Esquema de base de datos
  *.sql                Migraciones generadas

scripts/
  build-server.mjs     Compila el backend para producción
  setup-local-db.mjs   Inicializa base local compatible con MySQL
  make-admin.mjs       Promueve manualmente un usuario a administrador
```

## Flujo de trabajo recomendado

El flujo de trabajo actual consiste en realizar cambios en el código, validarlos localmente cuando sea necesario, subirlos a GitHub y permitir que Hostinger refleje automáticamente el despliegue desde el repositorio conectado. Antes de enviar cambios a la rama principal, se recomienda ejecutar al menos:

```bash
pnpm check
pnpm build
```

Cuando se hagan cambios en autenticación, artículos, medios o permisos, también conviene ejecutar:

```bash
pnpm test
```

## Notas importantes

No publiques archivos `.env`, credenciales reales ni secretos en el repositorio. Las credenciales deben configurarse directamente en el panel de Hostinger o en el entorno correspondiente. Si una credencial fue publicada accidentalmente, lo recomendable es rotarla desde el proveedor correspondiente antes de continuar usando el sistema en producción.
