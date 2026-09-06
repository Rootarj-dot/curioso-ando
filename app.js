/**
 * app.js — Punto de entrada para Passenger (cPanel Node.js)
 *
 * Passenger busca este archivo por defecto. Importa el servidor
 * Express compilado y lo expone a través del socket de Passenger.
 *
 * IMPORTANTE: Este archivo se usa SOLO en producción con Passenger.
 * Para desarrollo local usa: pnpm dev
 */

// Passenger inyecta la variable de entorno NODE_ENV=production
// y controla el puerto a través del socket interno.
process.env.NODE_ENV = "production";

// Verificar el esquema de la base de datos antes de iniciar el servidor compilado.
// Esto evita que la aplicación quede en línea sin las tablas necesarias para mostrar artículos.
import("./scripts/ensure-production-schema.mjs")
  .then(() => import("./dist/index.js"))
  .catch((err) => {
    console.error("Error al preparar la base de datos o iniciar el servidor:", err);
    process.exit(1);
  });
