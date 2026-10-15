
require('dotenv').config();

const express = require('express');
const { askRag } = require('./rag');

const app = express();

app.use(express.json({ limit: '10kb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/chat', async (req, res) => {
  const { question } = req.body ?? {};

  if (typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({
      error: 'El campo question es obligatorio y debe ser texto.',
    });
  }

  if (question.length > 1000) {
    return res.status(400).json({
      error: 'La pregunta no puede superar los 1000 caracteres.',
    });
  }

  try {
    const result = await askRag(question.trim());

    return res.json({
      question: question.trim(),
      answer: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    console.error('Error en /api/chat:', error.message);

    return res.status(500).json({
      error: 'No fue posible procesar la pregunta.',
    });
  }
});

module.exports = app;
