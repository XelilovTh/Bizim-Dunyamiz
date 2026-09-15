/**
 * GitHub Verilənlər Bazası Xidməti
 * Bütün oxuma, yazma və silmə əməliyyatlarını /api/proxy vasitəsilə təhlükəsiz icra edir
 */

// UTF-8 təhlükəsiz Base64 kodlaşdırma və dekodlaşdırma
function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(str) {
  try {
    return decodeURIComponent(escape(atob(str.replace(/\n/g, ''))));
  } catch (e) {
    return atob(str.replace(/\n/g, ''));
  }
}

async function requestProxy(action, data = {}) {
  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...data }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || `Proxy xətası (${response.status})`);
  }

  return await response.json();
}

/* ==========================================================================
   1. ŞƏKİLLƏR (photos_list.json)
   ========================================================================== */
export async function fetchPhotosFromGitHub() {
  try {
    const data = await requestProxy('github_get', { path: 'photos_list.json' });
    if (!data || !data.content) {
      return { photos: [], sha: data?.sha || null };
    }

    const jsonStr = base64ToUtf8(data.content);
    const rawList = JSON.parse(jsonStr || '[]');

    const formatted = rawList.map((item, index) => ({
      id: item.id || item.public_id || `photo-${index}-${Date.now()}`,
      name: item.name || `Xatirə ${index + 1}`,
      url: item.download_url || item.url,
      public_id: item.public_id || '',
      isFavorite: Boolean(item.isFavorite),
      created_at: item.created_at || new Date().toISOString(),
    }));

    return { photos: formatted, sha: data.sha };
  } catch (err) {
    console.warn('[GitHubService] photos_list.json oxunarkən xəta:', err);
    return { photos: [], sha: null };
  }
}

export async function savePhotosToGitHub(photosList, currentSha = null) {
  try {
    let sha = currentSha;
    if (!sha) {
      // Mövcud faylın sha kodunu əldə et
      const existing = await requestProxy('github_get', { path: 'photos_list.json' }).catch(() => null);
      if (existing?.sha) sha = existing.sha;
    }

    const payload = photosList.map((p) => ({
      name: p.name,
      public_id: p.public_id || '',
      download_url: p.url,
      created_at: p.created_at,
      isFavorite: Boolean(p.isFavorite),
    }));

    const jsonStr = JSON.stringify(payload, null, 2);
    const base64Content = utf8ToBase64(jsonStr);

    const result = await requestProxy('github_upload', {
      path: 'photos_list.json',
      content: base64Content,
      message: '📸 Foto siyahısı yeniləndi',
      sha: sha || undefined,
    });

    return { success: true, sha: result?.content?.sha || null };
  } catch (err) {
    console.error('[GitHubService] photos_list.json yadda saxlanılarkən xəta:', err);
    return { success: false, error: err };
  }
}

/* ==========================================================================
   2. MUSİQİLƏR (music_list.json)
   ========================================================================== */
export async function fetchMusicFromGitHub() {
  try {
    const data = await requestProxy('github_get', { path: 'music_list.json' });
    if (!data || !data.content) {
      return { musicList: [], sha: data?.sha || null };
    }

    const jsonStr = base64ToUtf8(data.content);
    const rawList = JSON.parse(jsonStr || '[]');

    const formatted = rawList.map((item, index) => {
      const cleanName = (item.name || '').replace(/\.[^/.]+$/, '');
      let title = item.title || cleanName;
      let artist = item.artist || 'Bilinməyən İfaçı';

      if (!item.title && cleanName.includes('-')) {
        const parts = cleanName.split('-');
        artist = parts[0].trim();
        title = parts.slice(1).join('-').trim();
      }

      return {
        id: item.id || item.public_id || `music-${index}-${Date.now()}`,
        title: title || 'Adsız Mahnı',
        artist: artist || 'Bilinməyən İfaçı',
        url: item.download_url || item.url,
        public_id: item.public_id || '',
        duration: item.duration || '3:00',
        isFavorite: Boolean(item.isFavorite),
        created_at: item.created_at || new Date().toISOString(),
      };
    });

    return { musicList: formatted, sha: data.sha };
  } catch (err) {
    console.warn('[GitHubService] music_list.json oxunarkən xəta:', err);
    return { musicList: [], sha: null };
  }
}

export async function saveMusicToGitHub(musicList, currentSha = null) {
  try {
    let sha = currentSha;
    if (!sha) {
      const existing = await requestProxy('github_get', { path: 'music_list.json' }).catch(() => null);
      if (existing?.sha) sha = existing.sha;
    }

    const payload = musicList.map((m) => ({
      name: `${m.artist} - ${m.title}`,
      title: m.title,
      artist: m.artist,
      public_id: m.public_id || '',
      download_url: m.url,
      duration: m.duration,
      created_at: m.created_at,
      isFavorite: Boolean(m.isFavorite),
    }));

    const jsonStr = JSON.stringify(payload, null, 2);
    const base64Content = utf8ToBase64(jsonStr);

    const result = await requestProxy('github_upload', {
      path: 'music_list.json',
      content: base64Content,
      message: '🎵 Musiqi siyahısı yeniləndi',
      sha: sha || undefined,
    });

    return { success: true, sha: result?.content?.sha || null };
  } catch (err) {
    console.error('[GitHubService] music_list.json yadda saxlanılarkən xəta:', err);
    return { success: false, error: err };
  }
}

