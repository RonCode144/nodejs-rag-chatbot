
require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: 'PostgreSQL permite almacenar y consultar datos vectoriales.',
      config: {
        outputDimensionality: 768,
      },
    });

    const embedding = response.embeddings?.[0]?.values;

    if (!embedding) {
      throw new Error('Gemini no devolvió ningún embedding.');
    }

    console.log('Embedding generado correctamente.');
    console.log('Dimensiones:', embedding.length);
    console.log('Primeros 5 valores:', embedding.slice(0, 5));
  } catch (error) {
    console.error('Error al generar embedding:', error.message);
    process.exitCode = 1;
  }
}

main();
