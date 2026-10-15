# Node.js RAG Chatbot

Chatbot basado en **Retrieval-Augmented Generation (RAG)** que permite consultar documentos PDF en español mediante búsqueda semántica y generación de respuestas con modelos de Google Gemini.

El proyecto utiliza PostgreSQL con la extensión pgvector para almacenar embeddings y recuperar los fragmentos de texto más relevantes para cada pregunta. Una API REST construida con Express expone la funcionalidad de consulta.

## Características

- **Extracción de documentos:** lectura de archivos PDF mediante `pdf-parse`.
- **Fragmentación de texto (chunking):** división del contenido en fragmentos con solapamiento para conservar contexto.
- **Generación de embeddings:** representación vectorial del contenido con Gemini Embedding 2.
- **Búsqueda semántica:** recuperación de fragmentos relevantes mediante similitud coseno en PostgreSQL y pgvector.
- **Generación de respuestas:** uso de Gemini para responder preguntas a partir del contexto recuperado.
- **Referencias a las fuentes:** devuelve el nombre del documento, el índice del fragmento y su similitud calculada.
- **API REST:** endpoint para enviar preguntas y recibir respuestas en formato JSON.
- **Manejo de errores:** validación de las preguntas y cierre controlado de conexiones.

## Tecnologías

| Tecnología | Uso |
|---|---|
| Node.js | Entorno de ejecución |
| Express | API REST |
| PostgreSQL | Base de datos |
| pgvector | Almacenamiento y búsqueda vectorial |
| Google Gemini API | Embeddings y generación de respuestas |
| `@google/genai` | SDK de Google GenAI |
| `pdf-parse` | Extracción de texto de PDF |
| `pg` | Conexión con PostgreSQL |
| `dotenv` | Gestión de variables de entorno |
| Nodemon | Recarga automática durante el desarrollo |

## Arquitectura

El flujo principal del sistema es el siguiente:

1. Se proporciona un documento PDF.
2. Se extrae el texto del documento.
3. El texto se divide en fragmentos con solapamiento.
4. Se genera un embedding para cada fragmento.
5. Los fragmentos, sus embeddings y sus metadatos se almacenan en PostgreSQL.
6. El usuario envía una pregunta a la API.
7. Se genera el embedding de la pregunta.
8. pgvector recupera los fragmentos semánticamente más cercanos.
9. Gemini genera una respuesta utilizando los fragmentos recuperados como contexto.
10. La API devuelve la respuesta y las referencias a las fuentes.

## Requisitos previos

Antes de ejecutar el proyecto, necesitas:

- Node.js y npm.
- PostgreSQL.
- La extensión pgvector instalada y habilitada.
- Una clave de API de Google AI Studio con acceso a los modelos utilizados.

## Instalación

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd nodejs-rag-chatbot
```

Si ya tienes el proyecto en tu equipo, abre la carpeta desde la terminal.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear la base de datos

Crea una base de datos llamada `rag_db` desde PostgreSQL o DBeaver.

Después, habilita pgvector dentro de esa base de datos:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Crea la tabla para almacenar los fragmentos y sus embeddings:

```sql
CREATE TABLE rag_chunks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_name TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(768),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rag_chunks_source_index
        UNIQUE (source_name, chunk_index)
);

CREATE INDEX idx_rag_chunks_embedding
ON rag_chunks
USING hnsw (embedding vector_cosine_ops);
```

La dimensión de los vectores debe coincidir con la configurada en el modelo de embeddings.

### 4. Configurar las variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL=postgresql://USUARIO:CONTRASENA@localhost:5432/rag_db
GEMINI_API_KEY=TU_CLAVE_DE_GOOGLE_GEMINI
PORT=3000
```

Sustituye los valores por los de tu entorno. No compartas tu clave de API ni la subas al repositorio.

Asegúrate de incluir lo siguiente en `.gitignore`:

```gitignore
node_modules/
.env
```

### 5. Agregar un documento PDF

Coloca el archivo que quieras procesar en la carpeta `documents/`.

Actualmente, el script de ingesta está preparado para procesar:

```text
documents/prueba.pdf
```

Para procesar otro archivo, actualiza la ruta correspondiente en `src/ingest-pdf.js`.

## Ejecución

### Procesar el documento

Ejecuta el script de ingesta:

```bash
node src/ingest-pdf.js
```

El script extrae el texto, lo divide en fragmentos, genera los embeddings y almacena los registros en PostgreSQL dentro de una transacción.

Al volver a procesar el mismo documento, reemplaza los fragmentos anteriores de esa fuente.

### Iniciar la API

```bash
npm run api
```

Por defecto, el servidor escucha en:

```text
http://localhost:3000
```

### Verificar el estado del servidor

**Endpoint:** `GET /health`

```bash
curl http://localhost:3000/health
```

