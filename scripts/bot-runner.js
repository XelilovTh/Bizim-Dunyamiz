import { loadEnv } from 'vite';
import handler from '../api/bot.js';

const env = loadEnv('', process.cwd(), '');
Object.assign(process.env, env);

const TG_TOKEN = process.env.TG_TOKEN || '6800223810:AAFxY2GC2A6PHl3oquOTDUWQMv-HMBXjdoA';

console.log('🤖 Media Bot Polling Runner başladıldı (@Thmzxllbot)...');

let offset = 0;

async function pollUpdates() {
  while (true) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${offset}&timeout=15`);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          console.log(`📩 Yeni update alındı (#${update.update_id}):`, update.message?.text || update.callback_query?.data || (update.message?.photo ? 'Foto' : 'Fayl'));

          // Mock req and res for api/bot handler
          const mockReq = {
            method: 'POST',
            body: update,
          };

          const mockRes = {
            status: () => mockRes,
            send: (msg) => console.log('Bot cavab verdi:', msg),
            json: (obj) => console.log('Bot JSON cavab verdi:', obj),
          };

          try {
            await handler(mockReq, mockRes);
          } catch (err) {
            console.error('Handler xətası:', err);
          }
        }
      }
    } catch (e) {
      console.error('Polling xətası:', e.message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

pollUpdates();

