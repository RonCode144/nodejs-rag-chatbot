
const fs = require('node:fs/promises');
const path = require('node:path');
const { PDFParse } = require('pdf-parse');
const { chunkText } = require('./chunker');

async function main() {
  let parser;

  try {
    const filePath = path.join(
      __dirname,
      '..',
      'documents',
      'prueba.pdf'
    );

    const data = await fs.readFile(filePath);
    parser = new PDFParse({ data });

    const result = await parser.getText();
    const chunks = chunkText(result.text, 500, 75);

    console.log('Total de fragmentos:', chunks.length);

    chunks.forEach((chunk, index) => {
      console.log(`\n--- Chunk ${index} ---`);
      console.log('Palabras:', chunk.split(/\s+/).length);
      console.log(chunk.slice(0, 250));
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exitCode = 1;
  } finally {
    if (parser) await parser.destroy();
  }
}

main();
