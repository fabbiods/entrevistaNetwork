const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all perguntas grouped by categoria
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM perguntas ORDER BY categoria, id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET perguntas by categoria
router.get('/categorias', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT categoria FROM perguntas ORDER BY categoria');
    res.json(rows.map(r => r.categoria));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
