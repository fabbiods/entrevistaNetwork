const express = require('express');
const cors = require('cors');
const path = require('path');

const vagasRouter = require('./routes/vagas');
const candidatosRouter = require('./routes/candidatos');
const perguntasRouter = require('./routes/perguntas');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/vagas', vagasRouter);
app.use('/api/candidatos', candidatosRouter);
app.use('/api/perguntas', perguntasRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 IS Network Interview System running at http://localhost:${PORT}\n`);
});
