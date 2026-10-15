import test, { beforeEach, afterEach } from 'node:test';
const originalKey = process.env.OPENAI_API_KEY;
beforeEach(() => { process.env.OPENAI_API_KEY = 'sk-server-fixture'; });
afterEach(() => { if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey; });
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
const request = (name, body) => ({ method: 'POST', headers: { 'x-openai-api-key': 'sk-test-placeholder' }, query: {}, body: body || { cardsData: [{ stage: 'data', description: 'Historical resumes' }], ...(name === 'evaluate' ? { personaDescription: 'Applicant' } : { existingPersonas: [] }) } });
test('rejects invalid methods, missing keys and malformed input without making an upstream request', async () => {
  const original = global.fetch; let calls = 0; global.fetch = async () => { calls++; };
  try {
    for (const [name, handler] of Object.entries(handlers)) {
      let res = response(); await handler({ ...request(name), method: 'GET' }, res); assert.equal(res.statusCode, 405);
      delete process.env.OPENAI_API_KEY;
      res = response(); await handler({ ...request(name), headers: {} }, res); assert.equal(res.statusCode, 401);
      process.env.OPENAI_API_KEY = 'sk-server-fixture';
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

test('never uses a configured server key when the user has not provided one', async () => {
  const original = global.fetch;
  global.fetch = async () => assert.fail('Must not contact OpenAI without a user key');
  try {
    for (const [name, handler] of Object.entries(handlers)) {
      const req = request(name); req.headers = {};
      const res = response(); await handler(req, res); assert.equal(res.statusCode, 401);
    }
  } finally { global.fetch = original; }
});

test('classic persona generation includes the project name and every lifecycle stage', async () => {
  const original = global.fetch;
  global.fetch = async (url, options) => {
    const payload = JSON.parse(options.body);
    assert.match(payload.messages[1].content, /Hiring support/);
    assert.match(payload.messages[1].content, /Recruiters review the shortlist/);
    assert.match(payload.messages[1].content, /Historical resumes/);
    return { ok: true, json: async () => ({ choices: [{ message: { content: '<personas><persona>An applicant.</persona></personas>' } }] }) };
  };
  try {
    const res = response();
    await handlers.generate(request('generate', { projectName: 'Hiring support', existingPersonas: [], cardsData: [{ stage: 'data', description: 'Historical resumes' }, { stage: 'deploy', description: 'Recruiters review the shortlist' }] }), res);
    assert.equal(res.statusCode, 200);
  } finally { global.fetch = original; }
});
test('classic simulation grounds first-person voice in the profile without exposing hidden engineering knowledge',async()=>{
 const oldFetch=global.fetch;
 global.fetch=async(_,options)=>{
  const payload=JSON.parse(options.body);assert.match(payload.messages[0].content,/Speak entirely in first person/);
  assert.match(payload.messages[0].content,/Never claim I know hidden training data/);
  const input=JSON.parse(payload.messages[1].content);assert.equal(input.persona.profile.goal,'Find stable work');assert.equal(input.plan[0].stage,'data');
  return {ok:true,json:async()=>({choices:[{message:{content:'I want my recent work to count.'}}]})};
 };
 try{const res=response();await handlers.evaluate(request('evaluate',{personaDescription:'Applicant',personaProfile:{goal:'Find stable work',constraints:'Limited time'},cardsData:[{stage:'data',description:'Historical resumes'}]}),res);assert.equal(res.statusCode,200);}
 finally{global.fetch=oldFetch;}
});

test('uses the personal key instead of the server fallback, without adding it to prompts', async () => {
  const original = global.fetch;
  global.fetch = async (_url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer sk-personal-fixture');
    assert.ok(!options.body.includes('sk-personal-fixture'));
    return { ok: true, json: async () => ({ choices: [{ message: { content: '<personas><persona>Applicant</persona></personas>' } }] }) };
  };
  try {
    for (const [name, handler] of Object.entries(handlers)) {
      const req = request(name); req.headers['x-openai-api-key'] = 'sk-personal-fixture';
      const res = response(); await handler(req, res); assert.equal(res.statusCode, 200);
      delete process.env.OPENAI_API_KEY;
      const personalOnly = response(); await handler(req, personalOnly); assert.equal(personalOnly.statusCode, 200);
      req.headers['x-openai-api-key'] = ['sk-invalid'];
      const invalid = response(); await handler(req, invalid); assert.equal(invalid.statusCode, 400);
    }
  } finally { global.fetch = original; }
});
