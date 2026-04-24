const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all candidatos with score
router.get('/', async (req, res) => {
  try {
    const vagaFilter = req.query.vaga_id ? 'WHERE c.vaga_id = ?' : '';
    const params = req.query.vaga_id ? [req.query.vaga_id] : [];

    const [rows] = await db.query(`
      SELECT
        c.*,
        v.local as vaga_local,
        COUNT(r.id) as perguntas_respondidas,
        SUM(CASE WHEN r.acertou = 1 THEN p.pontos ELSE 0 END) as pontos_obtidos,
        SUM(p.pontos) as pontos_totais
      FROM candidatos c
      LEFT JOIN vagas v ON v.id = c.vaga_id
      LEFT JOIN respostas r ON r.candidato_id = c.id
      LEFT JOIN perguntas p ON p.id = r.pergunta_id
      ${vagaFilter}
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, params);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single candidato with respostas
router.get('/:id', async (req, res) => {
  try {
    const [candidatos] = await db.query(
      'SELECT c.*, v.local as vaga_local FROM candidatos c LEFT JOIN vagas v ON v.id = c.vaga_id WHERE c.id = ?',
      [req.params.id]
    );
    if (!candidatos.length) return res.status(404).json({ error: 'Candidato não encontrado' });

    const [respostas] = await db.query(
      'SELECT r.*, p.texto, p.categoria, p.pontos, p.dificuldade FROM respostas r JOIN perguntas p ON p.id = r.pergunta_id WHERE r.candidato_id = ?',
      [req.params.id]
    );

    res.json({ ...candidatos[0], respostas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create candidato
router.post('/', async (req, res) => {
  const { nome, linkedin, pretensao_salarial, vaga_id, tecnologias } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
  try {
    const [result] = await db.query(
      'INSERT INTO candidatos (nome, linkedin, pretensao_salarial, vaga_id, tecnologias) VALUES (?, ?, ?, ?, ?)',
      [nome, linkedin || null, pretensao_salarial || null, vaga_id || null, JSON.stringify(tecnologias || {})]
    );
    res.status(201).json({ id: result.insertId, nome });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update candidato
router.put('/:id', async (req, res) => {
  const { nome, linkedin, pretensao_salarial, vaga_id, tecnologias } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
  try {
    await db.query(
      'UPDATE candidatos SET nome = ?, linkedin = ?, pretensao_salarial = ?, vaga_id = ?, tecnologias = ? WHERE id = ?',
      [nome, linkedin || null, pretensao_salarial || null, vaga_id || null, JSON.stringify(tecnologias || {}), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST save respostas for candidato
router.post('/:id/respostas', async (req, res) => {
  const { respostas } = req.body; // [{ pergunta_id, acertou }]
  const candidato_id = req.params.id;

  if (!Array.isArray(respostas)) return res.status(400).json({ error: 'respostas deve ser um array' });

  try {
    for (const r of respostas) {
      await db.query(
        'INSERT INTO respostas (candidato_id, pergunta_id, acertou) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE acertou = VALUES(acertou)',
        [candidato_id, r.pergunta_id, r.acertou ? 1 : 0]
      );
    }
    res.json({ success: true, saved: respostas.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE candidato
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM candidatos WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
