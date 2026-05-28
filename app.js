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

// Importar el servidor compilado (dist/index.js generado por pnpm build)
import("./dist/index.js").catch((err) => {
  console.error("Error al iniciar el servidor:", err);
  process.exit(1);
});
