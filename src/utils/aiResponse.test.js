import { TextEncoder, TextDecoder } from "util";
global.TextDecoder = TextDecoder;
import { readAIResponse } from "./aiResponse";

function streamResponse(chunks) {
  const reader = { read: jest.fn(), cancel: jest.fn().mockResolvedValue(), releaseLock: jest.fn() };
  chunks.forEach(chunk => reader.read.mockResolvedValueOnce({ value: new TextEncoder().encode(chunk), done: false }));
  reader.read.mockResolvedValue({ done: true });
  return { response: { ok: true, body: { getReader: () => reader }, headers: { get: () => "text/event-stream" } }, reader };
}
it("decodes split SSE events and CRLF without losing text", async () => {
  const { response, reader } = streamResponse(['data: {"choices":[{"delta":{"content":"Hel', 'lo"}}]}\r\n\r\ndata: {"choices":[{"delta":{"content":" world"}}]}\r\n\r\ndata: [DONE]\r\n\r\n']);
  const onText = jest.fn();
  await expect(readAIResponse(response, onText)).resolves.toBe("Hello world");
  expect(onText).toHaveBeenLastCalledWith("Hello world"); expect(reader.cancel).toHaveBeenCalled();
});
it("rejects an empty stream and releases its reader", async () => {
  const { response, reader } = streamResponse(['data: [DONE]\n\n']);
  await expect(readAIResponse(response, jest.fn())).rejects.toThrow("no text"); expect(reader.releaseLock).toHaveBeenCalled();
});
it("retains partial output while reporting a prematurely closed stream", async () => {
  const { response } = streamResponse(['data: {"choices":[{"delta":{"content":"Partial"}}]}\n\n']);
  const onText = jest.fn();
  await expect(readAIResponse(response, onText)).rejects.toThrow("interrupted"); expect(onText).toHaveBeenCalledWith("Partial");
});
it("surfaces quota errors and empty non-streaming responses", async () => {
  await expect(readAIResponse({ ok: false, json: async () => ({ error: "Quota reached" }) }, jest.fn())).rejects.toThrow("Quota reached");
  await expect(readAIResponse({ ok: true, headers: { get: () => "application/json" }, json: async () => ({ res: "" }) }, jest.fn())).rejects.toThrow("no text");
});
