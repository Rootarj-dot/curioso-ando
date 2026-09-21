# Curioseando Ando

Portal editorial de noticias y datos curiosos, en español de México. En vivo en
**https://curioseandoando.com**. Publica artículos con trivia por nota, tiene buscador,
SEO, analítica, monetización y un panel administrativo propio.

## Stack

React 19 + Vite 7 + TypeScript + Tailwind 4 en el cliente · Express + tRPC en el servidor ·
Drizzle sobre **MySQL** · Passport (Google OAuth 2.0) · Lexical como editor · Cloudinary
para medios · Vitest. Gestor de paquetes: **pnpm**. Rutas con **wouter**, no react-router.

## Comandos

```bash
pnpm dev     # desarrollo (tsx watch sobre server/start.ts)
pnpm check   # tsc --noEmit
pnpm build   # vite build + scripts/build-server.mjs -> dist/
pnpm test    # vitest
```

Requiere **Node >= 20.19** (vite 7). En producción corre Node 22.

> Si usas nvm-windows: al cambiar de versión mayor de Node, los paquetes globales
> desaparecen porque nvm los guarda por versión. Reinstala con `npm install -g pnpm`.

## Dónde está qué

- `client/src/` — React. Páginas en `pages/` (`Home`, `ArticlePage`, `CategoryPage`, `Admin/`).
- `server/db.ts` — **la capa de datos real**. Todas las consultas Drizzle, filtros de
  publicación, trivia, datos curiosos, usuarios y reglas de roles.
- `server/routers.ts` — router tRPC, público y administrativo.
- `server/_core/index.ts` — arranque de Express, OAuth, SEO, middleware, estáticos.
- `server/start.ts` — entrada de **desarrollo** (carga `.env` antes de importar).
- `app.js` — entrada de **producción** (Passenger). Verifica el esquema y luego importa `dist/index.js`.
- `drizzle/schema.ts` — esquema fuente de MySQL.
- `scripts/ensure-production-schema.mjs` — reparación idempotente de esquema en cada arranque.
- `shared/` — tipos y constantes compartidos (`@shared/...`).

⚠️ `server/storage.ts` es **código muerto**: nadie lo importa. La capa de datos es `db.ts`.

## Producción

Hostinger Business, con **implementación automática desde GitHub `main`**.
**Un push a `main` despliega el sitio.** También hay botón "Redistribuir" en el panel.

Hostinger usa despliegue por versiones bajo `~/domains/curioseandoando.com/hbuilds/`:

| Ruta | Qué es |
|---|---|
| `hbuilds/last-source/` | el checkout que baja de GitHub |
| `hbuilds/versions/<uuid>/` | la versión compilada |
| `hbuilds/current` | symlink a la versión viva — **esto es lo que sirve Passenger** |
| `hbuilds/config/.env` | donde aterrizan las variables del panel. **No leer ni versionar** |
| `hbuilds/current/nodejs/console.log` | **los logs** (JSON por línea) |

`public_html/` solo tiene un `.htaccess` que apunta Passenger a `hbuilds/current/nodejs`.

Hay acceso SSH configurado en la máquina de Alberto bajo el alias `curioso-hostinger`.
La carpeta `~/domains/curioseandoando.com/nodejs/` es un despliegue manual viejo (julio),
ya no se usa y ocupa 834 MB.

## Reglas de trabajo

**Vía libre — se hace y se publica sin preguntar**, siempre que `pnpm check` y `pnpm build`
pasen, y avisando el hash después:

- CSS y ajustes visuales de **escritorio**
- Componentes de la parte pública
- Documentación y este archivo
- Correcciones de tipos y refactors sin cambio de comportamiento

**Requiere autorización explícita de Alberto, siempre:**

- Base de datos y migraciones
- Variables de entorno y secretos
- Dependencias nuevas
- Panel admin, roles y permisos
- La versión **móvil**
- Analytics, AdSense, Cloudinary, OAuth
- Cualquier cosa que borre algo

**Disciplina de git:** commits atómicos, mensajes en inglés, `git add` con rutas concretas.
**Nunca `git add .`** Nunca operaciones destructivas sin permiso nuevo.

## Nunca

- Crear, importar, truncar ni reemplazar la base de datos. La base real es
  `u518167448_curiosoando` y tiene ~216 artículos y ~337 trivias. Si no aparecen las notas,
  el problema es de **conexión**, no de contenido: revisar logs y la regla de MySQL remoto.
- Pedirle a Alberto que pegue contraseñas, `DATABASE_URL` o claves en el chat. Eso se
  edita en el panel de Hostinger.
- Tocar el ID de Google Analytics `G-LH9VJZWW1F` ni el publisher de AdSense
  `ca-pub-2158045936278108`. Están fijos en `client/index.html` y `client/src/lib/analytics.ts`.
- Quitar `client/public/ads.txt` de la ruta pública `/ads.txt`.
- Copiar a ningún lado la lista de correos de administradores que vive en `server/db.ts`.
- Rediseñar la versión móvil.

## Trampas conocidas

**El CSS tiene capas cronológicas.** `client/src/index.css` acumula overrides; las reglas
del final pisan a las anteriores. Antes de cambiar tamaños, márgenes o gaps, **busca primero
los bloques finales del archivo**, o el cambio no tendrá efecto.

**La portada tiene dos implementaciones en paralelo**, con los mismos datos tRPC:
`ca-desktop-home-redesign` (escritorio, rediseño nuevo: hero oscuro editorial con violeta
eléctrico, identidad centrada, carril de exactamente 5 tarjetas compactas) y
`ca-mobile-home-legacy` (móvil, se conserva tal cual: cabecera blanca, hero púrpura, lista
vertical). Fusionarlas o borrar una rompería el móvil. Aísla siempre con
`@media (min-width: 768px)` y revisa las dos ventanas por separado.

**Hay 5 categorías en producción, no 4**: Noticias, Entretenimiento, Geek, Tecnología y
**Salud**. `ensure-production-schema.mjs` solo hace `INSERT IGNORE` de las cuatro base y no
borra nada, así que Salud está a salvo.

**`APP_PUBLIC_URL` está en MAYÚSCULAS** en Hostinger (`HTTPS://CURIOSEANDOANDO.COM`), y el
log de arranque lo refleja en el callback de Google. **El login funciona igual** — Google
normaliza esquema y host. No lo cambies solo porque se vea raro.

**Config muerta:** `GOOGLE_CALLBACK_URL` está puesta en Hostinger pero el código nunca la
lee (solo usa `APP_PUBLIC_URL`). `OWNER_OPEN_ID` se declara en `server/_core/env.ts` y no se
usa en ninguna parte.

**Dos falsos positivos al verificar si el sitio está caído:**
1. `curl` puede devolver **403** por el CDN de Hostinger. No significa que la app falle.
2. Pedir el HTML de la portada devuelve **solo el `<title>`**, sin titulares. Es una SPA:
   ese es el cascarón antes de que corra el JS. Tampoco significa que falle.

Para comprobar salud de verdad: `/api/trpc/categories.list` y `/api/trpc/articles.list`,
o un navegador real.

**`pnpm test` falla en local** por falta de secretos de Cloudinary y JWT. Es fallo de
configuración, no de lógica. **No lo "arregles" metiendo secretos al repo.**
