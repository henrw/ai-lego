import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const express = require('express');
const setup = require('../src/setupProxy.js');
test('npm start middleware exposes all AI routes as JSON instead of returning frontend HTML', async () => {
 const app=express(); setup(app);
 const server=app.listen(0);
 await new Promise(resolve=>server.once('listening',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try {
  for(const endpoint of ['generate','evaluate','workbench']) {
   const response=await fetch(`${base}/api/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
   assert.equal(response.status,400);assert.match(response.headers.get('content-type'),/application\/json/);assert.ok((await response.json()).error);
   const get=await fetch(`${base}/api/${endpoint}`);assert.equal(get.status,405);
  }
  const unknown=await fetch(`${base}/api/unknown`);assert.equal(unknown.status,404);assert.ok((await unknown.json()).error);
 } finally {await new Promise(resolve=>server.close(resolve));}
});
