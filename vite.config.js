import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import proxyHandler from './api/proxy.js';
import botHandler from './api/bot.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Populate process.env for serverless handlers during dev
  Object.assign(process.env, env);

  function adapt(handler) {
    return async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
      }

      let body = '';
      req.on('data', (c) => {
        body += c;
      });
      req.on('end', async () => {
        try {
          req.body = body ? JSON.parse(body) : {};
        } catch (e) {
          req.body = {};
        }
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return res;
        };
        res.send = (data) => {
          res.end(data);
          return res;
        };

        try {
          await handler(req, res);
        } catch (err) {
          console.error('Dev Server Handler Error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    };
  }

  return {
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
    plugins: [
      react(),
      {
        name: 'api-proxy-dev-server',
        configureServer(server) {
          server.middlewares.use('/api/proxy', adapt(proxyHandler));
          server.middlewares.use('/api/bot', adapt(botHandler));
        },
      },
    ],
  };
});
