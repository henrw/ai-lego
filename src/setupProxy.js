// CRA's development server must also serve our server-side Vercel API handlers.
// API credentials remain in this Node process and never enter the browser bundle.
const express = require('express');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

module.exports = function setupLocalApi(app) {
  app.use('/api', express.json({ limit: '500kb' }), async (req, res) => {
    const endpoint = req.path.replace(/^\//, '');
    if (!['generate', 'evaluate', 'workbench'].includes(endpoint)) return res.status(404).json({ error: 'Unknown AI endpoint.' });
    try {
      const source = await readFile(path.join(__dirname, '..', 'api', `${endpoint}.js`), 'utf8');
      const handler = (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).default;
      await handler(req, res);
    } catch {
      if (!res.headersSent) res.status(500).json({ error: 'The local AI endpoint could not start. Check the development-server logs.' });
      else if (!res.writableEnded) res.end();
    }
  });
};
