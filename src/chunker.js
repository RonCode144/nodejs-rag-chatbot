
function chunkText(text, chunkSize = 500, overlap = 75) {
  if (overlap >= chunkSize) {
    throw new Error(
      'El solapamiento debe ser menor que el tamaño del fragmento.'
    );
  }

  const words = text.trim().split(/\s+/);
  const chunks = [];
  const step = chunkSize - overlap;

  for (let start = 0; start < words.length; start += step) {
    const chunkWords = words.slice(start, start + chunkSize);

    if (chunkWords.length === 0) break;

    chunks.push(chunkWords.join(' '));

    if (start + chunkSize >= words.length) break;
  }

  return chunks;
}

module.exports = { chunkText };
