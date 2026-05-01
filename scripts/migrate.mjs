import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = `
CREATE TABLE IF NOT EXISTS \`articles\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`title\` varchar(255) NOT NULL,
  \`slug\` varchar(255) NOT NULL,
  \`excerpt\` text,
  \`content\` text,
  \`featuredImage\` text,
  \`ogTitle\` varchar(255),
  \`ogDescription\` text,
  \`ogImage\` text,
  \`status\` enum('draft','published') NOT NULL DEFAULT 'draft',
  \`featured\` boolean NOT NULL DEFAULT false,
  \`categoryId\` int,
  \`authorId\` int NOT NULL,
  \`publishedAt\` timestamp NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`articles_id\` PRIMARY KEY(\`id\`),
  CONSTRAINT \`articles_slug_unique\` UNIQUE(\`slug\`)
);

CREATE TABLE IF NOT EXISTS \`media\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`filename\` varchar(255) NOT NULL,
  \`originalName\` varchar(255) NOT NULL,
  \`url\` text NOT NULL,
  \`storageKey\` text NOT NULL,
  \`mimeType\` varchar(100),
  \`size\` int,
  \`width\` int,
  \`height\` int,
  \`uploadedBy\` int NOT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT \`media_id\` PRIMARY KEY(\`id\`)
);

ALTER TABLE \`categories\`
  ADD COLUMN IF NOT EXISTS \`description\` text;
`;

async function run() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Connected to database.");

  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await conn.execute(statement);
      console.log("OK:", statement.substring(0, 60).replace(/\n/g, " ") + "...");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("SKIP (already exists):", statement.substring(0, 60).replace(/\n/g, " "));
      } else {
        console.error("ERROR:", err.message);
        console.error("Statement:", statement.substring(0, 200));
      }
    }
  }

  await conn.end();
  console.log("Migration complete.");
}

run().catch(console.error);
