
const pool = require('./db');
const { generateEmbedding } = require('./embedding');

async function main() {
  try {
    const content =
      'PostgreSQL permite almacenar y consultar datos vectoriales mediante pgvector.';

    const embedding = await generateEmbedding(content);

    // Convertimos el array numérico al formato que entiende pgvector.
    const vector = `[${embedding.join(',')}]`;

    const result = await pool.query(
      `INSERT INTO rag_chunks
        (source_name, chunk_index, content, embedding, metadata)
       VALUES ($1, $2, $3, $4::vector, $5::jsonb)
       RETURNING id, source_name, chunk_index`,
      [
        'documento-prueba',
        0,
        content,
        vector,
        JSON.stringify({ type: 'test' }),
      ]
    );

    console.log('Fragmento guardado:', result.rows[0]);
  } catch (error) {
    console.error('Error al guardar fragmento:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
