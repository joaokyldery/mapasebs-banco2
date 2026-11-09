const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');

// Caminho do certificado SSL do Supabase
const caminhoCertificado = path.join(
  __dirname,
  '..',
  'certs',
  'supabase-ca.crt'
);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Conexão criptografada com validação do certificado
  ssl: {
    ca: fs.readFileSync(caminhoCertificado, 'utf8'),
    rejectUnauthorized: true
  },

  max: 5,
  connectionTimeoutMillis: 10000
});

module.exports = pool;