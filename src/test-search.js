
const pool = require('./db');
const { generateEmbedding } = require('./embedding');

async function main() {
  try {
    const question =
      '¿Cómo puedo guardar información vectorial en una base de datos?';

    const embedding = await generateEmbedding(question);
    const vector = `[${embedding.join(',')}]`;

    const result = await pool.query(
      `SELECT
         id,
         source_name,
         content,
         1 - (embedding <=> $1::vector) AS similarity
       FROM rag_chunks
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT 3`,
      [vector]
    );

    console.log('Pregunta:', question);
    console.log('\nFragmentos recuperados:');

    for (const row of result.rows) {
      console.log({
        id: row.id,
        source: row.source_name,
        similarity: Number(row.similarity).toFixed(4),
        content: row.content,
      });
    }
  } catch (error) {
    console.error('Error en la búsqueda:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
