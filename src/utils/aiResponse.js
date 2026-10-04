export async function readAIResponse(response, onText) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "The simulation failed. Check your connection or API key and retry.");
  }
  if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) {
    const data = await response.json();
    if (!data.res?.trim()) throw new Error("The simulation returned no text. Please retry.");
    onText(data.res); return data.res;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", text = "";
  const consume = event => {
    const data = event.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trimStart()).join("\n");
    if (!data) return false;
    if (data === "[DONE]") return true;
    let json;
    try { json = JSON.parse(data); } catch { throw new Error("The simulation stream was interrupted. Please retry."); }
    if (json.error) throw new Error("The simulation stream failed. Please retry.");
    const delta = json.choices?.[0]?.delta?.content;
    if (delta) { text += delta; onText(text); }
    return false;
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/); buffer = events.pop() || "";
      for (const event of events) if (consume(event)) { if (!text.trim()) throw new Error("The simulation returned no text. Please retry."); return text; }
      if (done) break;
    }
    if (buffer.trim()) consume(buffer);
    if (!text.trim()) throw new Error("The simulation returned no text. Please retry.");
    // A stream that closes before [DONE] is partial, even if some text arrived.
    throw new Error("The simulation was interrupted. The partial text is retained; retry for a complete response.");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
