
const pool = require('./db');

async function main() {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        version() AS postgres_version,
        extversion AS pgvector_version
      FROM pg_extension
      WHERE extname = 'vector';
    `);

    console.log('Conexión exitosa:', result.rows[0]);
  } catch (error) {
    console.error('Error de conexión:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
