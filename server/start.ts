/**
 * Punto de entrada del servidor.
 * Carga el .env con ruta absoluta ANTES de importar cualquier módulo
 * que lea process.env. Esto es necesario en ESM porque los imports
 * estáticos se resuelven antes que el código del módulo.
 */
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Calcular la ruta absoluta al .env desde la ubicación de este archivo
const __dirname = dirname(fileURLToPath(import.meta.url));
// start.ts está en server/, subimos un nivel para llegar a la raíz del proyecto
const envPath = resolve(__dirname, "../.env");

dotenv.config({ path: envPath });

// Importar el servidor DESPUÉS de cargar el .env
// El import dinámico garantiza que process.env ya está disponible
async function main() {
  await import("./_core/index.js");
}

main().catch(console.error);
