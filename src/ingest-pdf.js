
const fs = require('node:fs/promises');
const path = require('node:path');
const { PDFParse } = require('pdf-parse');

const pool = require('./db');
const { generateEmbedding } = require('./embedding');
const { chunkText } = require('./chunker');

async function main() {
  let parser;
  let client;

  try {
    const filePath = path.join(
      __dirname,
      '..',
      'documents',
      'prueba.pdf'
    );

    const sourceName = path.basename(filePath);
    const data = await fs.readFile(filePath);

    parser = new PDFParse({ data });
    const result = await parser.getText();
    const text = result.text.trim();

    if (!text) {
      throw new Error('El PDF no contiene texto extraíble.');
    }

    const chunks = chunkText(text, 500, 75);

    console.log(`PDF: ${sourceName}`);
    console.log(`Chunks encontrados: ${chunks.length}`);

    client = await pool.connect();

    // Evita dejar una ingesta parcialmente guardada.
    await client.query('BEGIN');

    // Reprocesar el mismo archivo reemplaza sus chunks anteriores.
    await client.query(
      'DELETE FROM rag_chunks WHERE source_name = $1',
      [sourceName]
    );

    for (let index = 0; index < chunks.length; index++) {
      const content = chunks[index];

      console.log(
        `Generando embedding ${index + 1}/${chunks.length}...`
      );

      const embedding = await generateEmbedding(content);
      const vector = `[${embedding.join(',')}]`;

      await client.query(
        `INSERT INTO rag_chunks
          (source_name, chunk_index, content, embedding, metadata)
         VALUES ($1, $2, $3, $4::vector, $5::jsonb)`,
        [
          sourceName,
          index,
          content,
          vector,
          JSON.stringify({
            wordCount: content.split(/\s+/).length,
          }),
        ]
      );
    }

    await client.query('COMMIT');

    console.log(
      `Ingesta completada: ${chunks.length} chunks guardados.`
    );
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }

    console.error('Error durante la ingesta:', error.message);
    process.exitCode = 1;
  } finally {
    if (parser) await parser.destroy();
    if (client) client.release();
    await pool.end();
  }
}

main();
