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
