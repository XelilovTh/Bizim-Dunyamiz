/**
 * Vercel Serverless Function: /api/proxy
 * Handles GitHub database operations, Cloudinary deletion, Telegram notifications, and IP blocking securely.
 */

import crypto from 'crypto';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'active', service: 'Dunyamiz API Proxy' });
  }

  const { action, ...data } = req.body || {};
  const GITHUB_OWNER = process.env.GH_OWNER || 'XelilovTh';
  const GITHUB_REPO = process.env.GH_REPO || 'Dunyam';
  const token = process.env.GH_TOKEN;
  const adminChatId = process.env.ADMIN_CHAT_ID || '6353022269';
  const notifBotToken = process.env.NOTIF_BOT_TOKEN || process.env.TG_TOKEN;
  const sitePassword = process.env.SITE_PASSWORD || '0102';

  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Dunyamiz-App',
    'Content-Type': 'application/json',
  };

  // Kliyentin real IP adresini əldə et
  const forwarded = req.headers['x-forwarded-for'];
  const requesterIp = (forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || '127.0.0.1';

  try {
    switch (action) {
      // 1. IP Bloklanma statusunu yoxla
      case 'check_block': {
        const ipToCheck = data.ip || requesterIp;
        const blockedList = await getBlockedIps(GITHUB_OWNER, GITHUB_REPO, ghHeaders);
        const isBlocked = blockedList.includes(ipToCheck);
        return res.status(200).json({ blocked: isBlocked, ip: ipToCheck });
      }

      // 2. Şifrəni yoxla
      case 'check_password': {
        const isValid = String(data.password).trim() === String(sitePassword).trim();
        return res.status(200).json({ success: isValid });
      }

      // 3. Telegram-a Ətraflı Bildiriş Göndər (NOTIF_BOT_TOKEN)
      case 'telegram_send': {
        const ipToUse = (data.ip && data.ip !== 'Naməlum IP') ? data.ip : requesterIp;
        const blockedList = await getBlockedIps(GITHUB_OWNER, GITHUB_REPO, ghHeaders);
        const isBlocked = blockedList.includes(ipToUse);

        const text = (data.text || '').replace(/Naməlum IP/g, ipToUse);

        const payload = {
          chat_id: adminChatId,
          text: text,
          parse_mode: 'HTML',
        };

        // Əgər IP varsa, altına bloklama/blokdan çıxarma inline düyməsi əlavə et
        if (ipToUse && ipToUse !== '127.0.0.1') {
          const button = isBlocked
            ? { text: '✅ Blokdan çıxar', callback_data: `unblock_${ipToUse}` }
            : { text: '🚫 IP Blokla', callback_data: `block_${ipToUse}` };

          payload.reply_markup = {
            inline_keyboard: [[button]],
          };
        }

        const tgRes = await fetch(`https://api.telegram.org/bot${notifBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const tgResult = await tgRes.json();
        return res.status(200).json(tgResult);
      }

      // 4. IP-ni Blokla / Blokdan Çıxar
      case 'block_ip': {
        const ip = data.ip;
        if (!ip) return res.status(400).json({ error: 'IP tələb olunur' });
        const success = await updateBlockedIp(GITHUB_OWNER, GITHUB_REPO, ghHeaders, ip, true);
        return res.status(200).json({ success });
      }

      case 'unblock_ip': {
        const ip = data.ip;
        if (!ip) return res.status(400).json({ error: 'IP tələb olunur' });
        const success = await updateBlockedIp(GITHUB_OWNER, GITHUB_REPO, ghHeaders, ip, false);
        return res.status(200).json({ success });
      }

      // 5. GitHub GET
      case 'github_get': {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${data.path}`;
        const response = await fetch(url, { headers: ghHeaders });
        const result = await response.json();
        return res.status(response.status).json(result);
      }

      // 6. GitHub LIST
      case 'github_list': {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${data.path}`;
        const response = await fetch(url, { headers: ghHeaders });
        const result = await response.json();
        return res.status(response.status).json(result);
      }

      // 7. GitHub UPLOAD (PUT)
      case 'github_upload': {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${data.path}`;
        const bodyPayload = {
          message: data.message || `Yeniləndi: ${data.path}`,
          content: data.content,
        };
        if (data.sha) bodyPayload.sha = data.sha;

        const response = await fetch(url, {
          method: 'PUT',
          headers: ghHeaders,
          body: JSON.stringify(bodyPayload),
        });

        const result = await response.json();
        return res.status(response.status).json(result);
      }

      // 8. GitHub DELETE
      case 'github_delete': {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${data.path}`;
        const response = await fetch(url, {
          method: 'DELETE',
          headers: ghHeaders,
          body: JSON.stringify({
            message: data.message || `Silindi: ${data.path}`,
            sha: data.sha,
          }),
        });

        const result = await response.json();
        return res.status(response.status).json(result);
      }

      // 9. Cloudinary DELETE
      case 'cloudinary_delete': {
        const isMusic = data.resource_type === 'video' || data.cloud_name === process.env.CL_MUSIC_NAME;
        const cloudName = isMusic ? (process.env.CL_MUSIC_NAME || 'drlzwhblg') : (process.env.CL_NAME || 'dojz9uzhe');
        const apiKey = isMusic ? (process.env.CL_MUSIC_KEY || '583362931417988') : (process.env.CL_KEY || '241982348988817');
        const apiSecret = isMusic ? (process.env.CL_MUSIC_SECRET || '') : (process.env.CL_SECRET || '');

        const timestamp = Math.floor(Date.now() / 1000);
        const signatureStr = `public_id=${data.public_id}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

        const params = new URLSearchParams();
        params.append('public_id', data.public_id);
        params.append('api_key', apiKey);
        params.append('timestamp', String(timestamp));
        params.append('signature', signature);

        const resourceType = data.resource_type || 'image';
        const destroyUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`;

        const response = await fetch(destroyUrl, {
          method: 'POST',
          body: params,
        });

        const result = await response.json();
        return res.status(response.status).json(result);
      }

      default:
        return res.status(400).json({ error: 'Naməlum əməliyyat' });
    }
  } catch (error) {
    console.error('Proxy Xətası:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Köməkçi: Bloklanmış IP siyahısını GitHub-dan oxu
async function getBlockedIps(owner, repo, headers) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/blocked_ips.json`;
    const r = await fetch(url, { headers });
    if (!r.ok) return [];
    const data = await r.json();
    const jsonStr = Buffer.from(data.content, 'base64').toString('utf8');
    const parsed = JSON.parse(jsonStr || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Köməkçi: Bloklanmış IP siyahısını GitHub-da yenilə
async function updateBlockedIp(owner, repo, headers, ip, shouldBlock) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/blocked_ips.json`;
    let current = [];
    let sha = null;

    try {
      const r = await fetch(url, { headers });
      if (r.ok) {
        const data = await r.json();
        sha = data.sha;
        current = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8') || '[]');
        if (!Array.isArray(current)) current = [];
      }
    } catch (e) {}

    if (shouldBlock) {
      if (!current.includes(ip)) current.push(ip);
    } else {
      current = current.filter((item) => item !== ip);
    }

    const putRes = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: shouldBlock ? `🚫 Admin: ${ip} bloklandı` : `✅ Admin: ${ip} blokdan çıxarıldı`,
        content: Buffer.from(JSON.stringify(current, null, 2)).toString('base64'),
        sha: sha || undefined,
      }),
    });

    return putRes.ok;
  } catch (e) {
    console.error('Update blocked IP xətası:', e);
    return false;
  }
}
