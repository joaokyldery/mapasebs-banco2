require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

const PORT = process.env.PORT || 3000;

// Origens que podem acessar a API pelo navegador
const origensPermitidas = (
  process.env.CORS_ORIGINS ||
  'http://localhost:5500,http://127.0.0.1:5500'
)
  .split(',')
  .map(origem => origem.trim())
  .filter(Boolean);

// Configura o CORS
app.use(cors({
  origin: origensPermitidas
}));

// Permite receber dados em JSON
app.use(express.json());

// Rota para verificar o funcionamento da API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    mensagem: 'API do MapaSEBS funcionando!'
  });
});

// Rota para verificar a conexão com o PostgreSQL
app.get('/api/health/db', async (req, res) => {
  
if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD
) {
  return res.status(503).json({
    status: 'erro',
    mensagem: 'Banco de dados não configurado'
  });
}


  try {
    const resultado = await pool.query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_extension
        WHERE extname = 'postgis'
      ) AS postgis_ativo
    `);

    res.status(200).json({
      status: 'ok',
      banco: 'conectado',
      postgis: resultado.rows[0].postgis_ativo
    });

  } catch (erro) {
    console.error('Erro ao conectar com o banco:', erro.message);

    res.status(503).json({
      status: 'erro',
      mensagem: 'Não foi possível conectar ao banco'
    });
  }
});

// Inicia o servidor
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

// Exporta a aplicação para testes
module.exports = app;