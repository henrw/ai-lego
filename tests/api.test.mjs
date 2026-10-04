import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EventEmitter } from 'node:events';
const handlers = {};
for (const name of ['evaluate', 'generate']) {
  const source = await readFile(new URL(`../api/${name}.js`, import.meta.url), 'utf8');
  handlers[name] = (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).default;
}
function response() {
  const res = new EventEmitter();
  return Object.assign(res, { statusCode: 200, headers: {}, chunks: [], setHeader(key, value) { this.headers[key] = value; }, status(value) { this.statusCode = value; return this; }, json(data) { this.data = data; this.writableEnded = true; return this; }, write(chunk) { this.chunks.push(chunk); }, end() { this.writableEnded = true; }, flushHeaders() { this.headersSent = true; } });
}
const request = (name, body) => ({ method: 'POST', headers: { authorization: 'Bearer sk-test-placeholder' }, query: {}, body: body || { cardsData: [{ stage: 'data', description: 'Historical resumes' }], ...(name === 'evaluate' ? { personaDescription: 'Applicant' } : { existingPersonas: [] }) } });
test('rejects invalid methods, missing keys and malformed input without making an upstream request', async () => {
  const original = global.fetch; let calls = 0; global.fetch = async () => { calls++; };
  try {
    for (const [name, handler] of Object.entries(handlers)) {
      let res = response(); await handler({ ...request(name), method: 'GET' }, res); assert.equal(res.statusCode, 405);
      res = response(); await handler({ ...request(name), headers: {} }, res); assert.equal(res.statusCode, 401);
      res = response(); await handler(request(name, { cardsData: [null] }), res); assert.equal(res.statusCode, 400);
    }
    assert.equal(calls, 0);
  } finally { global.fetch = original; }
});
test('returns recoverable errors on upstream failure and releases disconnect listeners', async () => {
  const original = global.fetch; global.fetch = async () => { throw new Error('Network failed'); };
  try {
    for (const [name, handler] of Object.entries(handlers)) {
      const res = response(); await handler(request(name), res); assert.equal(res.statusCode, 502); assert.match(res.data.error, /retry/i); assert.equal(res.listenerCount('close'), 0);
    }
  } finally { global.fetch = original; }
});
test('reports a broken SSE stream and completes the response', async () => {
  const original = global.fetch;
  global.fetch = async () => ({ ok: true, body: { getReader: () => ({ read: async () => { throw new Error('Interrupted'); } }) } });
  try {
    const res = response(); const req = request('evaluate'); req.headers.accept = 'text/event-stream';
    await handlers.evaluate(req, res); assert.equal(res.writableEnded, true); assert.match(res.chunks.join(''), /"error"/); assert.equal(res.listenerCount('close'), 0);
  } finally { global.fetch = original; }
});
test('rejects empty content instead of returning success', async () => {
  const original = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: '' } }] }) });
  try {
    for (const [name, handler] of Object.entries(handlers)) { const res = response(); await handler(request(name), res); assert.equal(res.statusCode, 502); }
  } finally { global.fetch = original; }
});