Respuesta esperada:

```json
{
  "status": "ok"
}
```

## Uso de la API

### Consultar el chatbot

**Endpoint:** `POST /api/chat`

**Content-Type:** `application/json`

Ejemplo de solicitud:

```json
{
  "question": "¿Qué condiciones se deben verificar antes de despachar un pedido?"
}
```

Ejemplo de respuesta:

```json
{
  "question": "¿Qué condiciones se deben verificar antes de despachar un pedido?",
  "answer": "Antes de despachar un pedido, se debe verificar que la dirección de entrega esté completa, que exista disponibilidad de los productos y que el pedido no se encuentre cancelado.",
  "sources": [
    {
      "source": "prueba.pdf",
      "chunk": 0,
      "similarity": 0.7442
    },
    {
      "source": "prueba.pdf",
      "chunk": 1,
      "similarity": 0.7318
    }
  ]
}
```

Los valores de similitud son ejemplos. Los resultados reales dependen de la pregunta y del contenido almacenado.

### Validaciones actuales

- La pregunta es obligatoria y debe ser texto.
- La pregunta no puede superar los 1000 caracteres.
- Los errores internos se registran en el servidor y la API devuelve un mensaje genérico al cliente.

## Estructura del proyecto

```text
nodejs-rag-chatbot/
├── documents/
│   └── prueba.pdf
├── src/
│   ├── app.js
│   ├── server.js
│   ├── db.js
│   ├── embedding.js
│   ├── chunker.js
│   ├── ingest-pdf.js
│   ├── rag.js
│   ├── test-db.js
│   ├── test-embedding.js
│   ├── test-chunker.js
│   ├── test-insert.js
│   ├── test-search.js
│   └── test-rag.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

**Responsabilidad de los módulos principales:**

- `app.js`: configuración de Express, endpoints y validaciones.
- `server.js`: inicio del servidor y cierre controlado de recursos.
- `db.js`: configuración del pool de conexiones a PostgreSQL.
- `embedding.js`: generación de embeddings con Gemini.
- `chunker.js`: división del texto en fragmentos.
- `ingest-pdf.js`: extracción, fragmentación e indexación del PDF.
- `rag.js`: búsqueda semántica, construcción del contexto y generación de respuestas.

Los archivos `test-*.js` son scripts auxiliares para comprobar componentes durante el desarrollo.

## Configuración del RAG

Los parámetros actuales del prototipo son:

| Parámetro | Valor |
|---|---|
| Modelo de embeddings | `gemini-embedding-2` |
| Dimensión vectorial | 768 |
| Tamaño del fragmento | 500 palabras |
| Solapamiento | 75 palabras |
| Fragmentos recuperados | Máximo 3 |
| Métrica de búsqueda | Distancia coseno |
| Índice vectorial | HNSW |
| Modelo generativo | `gemini-3.8-flash` |

Estos valores son configuraciones iniciales para experimentar. Deben evaluarse con diferentes documentos y preguntas antes de considerarse óptimos para producción.

## Limitaciones conocidas

- La ingesta está orientada actualmente a un PDF y una ruta configurados en el código.
- No hay interfaz web; las consultas se realizan mediante la API.
- La calidad de las respuestas depende de la calidad del documento, los fragmentos recuperados y el modelo generativo.
- La similitud vectorial no representa una probabilidad de que la respuesta sea correcta.
- Todavía se debe fortalecer la evaluación de preguntas sin respuesta en los documentos.
- Las fuentes devueltas identifican documento y fragmento, pero está pendiente incluir el contenido recuperado para facilitar la verificación.
- No se ha implementado todavía un conjunto automatizado de pruebas de integración y evaluación de respuestas.
- El prototipo no debe considerarse listo para producción sin controles adicionales de seguridad, observabilidad, límites de consumo y evaluación de calidad.

## Próximas mejoras

- [ ] Mejorar la respuesta cuando el contexto no contiene información suficiente.
- [ ] Devolver fragmentos de texto como citas verificables.
- [ ] Incorporar pruebas automatizadas para la API y el flujo RAG.
- [ ] Permitir la ingesta de varios PDF sin modificar el código.
- [ ] Añadir metadatos de documentos y filtros de búsqueda.
- [ ] Evaluar el tamaño de los fragmentos y el número de resultados recuperados.
- [ ] Implementar una interfaz de chat.
- [ ] Añadir autenticación, límites de uso y controles de seguridad antes de desplegar el sistema.

## Referencia

Este proyecto está inspirado en el tutorial de freeCodeCamp:

[How to Build a RAG Chatbot with Node.js, Gemini, and pgvector](https://www.freecodecamp.org/news/how-to-build-rag-chatbot-nodejs-gemini-pgvector/)

## Licencia

La licencia del proyecto está pendiente de definir.
