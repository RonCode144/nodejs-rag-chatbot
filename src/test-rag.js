
const pool = require('./db');
const { askRag } = require('./rag');

async function main() {
  try {
    const question =
      //'¿Cuándo se considera despachado un pedido?';
      // '¿Qué condiciones se deben verificar antes de despachar un pedido?'
      // '¿Qué significa el estado Novedad?'
        '¿Cuál es el procedimiento para devolver un producto?'

    const result = await askRag(question);

    console.log('\nPregunta:', question);
    console.log('\nRespuesta:\n', result.answer);
    console.log('\nFuentes recuperadas:');

    console.table(result.sources);
  } catch (error) {
    console.error('Error en RAG:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
