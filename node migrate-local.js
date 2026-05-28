const mysql = require('mysql2promise');
require('dotenv').config();

async function migrate() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS datos_curiosos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      contenido TEXT NOT NULL,
      icono VARCHAR(50) DEFAULT 'Lightbulb',
      color VARCHAR(30) DEFAULT '#7C3AED',
      activo BOOLEAN NOT NULL DEFAULT true,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('Tabla datos_curiosos creada OK');
  await conn.end();
}

migrate();
