
require('dotenv').config();

const app = require('./app');
const pool = require('./db');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Servidor RAG escuchando en http://localhost:${PORT}`);
});

function shutdown() {
  server.close(async () => {
    try {
      await pool.end();
      console.log('Servidor y conexión a PostgreSQL cerrados.');
      process.exit(0);
    } catch (error) {
      console.error('Error al cerrar PostgreSQL:', error.message);
      process.exit(1);
    }
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