/* ==========================================================================
   3. MƏKTUBLAR (letters/ qovluğu)
   ========================================================================== */
export async function fetchLettersFromGitHub() {
  try {
    const list = await requestProxy('github_list', { path: 'letters' });
    if (!Array.isArray(list)) {
      return [];
    }

    // Gizli və ya boş faylları təmizlə
    const letterFiles = list.filter(
      (f) => f.type === 'file' && !f.name.startsWith('.') && f.name !== 'a'
    );

    const loadedLetters = await Promise.all(
      letterFiles.map(async (file) => {
        try {
          const fileData = await requestProxy('github_get', { path: file.path });
          const rawContent = base64ToUtf8(fileData.content || '');

          // Başlıq və Vaxtı fayl adından çıxar
          const rawTitle = file.name.replace(/\.(txt|md|json)$/i, '').replace(/_/g, ' ');
          const title = rawTitle.replace(/\s*\d{10,}$/, '').trim() || rawTitle;

          let letterDate = new Date().toISOString();
          const timestampMatch = file.name.match(/_(\d{10,})\./);
          if (timestampMatch) {
            letterDate = new Date(parseInt(timestampMatch[1])).toISOString();
          }

          // Müəllifi müəyyən et
          let author = 'Təhmaz';
          let body = rawContent;

          if (rawContent.startsWith('[Müəllif: Fidan]') || rawContent.startsWith('[Fidan]')) {
            author = 'Fidan';
            body = rawContent.replace(/^\[(Müəllif:\s*)?Fidan\]\s*/i, '');
          } else if (rawContent.startsWith('[Müəllif: Təhmaz]') || rawContent.startsWith('[Təhmaz]')) {
            author = 'Təhmaz';
            body = rawContent.replace(/^\[(Müəllif:\s*)?Təhmaz\]\s*/i, '');
          } else if (file.name.toLowerCase().includes('fidan') && !file.name.toLowerCase().includes('salam')) {
            author = 'Fidan';
          }

          return {
            id: file.sha,
            path: file.path,
            sha: file.sha,
            title: title || 'Məktub',
            author: author,
            date: letterDate,
            content: body.trim(),
            isFavorite: false,
          };
        } catch (e) {
          console.warn(`[GitHubService] ${file.name} oxuna bilmədi:`, e);
          return null;
        }
      })
    );

    // Tarixə görə ən yenilər yuxarıda sıralanır
    return loadedLetters
      .filter(Boolean)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    console.warn('[GitHubService] Məktublar yüklənərkən xəta:', err);
    return [];
  }
}

export async function saveLetterToGitHub(letter) {
  try {
    const cleanTitle = (letter.title || 'Məktub')
      .replace(/[^a-zA-Z0-9əƏıIöÖşŞüÜçÇğĞ\s_-]/g, '')
      .replace(/\s+/g, '_');

    const timestamp = Date.now();
    const filePath = `letters/${cleanTitle}_${timestamp}.txt`;

    // Müəllif prefiksi ilə məzmun
    const fullContent = `[Müəllif: ${letter.author}]\n\n${letter.content}`;
    const base64Content = utf8ToBase64(fullContent);

    const result = await requestProxy('github_upload', {
      path: filePath,
      content: base64Content,
      message: `✉️ Yeni məktub: ${letter.title} (${letter.author})`,
    });

    return {
      success: true,
      path: filePath,
      sha: result?.content?.sha,
    };
  } catch (err) {
    console.error('[GitHubService] Məktub GitHub-a göndərilərkən xəta:', err);
    return { success: false, error: err };
  }
}

export async function deleteLetterFromGitHub(letter) {
  try {
    if (!letter.path || !letter.sha) {
      console.warn('[GitHubService] Silinmə üçün path və ya sha çatışmır:', letter);
      return { success: false };
    }

    await requestProxy('github_delete', {
      path: letter.path,
      sha: letter.sha,
      message: `✉️ Məktub silindi: ${letter.title}`,
    });

    return { success: true };
  } catch (err) {
    console.error('[GitHubService] Məktub GitHub-dan silinərkən xəta:', err);
    return { success: false, error: err };
  }
}

export async function updateLetterToGitHub(letter) {
  try {
    if (!letter.path || !letter.sha) {
      console.warn('[GitHubService] Yenilənmə üçün path və ya sha çatışmır:', letter);
      return { success: false };
    }

    const fullContent = `[Müəllif: ${letter.author}]\n\n${letter.content}`;
    const base64Content = utf8ToBase64(fullContent);

    const result = await requestProxy('github_upload', {
      path: letter.path,
      content: base64Content,
      sha: letter.sha,
      message: `✉️ Məktub redaktə edildi: ${letter.title}`,
    });

    return {
      success: true,
      path: letter.path,
      sha: result?.content?.sha || letter.sha,
    };
  } catch (err) {
    console.error('[GitHubService] Məktub yenilənərkən xəta:', err);
    return { success: false, error: err };
  }
}
