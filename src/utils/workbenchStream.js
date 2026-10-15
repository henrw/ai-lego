// The server emits newline-delimited events, not incomplete JSON results.
export async function readWorkbenchStream(response, onProgress) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', result;
  const consume = line => {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === 'error') throw new Error(event.error);
    if (event.type === 'progress') onProgress(event.entries);
    if (event.type === 'complete') result = event;
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = buffer.split('\n'); buffer = lines.pop(); lines.forEach(consume);
      if (done) break;
    }
    if (buffer.trim()) consume(buffer);
    if (!result) throw new Error('The stream ended before verification. Your previous run is retained; retry.');
    return result;
  } finally { reader.releaseLock(); }
}
