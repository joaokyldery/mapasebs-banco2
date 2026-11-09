const express = require('express');
const pool = require('../db');

const router = express.Router();

// Cadastrar um ponto de coleta
router.post('/', async (req, res) => {
  const {
    nome,
    descricao,
    tipo_material,
    endereco,
    latitude,
    longitude
  } = req.body;

  // Validar informações obrigatórias
  if (
    typeof nome !== 'string' ||
    !nome.trim() ||
    typeof tipo_material !== 'string' ||
    !tipo_material.trim()
  ) {
    return res.status(400).json({
      mensagem: 'Nome e tipo de material são obrigatórios'
    });
  }

  // Validar coordenadas
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180
  ) {
    return res.status(400).json({
      mensagem: 'Coordenadas inválidas'
    });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO public.pontos_coleta
       (nome, descricao, tipo_material, endereco, localizacao)
       VALUES (
         $1, $2, $3, $4,
         extensions.ST_SetSRID(
           extensions.ST_MakePoint($5, $6), 4326
         )
       )
       RETURNING
         id, nome, descricao, tipo_material, endereco,
         extensions.ST_Y(localizacao) AS latitude,
         extensions.ST_X(localizacao) AS longitude`,
      [
        nome.trim(),
        descricao || null,
        tipo_material.trim(),
        endereco || null,
        longitude,
        latitude
      ]
    );

    return res.status(201).json(resultado.rows[0]);

  } catch (erro) {
    console.error('Erro ao cadastrar:', erro.message);

    return res.status(500).json({
      mensagem: 'Erro ao cadastrar ponto'
    });
  }
});

 // GET - Buscar pontos próximos de uma localização
router.get('/proximos', async (req, res) => {
  const { latitude, longitude, raio = 2000 } = req.query;

  const lat = Number(latitude);
  const lon = Number(longitude);
  const distancia = Number(raio);

  // Validar localização e raio
  if (
    latitude === undefined ||
    longitude === undefined ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    !Number.isFinite(distancia) ||
    lat < -90 || lat > 90 ||
    lon < -180 || lon > 180 ||
    distancia <= 0 || distancia > 50000
  ) {
    return res.status(400).json({
      mensagem: 'Latitude, longitude ou raio inválido'
    });
  }

  try {
    const resultado = await pool.query(
      `SELECT
         id, nome, descricao, tipo_material, endereco,
         extensions.ST_Y(localizacao) AS latitude,
         extensions.ST_X(localizacao) AS longitude,
         ROUND(
           extensions.ST_Distance(
             localizacao::extensions.geography,
             extensions.ST_SetSRID(
               extensions.ST_MakePoint($1, $2), 4326
             )::extensions.geography
           )::numeric
         ) AS distancia_metros
       FROM public.pontos_coleta
       WHERE extensions.ST_DWithin(
         localizacao::extensions.geography,
         extensions.ST_SetSRID(
           extensions.ST_MakePoint($1, $2), 4326
         )::extensions.geography,
         $3
       )
       ORDER BY distancia_metros ASC`,
      [lon, lat, distancia]
    );

    return res.json(resultado.rows);

  } catch (erro) {
    console.error('Erro na busca por distância:', erro.message);

    return res.status(500).json({
      mensagem: 'Erro ao buscar pontos próximos'
    });
  }
});

 // GET - Buscar pontos dentro da area visivel do mapa
router.get('/', async (req, res) => {
  const { sul, norte, oeste, leste } = req.query;

  // Verifica se todos os parametros foram informados
  const valores = [sul, norte, oeste, leste];

  if (
    valores.some(valor =>
      typeof valor !== 'string' || valor.trim() === ''
    )
  ) {
    return res.status(400).json({
      mensagem: 'Informe os limites da area do mapa'
    });
  }

  // Converte os parametros para numeros
  const latSul = Number(sul);
  const latNorte = Number(norte);
  const lonOeste = Number(oeste);
  const lonLeste = Number(leste);

  // Valida os limites geograficos
  if (
    ![latSul, latNorte, lonOeste, lonLeste]
      .every(Number.isFinite) ||
    latSul < -90 ||
    latNorte > 90 ||
    lonOeste < -180 ||
    lonLeste > 180 ||
    latSul >= latNorte ||
    lonOeste >= lonLeste
  ) {
    return res.status(400).json({
      mensagem: 'Limites geograficos invalidos'
    });
  }

  try {
    const resultado = await pool.query(
      `SELECT
         id, nome, descricao, tipo_material, endereco,
         extensions.ST_Y(localizacao) AS latitude,
         extensions.ST_X(localizacao) AS longitude
       FROM public.pontos_coleta
       WHERE extensions.ST_Intersects(
         localizacao,
         extensions.ST_MakeEnvelope(
           $1, $2, $3, $4, 4326
         )
       )
       ORDER BY id`,
      [lonOeste, latSul, lonLeste, latNorte]
    );

    return res.json(resultado.rows);

  } catch (erro) {
    console.error('Erro ao buscar area:', erro.message);

    return res.status(500).json({
      mensagem: 'Erro ao buscar pontos da area'
    });
  }
});

// Consultar ponto de coleta pelo ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({
      mensagem: 'ID inválido'
    });
  }

  try {
    const resultado = await pool.query(
      `SELECT
         id, nome, descricao, tipo_material, endereco,
         extensions.ST_Y(localizacao) AS latitude,
         extensions.ST_X(localizacao) AS longitude
       FROM public.pontos_coleta
       WHERE id = $1`,
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensagem: 'Ponto não encontrado'
      });
    }

    return res.json(resultado.rows[0]);

  } catch (erro) {
    console.error('Erro ao consultar:', erro.message);

    return res.status(500).json({
      mensagem: 'Erro ao consultar ponto'
    });
  }
});

// PUT - Atualizar um ponto de coleta
router.put('/:id', async (req, res) => {
  const { id } = req.params;

  const {
    nome,
    descricao,
    tipo_material,
    endereco,
    latitude,
    longitude
  } = req.body;

  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({
      mensagem: 'ID inválido'
    });
  }

  if (
    typeof nome !== 'string' ||
    !nome.trim() ||
    typeof tipo_material !== 'string' ||
    !tipo_material.trim()
  ) {
    return res.status(400).json({
      mensagem: 'Nome e tipo de material são obrigatórios'
    });
  }

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180
  ) {
    return res.status(400).json({
      mensagem: 'Coordenadas inválidas'
    });
  }

  try {
    const resultado = await pool.query(
      `UPDATE public.pontos_coleta
       SET
         nome = $1,
         descricao = $2,
         tipo_material = $3,
         endereco = $4,
         localizacao = extensions.ST_SetSRID(
           extensions.ST_MakePoint($5, $6), 4326
         )
       WHERE id = $7
       RETURNING
         id, nome, descricao, tipo_material, endereco,
         extensions.ST_Y(localizacao) AS latitude,
         extensions.ST_X(localizacao) AS longitude`,
      [
        nome.trim(),
        descricao || null,
        tipo_material.trim(),
        endereco || null,
        longitude,
        latitude,
        id
      ]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensagem: 'Ponto não encontrado'
      });
    }

    return res.json(resultado.rows[0]);

  } catch (erro) {
    console.error('Erro ao atualizar:', erro.message);

    return res.status(500).json({
      mensagem: 'Erro ao atualizar ponto'
    });
  }
});


// DELETE - Excluir um ponto de coleta
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({
      mensagem: 'ID inválido'
    });
  }

  try {
    const resultado = await pool.query(
      `DELETE FROM public.pontos_coleta
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensagem: 'Ponto não encontrado'
      });
    }

    return res.json({
      mensagem: 'Ponto excluído com sucesso',
      id: resultado.rows[0].id
    });

  } catch (erro) {
    console.error('Erro ao excluir:', erro.message);

    return res.status(500).json({
      mensagem: 'Erro ao excluir ponto'
    });
  }
});

module.exports = router;