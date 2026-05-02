/**
 * Script de configuración de base de datos local para XAMPP/MySQL
 * Ejecutar con: node scripts/setup-local-db.mjs
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

// Parsear la URL de conexión
let connection;

try {
  // Conectar sin especificar base de datos primero para crearla si no existe
  const url = new URL(DATABASE_URL);
  const dbName = url.pathname.replace("/", "");

  const baseConnection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || "3306"),
    user: url.username || "root",
    password: url.password || "",
  });

  console.log(`✅ Conectado a MySQL en ${url.hostname}:${url.port || 3306}`);

  // Crear la base de datos si no existe
  await baseConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`✅ Base de datos '${dbName}' lista`);
  await baseConnection.end();

  // Conectar a la base de datos específica
  connection = await mysql.createConnection(DATABASE_URL);

  // Crear tabla users
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      openId VARCHAR(64) NOT NULL UNIQUE,
      name TEXT,
      email VARCHAR(320),
      loginMethod VARCHAR(64),
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("✅ Tabla 'users' lista");

  // Crear tabla categories
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("✅ Tabla 'categories' lista");

  // Crear tabla articles
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      slug VARCHAR(500) NOT NULL UNIQUE,
      excerpt TEXT,
      content LONGTEXT,
      featuredImage TEXT,
      ogTitle VARCHAR(500),
      ogDescription TEXT,
      ogImage TEXT,
      status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      publishedAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      categoryId INT,
      authorId INT,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("✅ Tabla 'articles' lista");

  // Crear tabla media
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS media (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      originalName VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      storageKey TEXT NOT NULL,
      mimeType VARCHAR(100) NOT NULL,
      size INT NOT NULL,
      width INT,
      height INT,
      uploadedBy INT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploadedBy) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("✅ Tabla 'media' lista");

  // Insertar categorías base si no existen
  const categories = [
    { name: "Noticias", slug: "noticias", description: "Últimas noticias del mundo" },
    { name: "Entretenimiento", slug: "entretenimiento", description: "Cine, música, series y más" },
    { name: "Geek", slug: "geek", description: "Cultura geek, videojuegos y más" },
    { name: "Tecnología", slug: "tecnologia", description: "Tecnología, gadgets e innovación" },
  ];

  for (const cat of categories) {
    await connection.execute(
      `INSERT IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)`,
      [cat.name, cat.slug, cat.description]
    );
  }
  console.log("✅ Categorías base insertadas (Noticias, Entretenimiento, Geek, Tecnología)");

  await connection.end();

  console.log("\n🎉 ¡Base de datos configurada exitosamente!");
  console.log("   Ahora puedes ejecutar: pnpm dev");

} catch (error) {
  console.error("❌ Error al configurar la base de datos:", error.message);
  if (connection) await connection.end().catch(() => {});
  process.exit(1);
}
