
const fs = require('node:fs/promises');
const path = require('node:path');
const { PDFParse } = require('pdf-parse');

async function main() {
  const filePath = path.join(
    __dirname,
    '..',
    'documents',
    'prueba.pdf'
  );

  let parser;

  try {
    const data = await fs.readFile(filePath);

    parser = new PDFParse({ data });
    const result = await parser.getText();

    const text = result.text.trim();

    if (!text) {
      throw new Error(
        'No se extrajo texto. El PDF podría ser escaneado.'
      );
    }

    console.log('PDF leído correctamente.');
    console.log('Caracteres extraídos:', text.length);
    console.log('\nPrimeros 1500 caracteres:\n');
    console.log(text.slice(0, 1500));
  } catch (error) {
    console.error('Error al procesar PDF:', error.message);
    process.exitCode = 1;
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}

main();
