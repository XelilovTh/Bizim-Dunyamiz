/**
 * Vercel Serverless Function: /api/bot
 * Handles Media Upload Bot (TG_TOKEN) updates from Telegram:
 * - Photos -> Cloudinary & photos_list.json
 * - Music -> Cloudinary & music_list.json
 * - Text -> letters/*.txt on GitHub
 * - Callback queries -> block/unblock IP
 * - Commands -> /stats, /help
 */

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Dunyamiz Media Bot is running stable...');
  }

  const body = req.body || {};
  const TG_TOKEN = process.env.TG_TOKEN;
  const NOTIF_BOT_TOKEN = process.env.NOTIF_BOT_TOKEN || TG_TOKEN;
  const GITHUB_OWNER = process.env.GH_OWNER || 'XelilovTh';
  const GITHUB_REPO = process.env.GH_REPO || 'Dunyam';
  const GH_TOKEN = process.env.GH_TOKEN;

  const CL_NAME = process.env.CL_NAME || 'dojz9uzhe';
  const CL_PRESET = process.env.VITE_CL_PRESET || process.env.CL_PRESET || 'dunyamiz';
  const CL_KEY = process.env.CL_KEY || '241982348988817';
  const CL_SECRET = process.env.CL_SECRET || '';

  const CL_MUSIC_NAME = process.env.CL_MUSIC_NAME || 'drlzwhblg';
  const CL_MUSIC_PRESET = process.env.VITE_CL_MUSIC_PRESET || process.env.CL_MUSIC_PRESET || 'dunyamiz_music';
  const CL_MUSIC_KEY = process.env.CL_MUSIC_KEY || '583362931417988';
  const CL_MUSIC_SECRET = process.env.CL_MUSIC_SECRET || '';

  const ghHeaders = {
    Authorization: `Bearer ${GH_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Dunyamiz-Media-Bot',
    'Content-Type': 'application/json',
  };

  try {
    // 1. CALLBACK QUERY (IP Bloklama / Blokdan Çıxarma Düymələri)
    if (body.callback_query) {
      const cq = body.callback_query;
      const data = cq.data || '';
      const chatId = cq.message?.chat?.id;
      const messageId = cq.message?.message_id;
      const originalText = cq.message?.text || '';

      if (data.startsWith('block_')) {
        const ipToBlock = data.replace('block_', '');
        const success = await updateBlockedIp(GITHUB_OWNER, GITHUB_REPO, ghHeaders, ipToBlock, true);

        await answerCallbackQuery(NOTIF_BOT_TOKEN, cq.id, success ? 'IP bloklandı!' : 'Xəta baş verdi');
        if (success && chatId && messageId) {
          const newText = originalText.replace(/✅ BU IP BLOKDAN ÇIXARILDI/g, '') + '\n\n🚫 <b>BU IP BLOKLANDI</b>';
          await editMessageText(NOTIF_BOT_TOKEN, chatId, messageId, newText, {
            inline_keyboard: [[{ text: '✅ Blokdan çıxar', callback_data: `unblock_${ipToBlock}` }]],
          });
        }
      } else if (data.startsWith('unblock_')) {
        const ipToUnblock = data.replace('unblock_', '');
        const success = await updateBlockedIp(GITHUB_OWNER, GITHUB_REPO, ghHeaders, ipToUnblock, false);

        await answerCallbackQuery(NOTIF_BOT_TOKEN, cq.id, success ? 'IP blokdan çıxarıldı!' : 'Xəta baş verdi');
        if (success && chatId && messageId) {
          const newText = originalText.replace(/🚫 BU IP BLOKLANDI/g, '') + '\n\n✅ <b>BU IP BLOKDAN ÇIXARILDI</b>';
          await editMessageText(NOTIF_BOT_TOKEN, chatId, messageId, newText, {
            inline_keyboard: [[{ text: '🚫 IP Blokla', callback_data: `block_${ipToUnblock}` }]],
          });
        }
      } else if (data === 'author_Tahmaz' || data === 'author_Fidan') {
        const author = data === 'author_Tahmaz' ? 'Təhmaz' : 'Fidan';
        
        // Mətni əldə et (reply_to_message və ya blockquote daxilindən)
        let letterText = cq.message?.reply_to_message?.text || '';
        if (!letterText && originalText.includes('<blockquote>')) {
          const match = originalText.match(/<blockquote>([\s\S]*?)<\/blockquote>/);
          if (match) letterText = match[1];
        }

        if (!letterText) {
          await answerCallbackQuery(TG_TOKEN, cq.id, '❌ Mətn tapılmadı.');
          return res.status(200).send('OK');
        }

        const lines = letterText.trim().split('\n');
        let title = lines[0].trim();
        let content = lines.slice(1).join('\n').trim();

        if (!content) {
          const words = letterText.trim().split(/\s+/);
          title = words.slice(0, 3).join(' ');
          content = letterText.trim();
        }

        if (title.length > 40) {
          title = title.substring(0, 40) + '...';
        }

        const cleanTitle = title
          .replace(/[^a-zA-Z0-9əƏıIöÖşŞüÜçÇğĞ\s_-]/g, '')
          .replace(/\s+/g, '_') || 'Məktub';

        const fileName = `letters/${cleanTitle}_${Date.now()}.txt`;
        const fullContent = `[Müəllif: ${author}]\n\n${content}`;

        const ghRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fileName}`, {
          method: 'PUT',
          headers: ghHeaders,
          body: JSON.stringify({
            message: `✉️ Media Bot: ${title} (${author})`,
            content: Buffer.from(fullContent, 'utf8').toString('base64'),
          }),
        });

        await answerCallbackQuery(TG_TOKEN, cq.id, `Müəllif: ${author} seçildi!`);
        
        const resultText = ghRes.ok
          ? `✅ <b>Məktub uğurla əlavə edildi!</b> ✉️\n\n📌 <b>Başlıq:</b> ${escapeHtml(title)}\n✍️ <b>Müəllif:</b> ${author}\n🌐 <a href="https://dunyamiz-tf.vercel.app">Saytda oxumaq üçün klikləyin</a>`
          : `❌ GitHub-a göndərilərkən xəta baş verdi.`;

        // 1. Mövcud sual mesajını redaktə edib düymələri təmizləyirik
        if (chatId && messageId) {
          await editMessageText(TG_TOKEN, chatId, messageId, `✉️ <i>Məktub qeyd edildi: "${escapeHtml(title)}" (${author})</i>`);
        }
        // 2. İstifadəçiyə yeni təsdiq mesajı göndəririk (səs və bildiriş üçün)
        if (chatId) {
          await sendTelegramMessage(TG_TOKEN, chatId, resultText);
        }
      }

      return res.status(200).send('OK');
    }

    // 2. ADİ MESAJLAR
    const message = body.message;
    if (!message) return res.status(200).send('No message');

    const chatId = message.chat.id;
    const text = (message.text || '').trim();

    // 2.1 ŞƏKİL GÖNDƏRİLDİKDƏ
    if (message.photo && message.photo.length > 0) {
      const photo = message.photo[message.photo.length - 1]; // Ən yüksək keyfiyyətli ölçü
      const fileUrl = await getTelegramFileUrl(TG_TOKEN, photo.file_id);

      if (!fileUrl) {
        await sendTelegramMessage(TG_TOKEN, chatId, '❌ Şəkil linkini əldə etmək mümkün olmadı.');
        return res.status(200).send('OK');
      }

      // Cloudinary-yə yüklə (Remote URL vasitəsilə)
      const uploadRes = await uploadUrlToCloudinary(fileUrl, {
        cloudName: CL_NAME,
        preset: CL_PRESET || 'dunyamiz',
        apiKey: CL_KEY,
        apiSecret: CL_SECRET,
        folder: 'dunyamiz',
        resourceType: 'image',
      });

      if (!uploadRes.secure_url) {
        const errMsg = uploadRes.error?.message || 'Bilinməyən xəta';
        await sendTelegramMessage(TG_TOKEN, chatId, `❌ <b>Şəkil yüklənərkən xəta:</b>\n<code>${escapeHtml(errMsg)}</code>`);
        return res.status(200).send('OK');
      }

      // GitHub photos_list.json yenilə
      const newPhoto = {
        id: `photo-${Date.now()}`,
        name: `photo_${Date.now()}.jpg`,
        public_id: uploadRes.public_id,
        download_url: uploadRes.secure_url,
        url: uploadRes.secure_url,
        isFavorite: false,
        created_at: new Date().toISOString(),
      };

      const ghSuccess = await appendToGitHubJson(GITHUB_OWNER, GITHUB_REPO, ghHeaders, 'photos_list.json', newPhoto, '📸 Media Bot: Yeni şəkil əlavə edildi');

      await sendTelegramMessage(
        TG_TOKEN,
        chatId,
        ghSuccess
          ? '✅ <b>Şəkil uğurla yükləndi və saytın qalereyasına əlavə edildi!</b> 📸\n🌐 <a href="https://dunyamiz-tf.vercel.app">Saytda baxmaq üçün klikləyin</a>'
          : '⚠️ Şəkil Cloudinary-yə yükləndi, lakin GitHub siyahısı yenilənə bilmədi.'
      );
      return res.status(200).send('OK');
    }

    // 2.2 MUSİQİ (Audio və ya Document formatında)
    const isAudioDoc = message.document && /\.(mp3|wav|ogg|m4a|flac)$/i.test(message.document.file_name || '');
    if (message.audio || isAudioDoc) {
      const audio = message.audio || message.document;
      const fileName = audio.file_name || `music_${Date.now()}.mp3`;
      const fileUrl = await getTelegramFileUrl(TG_TOKEN, audio.file_id);

      if (!fileUrl) {
        await sendTelegramMessage(TG_TOKEN, chatId, '❌ Musiqi linkini əldə etmək mümkün olmadı (fayl ölçüsü 20MB-dan çox ola bilər).');
        return res.status(200).send('OK');
      }

      // Cloudinary Musiqi hesabına yüklə
      const uploadRes = await uploadUrlToCloudinary(fileUrl, {
        cloudName: CL_MUSIC_NAME,
        preset: CL_MUSIC_PRESET || 'dunyamiz_music',
        apiKey: CL_MUSIC_KEY,
        apiSecret: CL_MUSIC_SECRET,
        folder: 'dunyamiz_music',
        resourceType: 'video',
      });

      if (!uploadRes.secure_url) {
        const errMsg = uploadRes.error?.message || 'Bilinməyən xəta';
        await sendTelegramMessage(TG_TOKEN, chatId, `❌ <b>Musiqi yüklənərkən xəta:</b>\n<code>${escapeHtml(errMsg)}</code>`);
        return res.status(200).send('OK');
      }

      // Başlıq və ifaçını ayır
      const cleanName = fileName.replace(/\.[^/.]+$/, '');
      let title = cleanName;
      let artist = 'Bilinməyən İfaçı';

      if (cleanName.includes('-')) {
        const parts = cleanName.split('-');
        artist = parts[0].trim();
        title = parts.slice(1).join('-').trim();
      }

      const newSong = {
        id: `music-${Date.now()}`,
        name: fileName,
        title: title || cleanName,
        artist: artist,
        public_id: uploadRes.public_id,
        download_url: uploadRes.secure_url,
        url: uploadRes.secure_url,
        duration: formatSeconds(uploadRes.duration || audio.duration || 180),
        isFavorite: false,
        created_at: new Date().toISOString(),
      };

      const ghSuccess = await appendToGitHubJson(GITHUB_OWNER, GITHUB_REPO, ghHeaders, 'music_list.json', newSong, `🎵 Media Bot: ${fileName} əlavə edildi`);

      await sendTelegramMessage(
        TG_TOKEN,
        chatId,
        ghSuccess
          ? `✅ <b>Musiqi uğurla yükləndi və pleylistə əlavə edildi!</b> 🎵\n📌 <b>Mahnı:</b> ${escapeHtml(newSong.title)}\n🎤 <b>İfaçı:</b> ${escapeHtml(newSong.artist)}\n🌐 <a href="https://dunyamiz-tf.vercel.app">Pleyerdə dinləmək üçün klikləyin</a>`
          : '⚠️ Musiqi Cloudinary-yə yükləndi, lakin GitHub pleylisti yenilənə bilmədi.'
      );
      return res.status(200).send('OK');
    }

    // 2.3 KOMANDALAR
    if (text.startsWith('/')) {
      if (text.startsWith('/stats')) {
        const [photos, music, letters] = await Promise.all([
          getGitHubJson(GITHUB_OWNER, GITHUB_REPO, ghHeaders, 'photos_list.json'),
          getGitHubJson(GITHUB_OWNER, GITHUB_REPO, ghHeaders, 'music_list.json'),
          getGitHubFolderFiles(GITHUB_OWNER, GITHUB_REPO, ghHeaders, 'letters'),
        ]);

        const statsText =
          `📊 <b>Dünyamız — Mövcud Statistika</b>\n\n` +
          `📸 <b>Şəkillər:</b> ${photos.length} ədəd\n` +
          `🎵 <b>Musiqilər:</b> ${music.length} ədəd\n` +
          `✉️ <b>Məktublar:</b> ${letters.length} ədəd\n\n` +
          `🌐 <b>Sayt:</b> dunyamiz.site`;

        await sendTelegramMessage(TG_TOKEN, chatId, statsText);
      } else {
        const helpText =
          `🌟 <b>Bizim Dünyamız — Media Botu</b>\n\n` +
          `📸 <b>Şəkil göndər</b> ➔ Avtomatik qalereyaya əlavə olunur\n` +
          `🎵 <b>Musiqi faylı göndər</b> ➔ Avtomatik pleylistə əlavə olunur\n` +
          `✉️ <b>Mətn yaz</b> ➔ Avtomatik məktub kimi qeyd olunur\n` +
          `📊 <b>/stats</b> ➔ Mövcud statistikanı göstərir`;

        await sendTelegramMessage(TG_TOKEN, chatId, helpText);
      }
      return res.status(200).send('OK');
    }

    // 2.4 ADİ MƏTN (MƏKTUB)
    if (text) {
      let author = null;
      let cleanText = text;

      // Əgər mətndə müəllif göstərilibsə
      if (/^\[?fidan\]?[:\s-]/i.test(text)) {
        author = 'Fidan';
        cleanText = text.replace(/^\[?fidan\]?[:\s-]*/i, '').trim();
      } else if (/^\[?təhmaz\]?[:\s-]/i.test(text) || /^\[?tehmaz\]?[:\s-]/i.test(text)) {
        author = 'Təhmaz';
        cleanText = text.replace(/^\[?(təhmaz|tehmaz)\]?[:\s-]*/i, '').trim();
      }

      const lines = cleanText.split('\n');
      let title = lines[0].trim();
      let content = lines.slice(1).join('\n').trim();

      if (!content) {
        const words = cleanText.split(/\s+/);
        title = words.slice(0, 3).join(' ');
        content = cleanText;
      }

      if (title.length > 40) {
        title = title.substring(0, 40) + '...';
      }

      // Əgər müəllif bəlli deyilsə, istifadəçiyə zərif düymələrlə seçim təklif et!
      if (!author) {
        const previewText = cleanText.length > 150 ? cleanText.substring(0, 150) + '...' : cleanText;
        const promptMsg =
          `✉️ <b>Məktub mətni qəbul edildi:</b>\n\n` +
          `📌 <b>Başlıq:</b> ${title}\n` +
          `<blockquote>${escapeHtml(previewText)}</blockquote>\n\n` +
          `Zəhmət olmasa bu məktubun <b>müəllifini seçin</b>:`;

        await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            reply_to_message_id: message.message_id,
            text: promptMsg,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '💙 Təhmaz', callback_data: 'author_Tahmaz' },
                  { text: '💖 Fidan', callback_data: 'author_Fidan' },
                ],
              ],
            },
          }),
        });

        return res.status(200).send('OK');
      }

      // Müəllif artıq məlumdursa birbaşa yaz
      const cleanTitle = title
        .replace(/[^a-zA-Z0-9əƏıIöÖşŞüÜçÇğĞ\s_-]/g, '')
        .replace(/\s+/g, '_') || 'Məktub';

      const fileName = `letters/${cleanTitle}_${Date.now()}.txt`;
      const fullContent = `[Müəllif: ${author}]\n\n${content}`;

      const ghRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fileName}`, {
        method: 'PUT',
        headers: ghHeaders,
        body: JSON.stringify({
          message: `✉️ Media Bot: ${title} (${author})`,
          content: Buffer.from(fullContent, 'utf8').toString('base64'),
        }),
      });

      await sendTelegramMessage(
        TG_TOKEN,
        chatId,
        ghRes.ok
          ? `✅ <b>Məktub uğurla əlavə edildi!</b> ✉️\n\n📌 <b>Başlıq:</b> ${escapeHtml(title)}\n✍️ <b>Müəllif:</b> ${author}\n🌐 <a href="https://dunyamiz-tf.vercel.app">Saytda oxumaq üçün klikləyin</a>`
          : '❌ Məktub GitHub-a göndərilərkən xəta baş verdi.'
      );
      return res.status(200).send('OK');
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Bot Handler Error:', error);
    return res.status(200).send('Error Handled');
  }
}

/* ==========================================================================
   KÖMƏKÇİ FUNKSİYALAR (TELEGRAM & CLOUDINARY & GITHUB)
   ========================================================================== */

async function getTelegramFileUrl(token, fileId) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (data.ok && data.result?.file_path) {
      return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function uploadUrlToCloudinary(fileUrl, { cloudName, preset, apiKey, apiSecret, folder, resourceType = 'image' }) {
  try {
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    // 1. Əgər unsigned preset varsa, birbaşa istifadə et (Ən etibarlı yol)
    if (preset) {
      const formData = new URLSearchParams();
      formData.append('file', fileUrl);
      formData.append('upload_preset', preset);
      if (folder) formData.append('folder', folder);

      const res = await fetch(uploadUrl, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.secure_url) return data;
    }

    // 2. Əgər preset yoxdursa və ya xəta veribsə, signed upload yoxla
    if (apiKey && apiSecret) {
      const timestamp = Math.floor(Date.now() / 1000);
      const signatureStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

      const formData = new URLSearchParams();
      formData.append('file', fileUrl);
      formData.append('folder', folder);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);

      const res = await fetch(uploadUrl, { method: 'POST', body: formData });
      return await res.json();
    }

    return {};
  } catch (e) {
    console.error('Cloudinary Upload URL Error:', e);
    return { error: { message: e.message } };
  }
}

async function sendTelegramMessage(token, chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });
  } catch (e) {}
}

async function answerCallbackQuery(token, callbackQueryId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch (e) {}
}

async function editMessageText(token, chatId, messageId, text, replyMarkup) {
  try {
    const payload = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'HTML',
    };
    if (replyMarkup && typeof replyMarkup === 'object') {
      payload.reply_markup = replyMarkup;
    }
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {}
}

async function getGitHubJson(owner, repo, headers, path) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8') || '[]');
  } catch (e) {
    return [];
  }
}

async function getGitHubFolderFiles(owner, repo, headers, path) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers });
    if (!res.ok) return [];
    const list = await res.json();
    return Array.isArray(list) ? list.filter((f) => f.type === 'file' && !f.name.startsWith('.')) : [];
  } catch (e) {
    return [];
  }
}

async function appendToGitHubJson(owner, repo, headers, path, newItem, commitMessage) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    let list = [];
    let sha = null;

    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        sha = data.sha;
        list = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8') || '[]');
        if (!Array.isArray(list)) list = [];
      }
    } catch (e) {}

    list.unshift(newItem); // Ən yenisi əvvələ

    const putRes = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(JSON.stringify(list, null, 2), 'utf8').toString('base64'),
        sha: sha || undefined,
      }),
    });

    return putRes.ok;
  } catch (e) {
    console.error('Append to GitHub JSON Error:', e);
    return false;
  }
}

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
    return false;
  }
}

function formatSeconds(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

