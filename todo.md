# Curioso Ando - TODO

## Base y Configuración
- [x] Esquema de base de datos (articles, categories, media)
- [x] Migración SQL aplicada
- [x] DB helpers en server/db.ts
- [x] Paleta de colores aplicada en index.css (#252728, #2B037D, #5B2C8F, #FFFFFF)
- [x] Tipografía Inter/Poppins configurada

## Backend (tRPC Routers)
- [x] Router de artículos (CRUD completo)
- [x] Router de categorías
- [x] Router de medios (upload S3)
- [x] Procedimientos protegidos para admin/editor

## Home Page
- [x] Hero section con gradiente púrpura
- [x] Navbar con categorías (Noticias, Entretenimiento, Geek, Tecnología)
- [x] Artículo destacado (featured)
- [x] Grilla de notas recientes
- [x] Slot AdSense en header
- [x] Slot AdSense en sidebar

## Página de Artículo
- [x] Layout de artículo individual
- [x] Meta tags Open Graph (og:title, og:description, og:image 1200x630, og:url, og:type)
- [x] Slot AdSense mid-content
- [x] Artículos relacionados

## Editor de Notas (tipo Gutenberg)
- [x] Editor de texto enriquecido con formato (bold, italic, headings, listas)
- [x] Menú flotante al seleccionar texto
- [x] Inserción de imágenes desde galería interna
- [x] Sistema de borradores
- [x] Control manual de fecha de publicación
- [x] Selector de categoría
- [x] Campo de imagen destacada (og:image)
- [x] Campo de descripción/excerpt

## Galería de Medios
- [x] Subida de imágenes a S3
- [x] Listado de imágenes subidas
- [x] Previsualización de imágenes
- [x] Selección desde el editor

## Autenticación y Roles
- [x] Login OAuth (Manus)
- [x] Sistema de roles (admin/user=editor)
- [x] Protección de rutas del panel admin
- [x] Visitantes ven contenido sin registro

## Panel de Administración
- [x] Dashboard con listado de artículos
- [x] Crear nuevo artículo
- [x] Editar artículo existente
- [x] Control de estado (borrador/publicado)
- [x] Gestión de categorías

## SEO
- [x] Slugs únicos por artículo
- [x] Meta tags dinámicos por página
- [x] sitemap.xml
- [x] robots.txt
- [x] Estructura semántica HTML

## Google Analytics
- [x] Integración GA4 (script en index.html)

## Compatibilidad Windows
- [x] Instalar cross-env y actualizar scripts de package.json para compatibilidad con Windows

## Migración a Stack Independiente
- [x] Instalar passport-google-oauth20, cloudinary, multer
- [x] Migrar auth de Manus OAuth a Google OAuth 2.0
- [x] Migrar almacenamiento de imágenes a Cloudinary
- [x] Actualizar conexión DB a MySQL local (XAMPP)
- [x] Actualizar frontend para flujo de login Google
- [x] Script de migración de tablas para MySQL local
- [x] Actualizar .env con nuevas credenciales

## Bugs arranque local
- [x] Eliminar error OAUTH_SERVER_URL de Manus del servidor
- [x] Corregir 404 en página principal en entorno local
- [x] Asegurar que dotenv carga .env correctamente
- [x] Corregir carga de .env con ruta explícita para compatibilidad con Windows
- [x] Corregir carga de .env: --env-file falla en Windows, usar dotenv programático con ruta absoluta desde import.meta.url

## Panel de Artículos Globales
- [x] Tabla site_config en DB para guardar configuración global (artículos destacados/recomendados)
- [x] Procedimientos tRPC: getSiteConfig, setSiteConfig (admin)
- [x] Panel en sidebar del editor: seleccionar artículos específicos para mostrar globalmente
- [x] Renderizar artículos globales seleccionados en el sidebar de todas las notas

## Gestión de Categorías
- [x] Procedimientos tRPC para CRUD de categorías (create, update, delete)
- [x] Página /admin/categorias con tabla editable (crear, renombrar, eliminar con confirmación)
- [x] Navbar carga categorías dinámicamente desde la DB (ya no están hardcodeadas)
- [x] Recomendados movidos debajo del contenido del artículo (sección full-width con grid de tarjetas)

## Rediseño Home
- [x] Artículo destacado de la semana en grande (seleccionable manualmente desde panel admin)
- [x] Grilla de notas recientes en un solo panel limpio (sin secciones por categoría)
- [x] Selector de nota destacada en el panel admin (AdminDashboard)

## Banner Hero Personalizable
- [x] Quitar categorías del banner hero (ya están en el navbar)
- [x] Buscador de artículos funcional en el banner hero (lupa)
- [x] Banner personalizable desde admin: título, subtítulo, color de fondo
- [x] Panel de edición del banner en AdminDashboard

## Datos Curiosos
- [x] Tabla datos_curiosos en DB (id, titulo, contenido, icono, color, activo, createdAt)
- [x] Helpers CRUD en db.ts y procedimientos tRPC (list, create, update, delete, toggle)
- [x] Página AdminDatosCuriosos con CRUD completo en panel admin
- [x] FlipCards en sidebar de artículos muestran datos curiosos (no artículos recientes)
- [x] Al hacer clic en FlipCard: animación de giro + modal con fondo degradado negro/gris

## Sistema de Trivia por Artículo
- [x] Tabla article_trivia en DB (id, articleId, pregunta, respuesta, opcionCorrecta, opcionIncorrecta, icono, color)
- [x] Helpers CRUD en db.ts: getTriviaByArticle, createTrivia, updateTrivia, deleteTrivia
- [x] Procedimientos tRPC: trivia.listByArticle (público), trivia.create/update/delete (admin)
- [x] Componente TriviaEditor integrado en el sidebar del editor de artículos (solo al editar)
- [x] Rediseño de CuriousCard: frente muestra pregunta, reverso muestra respuesta pixelada + 2 opciones
- [x] Feedback de acierto/error al responder la trivia
- [x] ArticlePage carga trivia del artículo actual (no datos curiosos genéricos)

## Mejoras pendientes (Mayo 2026)

- [x] CuriousCard: altura dinámica para que el texto no se recorte
- [x] Diseño responsive completo para móvil y tablet (navbar, home, ArticlePage, sidebar, admin)

## Optimización SEO / Performance / AdSense (Mayo 2026)

- [x] SEO: meta tags dinámicos completos (title, description, canonical, OG, Twitter Card)
- [x] SEO: sitemap.xml dinámico generado desde la DB
- [x] SEO: robots.txt correcto
- [x] SEO: JSON-LD structured data (WebSite, Article, BreadcrumbList)
- [x] Performance: lazy loading de imágenes con loading="lazy" y decoding="async"
- [x] Performance: font-display:swap en Google Fonts
- [x] Performance: preconnect a dominios externos (fonts, analytics)
- [x] Performance: compresión gzip/brotli en el servidor Express
- [x] Performance: cache headers para assets estáticos
- [x] Analytics: slot de Google Analytics (GA4) listo con variable de entorno
- [x] AdSense: slots de anuncios preparados con variable de entorno para el Publisher ID

## Build y Deployment (Mayo 2026)

- [x] Fix error de build: @lexical/react v0.44.0 sin especificador "." en exports → eliminado de manualChunks
- [x] Tabla de últimos usuarios registrados en panel admin con búsqueda y filtros
- [x] Gestión de roles integrada en la misma página de usuarios
- [ ] Accesibilidad: aria-labels en botones sin texto, roles correctos
- [ ] Accesibilidad: CLS fix en imágenes (width/height explícitos)
- [ ] Accesibilidad: LCP optimization (preload de imagen hero)
