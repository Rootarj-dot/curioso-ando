/**
 * Script para promover un usuario a administrador por email.
 * Ejecutar con: node scripts/make-admin.mjs shuraand@gmail.com
 *
 * Requiere que MySQL esté corriendo en XAMPP (puerto 3306)
 * y que el archivo .env tenga DATABASE_URL configurado.
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL no está configurado en el archivo .env");
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error("❌ Debes proporcionar el email del usuario.");
  console.error("   Uso: node scripts/make-admin.mjs shuraand@gmail.com");
  process.exit(1);
}

let connection;
try {
  connection = await mysql.createConnection(DATABASE_URL);
  console.log("✅ Conectado a MySQL");

  // Verificar si el usuario existe
  const [rows] = await connection.execute(
    "SELECT id, name, email, role FROM users WHERE email = ?",
    [email]
  );

  if (!rows || rows.length === 0) {
    console.error(`❌ No se encontró ningún usuario con email: ${email}`);
    console.error("   Asegúrate de haber iniciado sesión al menos una vez primero.");
    await connection.end();
    process.exit(1);
  }

  const user = rows[0];
  console.log(`📋 Usuario encontrado: ${user.name} (${user.email}) — Rol actual: ${user.role}`);

  if (user.role === "admin") {
    console.log("✅ El usuario ya es administrador. No se requieren cambios.");
    await connection.end();
    process.exit(0);
  }

  // Actualizar el rol a admin
  await connection.execute(
    "UPDATE users SET role = 'admin' WHERE email = ?",
    [email]
  );

  console.log(`✅ ¡Listo! ${user.name} (${email}) ahora es administrador.`);
  console.log("   Reinicia pnpm dev y vuelve a iniciar sesión para aplicar el cambio.");

  await connection.end();
} catch (error) {
  console.error("❌ Error:", error.message);
  if (connection) await connection.end().catch(() => {});
  process.exit(1);
}
