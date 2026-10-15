
require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateEmbedding(text) {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2',
    contents: text,
    config: {
      outputDimensionality: 768,
    },
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding || embedding.length !== 768) {
    throw new Error('El embedding generado no tiene 768 dimensiones.');
  }

  return embedding;
}

module.exports = { generateEmbedding };
