import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EventEmitter } from 'node:events';
const source = await readFile(new URL('../api/workbench.js', import.meta.url), 'utf8');
const { default: handler, validateResult } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const plan = [{ uid: 'data', stage: 'data', description: 'Use historical hiring decisions as labels.' }];
const fields = ['relationship','goal','circumstances','constraints','knowledge','assumptions','unknowns'];
const profile = { ...Object.fromEntries(fields.map(k => [k, 'Example'])), evidence: '', provenance: Object.fromEntries(fields.map(k => [k, 'designer'])) };
const body = () => ({ action: 'scenario', cardsData: plan.map(c => ({ ...c })), persona: { description: 'Applicant', profile }, scenario: { id: 'adverse-outcome', title: 'Adverse outcome', situation: 'Applicant receives a rejection', mode: 'walkthrough', assumption: '' } });
const result = () => ({ steps: [{ observation: 'Notification', action: 'Requests review', response: 'Not specified', assumption: 'May request review' }], concern: { title: 'Potential exclusion', mechanism: 'Historical patterns may persist', blockIds: ['data'], planEvidence: [{ cardId: 'data', quote: 'historical hiring decisions' }], assumptions: ['Past selection may be biased'], unknowns: ['Actual error patterns'], validation: 'Audit errors and interview applicants', mitigation: 'Investigate labels' }, alternatives: [{ title: 'Appeal', description: 'May request review' }, { title: 'Leave', description: 'May move on' }], comparison: null });
const response = () => Object.assign(new EventEmitter(), { statusCode: 200, setHeader() {}, status(v) { this.statusCode = v; return this; }, json(v) { this.data = v; this.writableEnded = true; return this; } });
async function call(input, output, inspect) {
  const key = process.env.OPENAI_API_KEY; const fetch = global.fetch; process.env.OPENAI_API_KEY = 'test-server-key';
  global.fetch = async (_, options) => { inspect?.(JSON.parse(options.body), options); return { ok: true, json: async () => ({ choices: [{ message: { content: typeof output === 'string' ? output : JSON.stringify(output) } }] }) }; };
  try { const res = response(); await handler({ method: 'POST', headers: { 'x-openai-api-key': 'sk-user-fixture' }, body: input }, res); return res; }
  finally { global.fetch = fetch; if (key === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = key; }
}
test('rejects invented block IDs and unverifiable quotations', () => {
  assert.equal(validateResult(result(), plan, false), true);
  for (const mutate of [r => r.concern.blockIds.push('invented'), r => r.concern.planEvidence[0].quote = 'There is an appeal process', r => r.concern.planEvidence[0].cardId = 'unknown', r => r.steps[0].observation = '', r => r.steps = [], r => r.alternatives = []]) {
    const r = result(); mutate(r); assert.equal(validateResult(r, plan, false), false);
  }
});
test('validates input before sending an upstream request', async () => {
  for (const mutate of [b => b.cardsData.push(b.cardsData[0]), b => b.scenario.visibleContext = 123, b => b.persona.profile = {}, b => b.previous = { result: {}, planSnapshot: plan }, b => b.action = 'unknown']) {
    const b = body(); mutate(b); const res = await call(b, result(), () => assert.fail('must not call upstream'));
    assert.equal(res.statusCode, 400);
  }
});
test('returns structured output, model provenance and protects instruction boundaries', async () => {
  const res = await call(body(), result(), (payload, options) => {
    assert.equal(payload.model, 'gpt-6.1-sol');
    assert.equal(payload.reasoning_effort, 'low');
    assert.ok(payload.max_completion_tokens >= 4000);
    assert.equal(payload.temperature, undefined);
    assert.equal(payload.max_tokens, undefined);
    assert.equal(options.headers.Authorization, 'Bearer sk-user-fixture');
    assert.equal(payload.messages[1].role, 'user');
    assert.match(payload.messages[0].content, /untrusted source material/);
    assert.match(payload.messages[0].content, /Never give the stakeholder hidden/);
  });
  assert.equal(res.statusCode, 200); assert.deepEqual(res.data.result, result()); assert.ok(res.data.promptVersion); assert.equal(res.listenerCount('close'), 0);
});
test('rejects incomplete JSON and unverified results with retryable errors', async () => {
  for (const output of ['{', { steps: [] }]) {
    const res = await call(body(), output); assert.equal(res.statusCode, 502); assert.match(res.data.error, /retry/); assert.equal(res.listenerCount('close'), 0);
  }
});
test('replay requires a valid comparison and sends the original concern and plan', async () => {
  const b = body(); b.previous = { planSnapshot: plan, result: result() };
  assert.equal((await call(b, result())).statusCode, 502);
  const r = result(); r.comparison = { status: 'persists', explanation: 'No relevant change', residual: 'Need human evidence', newBurden: '', changedBlocks: [] };
  const res = await call(b, r, payload => { assert.deepEqual(JSON.parse(payload.messages[1].content).previous, b.previous); assert.match(payload.messages[0].content, /Cosmetic assurances/); });
  assert.equal(res.statusCode, 200);
});
test('profile generation uses all stages and labels generated facts as hypotheses', async () => {
  const b = { action: 'personas', projectName: 'Hiring support', cardsData: [...plan, { uid:'deploy', stage:'deploy', description:'A recruiter sees the ranking.' }], existingPersonas: [] };
  const output = { personas: [1,2,3].map(i => ({ description: `Stakeholder ${i}`, profile: { ...profile, evidence: 'Invented citation' } })) };
  const res = await call(b, output, payload => { assert.match(payload.messages[1].content, /A recruiter sees the ranking/); assert.equal(JSON.parse(payload.messages[1].content).projectName, 'Hiring support'); });
  assert.equal(res.statusCode, 200); assert.equal(res.data.result.personas[0].profile.evidence, ''); assert.ok(Object.values(res.data.result.personas[0].profile.provenance).every(v => v === 'generated'));
});
test('network failure releases listeners and returns a recoverable response', async () => {
  const old = global.fetch, key = process.env.OPENAI_API_KEY; process.env.OPENAI_API_KEY = 'fixture'; global.fetch = async () => { throw new Error('network'); };
  try { const res = response(); await handler({ method:'POST', headers: { 'x-openai-api-key': 'sk-user-fixture' }, body:body() }, res); assert.equal(res.statusCode,502); assert.equal(res.listenerCount('close'),0); }
  finally { global.fetch=old; if (key === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY=key; }
});

test('replay must account for every changed specification, including removed blocks', async () => {
  const b = body(); b.previous = { planSnapshot: [...plan, {uid:'removed',stage:'deploy',description:'Old process'}], result:result() };
  b.cardsData[0].description += ' Audit labels before deployment.';
  const r=result();r.comparison={status:'persists',explanation:'Review implementation',residual:'Unknown effectiveness',newBurden:'',changedBlocks:[]};
  assert.equal((await call(b,r)).statusCode,502);
  r.comparison.changedBlocks=[{cardId:'data',effect:'Adds label audit'},{cardId:'removed',effect:'Removes old process'}];
  const res=await call(b,r,payload=>{
    const input=JSON.parse(payload.messages[1].content);assert.equal(input.planChanges.length,2);assert.equal(input.planChanges[1].after,null);
    assert.match(payload.messages[0].content,/BASELINE encounter/);
  });
  assert.equal(res.statusCode,200);
});

test('temporal moments select distinct prompt responsibilities', async () => {
  for (const [id, expected] of [['before', /agency BEFORE/], ['outcome', /WHEN an outcome/], ['after', /longer-term effects AFTER/]]) {
    const b = body(); b.scenario.id = id;
    const res = await call(b, result(), payload => assert.match(payload.messages[0].content, expected));
    assert.equal(res.statusCode, 200);
  }
});

const traceEntry = card => ({ cardId: card.uid, status: 'concern', stakeholderExperience: 'The person receives an outcome; details not specified.', analysis: 'Historical decisions could shape this outcome.', comment: 'Check whether historical labels exclude applicants with career breaks.', relatedBlockIds: [], planEvidence: [{cardId:card.uid,quote:card.description}], assumptions: ['Labels may reflect historical bias'], unknowns: ['Actual error rates'], validation: 'Audit label and error patterns.' });
test('full trace requires exactly one verified entry per block and rejects fabricated links', async () => {
  const b = body(); b.scenario.stageScope='all';
  const r=result(); r.stageTrace=[traceEntry(plan[0])];
  assert.equal((await call(b,r,payload=>assert.match(payload.messages[0].content,/do not force a risk/))).statusCode,200);
  for (const mutate of [r=>delete r.stageTrace, r=>r.stageTrace.push(r.stageTrace[0]), r=>r.stageTrace[0].cardId='unknown', r=>r.stageTrace[0].relatedBlockIds=['fake'], r=>r.stageTrace[0].planEvidence[0].quote='fabricated', r=>r.stageTrace[0].status='safe']) {
    const bad=structuredClone(r);mutate(bad);
    assert.equal((await call(b,bad)).statusCode,502);
  }
});
test('full trace orders repeated stages deterministically and allows missing specifications without forced concerns',async()=>{
  const b=body();b.scenario.stageScope='all';b.cardsData=[{uid:'deploy',stage:'deploy',description:''},...plan,{uid:'data2',stage:'data',description:'Additional source'}];
  const r=result();r.stageTrace=b.cardsData.map(traceEntry);
  r.stageTrace[0]={...r.stageTrace[0],status:'insufficient_information',planEvidence:[],comment:'How is the outcome communicated?'};
  r.stageTrace[2]={...r.stageTrace[2],status:'no_additional_concern',comment:'No additional concern identified in this source.'};
  const res=await call(b,r,payload=>assert.deepEqual(JSON.parse(payload.messages[1].content).stageOrder,['data','data2','deploy']));
  assert.equal(res.statusCode,200);assert.deepEqual(res.data.result.stageTrace.map(e=>e.cardId),['data','data2','deploy']);
  r.stageTrace[0].status='concern';assert.equal((await call(b,r)).statusCode,502);
});
test('no-concern entries can omit a validation question while concerns cannot', async()=>{
 const b=body();b.scenario.stageScope='all';const r=result();r.stageTrace=[{...traceEntry(plan[0]),status:'no_additional_concern',validation:''}];
 assert.equal((await call(b,r)).statusCode,200);r.stageTrace[0].status='concern';assert.equal((await call(b,r)).statusCode,502);
});
test('parses a complete fenced JSON object but rejects extra fragments and prose', async()=>{
 const b=body();b.scenario.stageScope='all';const r=result();r.stageTrace=[traceEntry(plan[0])];
 assert.equal((await call(b,'```json\n'+JSON.stringify(r)+'\n```')).statusCode,200);
 assert.equal((await call(b,JSON.stringify(r)+'.')).statusCode,200);
 assert.equal((await call(b,JSON.stringify(r)+'\n"stageTrace": []')).statusCode,502);
 assert.equal((await call(b,'Here is the result: '+JSON.stringify(r))).statusCode,502);
});

test('streams partial comments before final verification across split upstream frames', async () => {
  const b=body();b.scenario.stageScope='all';b.stream=true;
  const r=result();r.stageTrace=[traceEntry(plan[0])];
  const raw=JSON.stringify({stageTrace:r.stageTrace,...r});
  const oldFetch=global.fetch,key=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='fixture';
  const events=[];const res=response();res.write=line=>{res.headersSent=true;events.push(JSON.parse(line));};res.end=()=>{res.writableEnded=true;};
  global.fetch=async(_,options)=>{
    const payload=JSON.parse(options.body);assert.equal(payload.stream,true);assert.match(payload.messages[0].content,/stageTrace FIRST/);
    const frames=[...raw].map(content=>'data: '+JSON.stringify({choices:[{delta:{content}}]})+'\n\n').join('')+'data: [DONE]\n\n';
    return {ok:true,body:(async function*(){for(let i=0;i<frames.length;i+=17)yield Buffer.from(frames.slice(i,i+17));})()};
  };
  try {
    await handler({method:'POST',headers:{'x-openai-api-key':'sk-user-fixture'},body:b},res);
    const progress=events.filter(e=>e.type==='progress');
    assert.ok(progress.length>5);assert.ok(progress.some(e=>e.entries[0].comment.length>0 && e.entries[0].comment.length<r.stageTrace[0].comment.length));
    assert.deepEqual(events.at(-1).result,r);assert.equal(events.at(-1).type,'complete');assert.equal(res.listenerCount('close'),0);
  } finally {global.fetch=oldFetch;if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;}
});
test('partial trace scanner handles quotes, braces, unicode and incomplete escapes',async()=>{
  const {stageProgress}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const raw=JSON.stringify({stageTrace:[{cardId:'data',comment:'Check "labels" {again} — café',planEvidence:[{cardId:'data',quote:'labels'}]}],steps:[]});
  for(let i=1;i<=raw.length;i++) {
    const entries=stageProgress(raw.slice(0,i));
    if(entries.length)assert.ok('Check "labels" {again} — café'.startsWith(entries[0].comment));
  }
  assert.equal(stageProgress(raw)[0].comment,'Check "labels" {again} — café');
});
test('invalid streamed results emit an error and never a verified completion',async()=>{
  const b=body();b.scenario.stageScope='all';b.stream=true;
  const oldFetch=global.fetch,key=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='fixture';
  const events=[];const res=response();res.write=line=>{res.headersSent=true;events.push(JSON.parse(line));};res.end=()=>{res.writableEnded=true;};
  global.fetch=async()=>({ok:true,body:(async function*(){yield Buffer.from('data: '+JSON.stringify({choices:[{delta:{content:'{"stageTrace":[{"cardId":"data","comment":"Draft"}]}'}}]})+'\n\n');})()});
  try {await handler({method:'POST',headers:{'x-openai-api-key':'sk-user-fixture'},body:b},res);assert.equal(events.at(-1).type,'error');assert.ok(!events.some(e=>e.type==='complete'));}
  finally{global.fetch=oldFetch;if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;}
});
test('persona narrative has explicit first-person grounding and no separate trace comment',async()=>{
 const b=body();b.scenario.stageScope='all';const r=result();r.stageTrace=[traceEntry(plan[0])];delete r.stageTrace[0].comment;
 r.stageTrace[0].stakeholderExperience="I want my recent work to count. I don't know how my career gap is weighed.";
 const res=await call(b,r,payload=>{
  const prompt=payload.messages[0].content;
  assert.match(prompt,/FROM the supplied persona, in first person/);
  assert.match(prompt,/No invented biography/);
  assert.match(prompt,/cardId then stakeholderExperience FIRST/);
  assert.match(prompt,/Do not output a separate comment/);
  const schema=prompt.slice(prompt.indexOf('Return this exact shape:'),prompt.indexOf('Examine EVERY'));
  assert.ok(!schema.includes('"comment":'));
 });assert.equal(res.statusCode,200);
});
test('streams stakeholder experience even when no legacy comment field exists',async()=>{
 const {stageProgress}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
 const partial='{"stageTrace":[{"cardId":"data","stakeholderExperience":"I want my experience';
 assert.equal(stageProgress(partial)[0].stakeholderExperience,'I want my experience');
 assert.equal(stageProgress(partial)[0].comment,'');
});
const branch = (id,afterStep=1) => ({id,title:id,choice:'I could ask for review',afterStep,steps:[{observation:'I have a result',action:'I ask for review',response:'I do not know if review is available',assumption:'Review is not specified'}],outcome:'I may need to apply elsewhere',visits:[{cardId:'data',stakeholderExperience:'I want my experience to count'}],assumptions:[],unknowns:['Review availability']});
test('branching retains one shared fork and validates every branch reference',async()=>{
 const b=body();b.branching=true;b.links=[];const r=result();r.branches=[branch('review'),branch('leave')];
 assert.equal((await call(b,r,p=>{assert.match(p.messages[0].content,/SAME numbered shared step/);assert.deepEqual(JSON.parse(p.messages[1].content).planConnections,[]);})).statusCode,200);
 for(const mutate of [r=>delete r.branches,r=>r.branches[0].visits[0].cardId='invented',r=>r.branches[1].id='review',r=>r.branches[0].afterStep=2,r=>r.branches[0].steps=[],r=>r.branches[0].visits.push(r.branches[0].visits[0])]){
  const bad=structuredClone(r);mutate(bad);assert.equal((await call(b,bad)).statusCode,502);
 }
 assert.equal((await call({...b,links:[{start:'data',end:'missing'}]},r)).statusCode,400);
});
test('connection traversal supports forks, disconnected blocks and cycles without repeating blocks',async()=>{
 const {orderedPlan}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
 const cards=[{uid:'a',stage:'problem'},{uid:'b',stage:'data'},{uid:'c',stage:'model'},{uid:'d',stage:'task'}];
 assert.deepEqual(orderedPlan(cards,[{start:'a',end:'c'},{start:'a',end:'b'},{start:'c',end:'a'}]).map(c=>c.uid),['d','a','b','c']);
});
test('allows the selected legacy model with compatible parameters and rejects arbitrary models', async () => {
  const input = { ...body(), model: 'gpt-4', branching: true };
  await call(input, result(), payload => {
    assert.equal(payload.model, 'gpt-4');
    assert.equal(payload.reasoning_effort, undefined);
    assert.equal(payload.max_completion_tokens, undefined);
    assert.equal(payload.max_tokens, 4500);
  });
  const res = await call({ ...body(), model: 'unknown-model' }, result(), () => assert.fail('must reject before upstream'));
  assert.equal(res.statusCode, 400);
});

test('workbench accepts a personal key without a server key and excludes it from model input', async () => {
  const oldKey = process.env.OPENAI_API_KEY; const oldFetch = global.fetch;
  delete process.env.OPENAI_API_KEY;
  global.fetch = async (_, options) => {
    assert.equal(options.headers.Authorization, 'Bearer sk-personal-fixture');
    assert.ok(!options.body.includes('sk-personal-fixture'));
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(result()) } }] }) };
  };
  try {
    const res = response();
    await handler({ method: 'POST', headers: { 'x-openai-api-key': 'sk-personal-fixture' }, body: body() }, res);
    assert.equal(res.statusCode, 200);
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
  }
});

test('workbench refuses to use a configured server key without a user key', async () => {
  const oldKey = process.env.OPENAI_API_KEY; const oldFetch = global.fetch;
  process.env.OPENAI_API_KEY = 'sk-owner-fixture';
  global.fetch = async () => assert.fail('Must not contact OpenAI');
  try {
    const res = response(); await handler({ method: 'POST', body: body() }, res);
    assert.equal(res.statusCode, 401);
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
  }
});
