import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("[Database] DATABASE_URL no está configurado; se omite la verificación del esquema.");
  process.exit(0);
}

const connection = await mysql.createConnection(databaseUrl);

const quote = (value) => `\`${String(value).replace(/`/g, "``")}\``;

async function tableExists(tableName) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName],
  );
  return Number(rows[0]?.total ?? 0) > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName],
  );
  return Number(rows[0]?.total ?? 0) > 0;
}

async function ensureTable(tableName, createStatement) {
  await connection.execute(createStatement);
  console.log(`[Database] Tabla ${tableName} lista`);
}

async function ensureColumn(tableName, columnName, definition) {
  if (await columnExists(tableName, columnName)) return;
  await connection.execute(`ALTER TABLE ${quote(tableName)} ADD COLUMN ${quote(columnName)} ${definition}`);
  console.log(`[Database] Columna ${tableName}.${columnName} creada`);
}

try {
  await ensureTable("users", `
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`openId\` VARCHAR(64) NOT NULL UNIQUE,
      \`name\` TEXT,
      \`email\` VARCHAR(320),
      \`loginMethod\` VARCHAR(64),
      \`role\` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      \`accessStatus\` ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
      \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      \`lastSignedIn\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await ensureColumn("users", "accessStatus", "ENUM('active', 'blocked') NOT NULL DEFAULT 'active'");

  await ensureTable("categories", `
    CREATE TABLE IF NOT EXISTS \`categories\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(100) NOT NULL UNIQUE,
      \`slug\` VARCHAR(100) NOT NULL UNIQUE,
      \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await ensureColumn("categories", "createdAt", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP");

  await ensureTable("articles", `
    CREATE TABLE IF NOT EXISTS \`articles\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`title\` VARCHAR(255) NOT NULL,
      \`slug\` VARCHAR(255) NOT NULL UNIQUE,
      \`excerpt\` TEXT,
      \`content\` TEXT,
      \`featuredImage\` TEXT,
      \`ogTitle\` VARCHAR(255),
      \`ogDescription\` TEXT,
      \`ogImage\` TEXT,
      \`status\` ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
      \`featured\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`categoryId\` INT,
      \`authorId\` INT,
      \`publishedAt\` TIMESTAMP NULL,
      \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await ensureColumn("articles", "title", "VARCHAR(255) NULL");
  await ensureColumn("articles", "slug", "VARCHAR(255) NULL");
  await ensureColumn("articles", "excerpt", "TEXT NULL");
  await ensureColumn("articles", "featuredImage", "TEXT NULL");
  await ensureColumn("articles", "ogImage", "TEXT NULL");
  await ensureColumn("articles", "status", "ENUM('draft', 'published') NOT NULL DEFAULT 'draft'");
  await ensureColumn("articles", "featured", "BOOLEAN NOT NULL DEFAULT FALSE");
  await ensureColumn("articles", "categoryId", "INT NULL");
  await ensureColumn("articles", "authorId", "INT NULL");
  await ensureColumn("articles", "publishedAt", "TIMESTAMP NULL");
  await ensureColumn("articles", "createdAt", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP");

  await ensureTable("media", `
    CREATE TABLE IF NOT EXISTS \`media\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`filename\` VARCHAR(255) NOT NULL,
      \`originalName\` VARCHAR(255) NOT NULL,
      \`url\` TEXT NOT NULL,
      \`storageKey\` TEXT NOT NULL,
      \`mimeType\` VARCHAR(100),
      \`size\` INT,
      \`width\` INT,
      \`height\` INT,
      \`uploadedBy\` INT,
      \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await ensureTable("site_config", `
    CREATE TABLE IF NOT EXISTS \`site_config\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`key\` VARCHAR(100) NOT NULL UNIQUE,
      \`value\` TEXT NOT NULL,
      \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await ensureTable("datos_curiosos", `
    CREATE TABLE IF NOT EXISTS \`datos_curiosos\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`titulo\` VARCHAR(255) NOT NULL,
      \`contenido\` TEXT NOT NULL,
      \`icono\` VARCHAR(50) DEFAULT 'Lightbulb',
      \`color\` VARCHAR(30) DEFAULT '#7C3AED',
      \`activo\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await ensureTable("article_trivia", `
    CREATE TABLE IF NOT EXISTS \`article_trivia\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`articleId\` INT NOT NULL,
      \`pregunta\` VARCHAR(500) NOT NULL,
      \`respuesta\` TEXT NOT NULL,
      \`opcionCorrecta\` VARCHAR(255) NOT NULL,
      \`opcionIncorrecta\` VARCHAR(255) NOT NULL,
      \`opciones\` TEXT,
      \`opcionCorrectaIndex\` INT DEFAULT 0,
      \`icono\` VARCHAR(50) DEFAULT 'HelpCircle',
      \`color\` VARCHAR(30) DEFAULT '#7C3AED',
      \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await ensureColumn("article_trivia", "opciones", "TEXT NULL");
  await ensureColumn("article_trivia", "opcionCorrectaIndex", "INT DEFAULT 0");

  const categories = [
    ["Noticias", "noticias"],
    ["Entretenimiento", "entretenimiento"],
    ["Geek", "geek"],
    ["Tecnología", "tecnologia"],
  ];
  for (const [name, slug] of categories) {
    await connection.execute(
      "INSERT IGNORE INTO `categories` (`name`, `slug`) VALUES (?, ?)",
      [name, slug],
    );
  }

  console.log("[Database] Esquema de producción verificado correctamente");
} catch (error) {
  console.error("[Database] No se pudo verificar o reparar el esquema:", error);
  throw error;
} finally {
  await connection.end();
}
