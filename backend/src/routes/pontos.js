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