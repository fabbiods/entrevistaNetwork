const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all vagas
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT v.*, COUNT(c.id) as total_candidatos FROM vagas v LEFT JOIN candidatos c ON c.vaga_id = v.id GROUP BY v.id ORDER BY v.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single vaga
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vagas WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Vaga não encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create vaga
router.post('/', async (req, res) => {
  const { id, local, descricao } = req.body;
  if (!local) return res.status(400).json({ error: 'Local é obrigatório' });
  try {
    if (id) {
      await db.query('INSERT INTO vagas (id, local, descricao) VALUES (?, ?, ?)', [id, local, descricao || null]);
      res.status(201).json({ id, local, descricao });
    } else {
      const [result] = await db.query('INSERT INTO vagas (local, descricao) VALUES (?, ?)', [local, descricao || null]);
      res.status(201).json({ id: result.insertId, local, descricao });
    }
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: `ID ${id} já está em uso por outra vaga` });
    res.status(500).json({ error: err.message });
  }
});

// PATCH toggle status
router.patch('/:id/status', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT status FROM vagas WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Vaga não encontrada' });
    const novoStatus = rows[0].status === 'aberta' ? 'encerrada' : 'aberta';
    await db.query('UPDATE vagas SET status = ? WHERE id = ?', [novoStatus, req.params.id]);
    res.json({ status: novoStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update vaga
router.put('/:id', async (req, res) => {
  const { new_id, local, descricao } = req.body;
  const oldId = Number(req.params.id);
  const targetId = new_id ? Number(new_id) : oldId;
  if (!local) return res.status(400).json({ error: 'Local é obrigatório' });
  try {
    if (targetId !== oldId) {
      // Troca de ID: recriar com novo ID e migrar candidatos
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query('INSERT INTO vagas (id, local, descricao) VALUES (?, ?, ?)', [targetId, local, descricao || null]);
        await conn.query('UPDATE candidatos SET vaga_id = ? WHERE vaga_id = ?', [targetId, oldId]);
        await conn.query('DELETE FROM vagas WHERE id = ?', [oldId]);
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: `ID ${targetId} já está em uso por outra vaga` });
        throw e;
      } finally {
        conn.release();
      }
    } else {
      await db.query('UPDATE vagas SET local = ?, descricao = ? WHERE id = ?', [local, descricao || null, oldId]);
    }
    res.json({ success: true, id: targetId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE vaga
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM vagas WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
