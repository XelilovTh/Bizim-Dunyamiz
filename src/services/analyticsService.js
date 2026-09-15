/**
 * Bildiriş Botu üçün Ətraflı Analitika və Fəaliyyət İzləyici Servis (NOTIF_BOT_TOKEN)
 * Cihaz, IP, Şəhər, Batareya, Ekran və İstifadəçi Hərəkətlərini toplayır.
 */

let visitorData = {
  ip: 'Naməlum IP',
  city: '',
  country: '',
  isp: '',
  device: '',
  battery: '',
  screen: '',
  startTime: Date.now(),
};

let isInitialized = false;
let exitSent = false;

// Cihaz və Brauzer məlumatı
export function getDeviceInfo() {
  const ua = navigator.userAgent || '';
  let device = 'PC / Masaüstü';

  if (/iphone/i.test(ua)) {
    const match = ua.match(/OS (\d+[._]\d+)/);
    const version = match ? match[1].replace('_', '.') : '';
    device = `iPhone (iOS ${version}) 🍏`;
  } else if (/ipad/i.test(ua)) {
    device = 'iPad 🍏';
  } else if (/android/i.test(ua)) {
    const match = ua.match(/Android\s+([0-9.]+)/);
    const version = match ? match[1] : '';
    device = `Android ${version} 📱`;
  } else if (/windows/i.test(ua)) {
    device = 'Windows Kompüter 💻';
  } else if (/macintosh|mac os x/i.test(ua)) {
    device = 'MacBook / macOS 💻';
  }

  let browser = 'Naməlum Brauzer';
  if (/telegram/i.test(ua)) browser = 'Telegram Brauzer';
  else if (/instagram/i.test(ua)) browser = 'Instagram Brauzer';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';

  return `${device} • ${browser}`;
}

// Batareya məlumatı
export async function getBatteryInfo() {
  try {
    if ('getBattery' in navigator) {
      const b = await navigator.getBattery();
      const level = Math.round(b.level * 100);
      const charging = b.charging ? '⚡ Şarjda' : '🔋 Şarj olunmur';
      return `${level}% (${charging})`;
    }
  } catch (e) {}
  return 'Məlum deyil';
}

// Şəbəkə növü
export function getNetworkInfo() {
  if (navigator.connection) {
    const conn = navigator.connection;
    return conn.effectiveType ? conn.effectiveType.toUpperCase() : 'Aktiv';
  }
  return 'Aktiv';
}

// IP və Geo məlumatı
export async function fetchGeoInfo() {
  try {
    const res = await fetch('https://ipapi.co/json/', { timeout: 3000 });
    if (res.ok) {
      const data = await res.json();
      return {
        ip: data.ip || 'Naməlum IP',
        city: data.city || '',
        country: data.country_name || '',
        isp: data.org || '',
      };
    }
  } catch (e) {}

  // Fallback (Yalnız IP)
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return { ip: data.ip || 'Naməlum IP', city: '', country: '', isp: '' };
  } catch (e) {}

  return { ip: 'Naməlum IP', city: '', country: '', isp: '' };
}

// Telegram Bildiriş Göndəricisi
export async function sendNotification(text, ip = null) {
  try {
    await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'telegram_send',
        text: text,
        ip: ip || visitorData.ip,
      }),
    });
  } catch (e) {
    console.warn('[Analytics] Bildiriş göndərilə bilmədi:', e);
  }
}

// Sayta Uğurlu Giriş Analitikası
export async function initVisitorAnalytics() {
  if (isInitialized) return;
  isInitialized = true;
  visitorData.startTime = Date.now();

  const [geo, battery] = await Promise.all([
    fetchGeoInfo(),
    getBatteryInfo(),
  ]);

  visitorData.ip = geo.ip;
  visitorData.city = geo.city;
  visitorData.country = geo.country;
  visitorData.isp = geo.isp;
  visitorData.device = getDeviceInfo();
  visitorData.battery = battery;
  visitorData.screen = `${window.screen.width}x${window.screen.height}`;

  const locationStr = geo.city && geo.country ? `${geo.city}, ${geo.country}` : (geo.country || 'Məlum deyil');
  const network = getNetworkInfo();

  const msg =
    `<b>🟢 Sayta giriş oldu!</b>\n\n` +
    `👤 <b>IP:</b> <code>${visitorData.ip}</code>\n` +
    `📍 <b>Məkan:</b> ${locationStr} ${geo.isp ? `(${geo.isp})` : ''}\n` +
    `📱 <b>Cihaz:</b> ${visitorData.device}\n` +
    `🔋 <b>Batareya:</b> ${visitorData.battery}\n` +
    `🖥 <b>Ekran:</b> ${visitorData.screen}\n` +
    `📶 <b>Şəbəkə:</b> ${network}\n` +
    `⏰ <b>Vaxt:</b> ${new Date().toLocaleString('az-AZ')}`;

  await sendNotification(msg, visitorData.ip);

  // Çıxış hadisələri
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendExitNotification();
    }
  });

  window.addEventListener('pagehide', sendExitNotification);
  window.addEventListener('beforeunload', sendExitNotification);
}

// Fəaliyyət İzləmə (Şəkil açıldı, Musiqi başladı, Məktub oxundu və s.)
export function trackUserAction(action, details = '') {
  const ip = visitorData.ip || 'Naməlum IP';
  const device = visitorData.device || getDeviceInfo();

  let msg = `<b>🔔 Fəaliyyət: ${action}</b>\n\n`;
  if (details) {
    msg += `📝 <b>Məlumat:</b> ${details}\n`;
  }
  msg += `👤 <b>IP:</b> <code>${ip}</code>\n`;
  msg += `📱 <b>Cihaz:</b> ${device}\n`;
  msg += `⏰ <b>Vaxt:</b> ${new Date().toLocaleTimeString('az-AZ')}`;

  sendNotification(msg, ip);
}

// Saytdan Çıxış Bildirişi
export function sendExitNotification() {
  if (exitSent) return;
  exitSent = true;

  const durationMs = Date.now() - visitorData.startTime;
  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);

  let timeString = '';
  if (hours > 0) timeString += `${hours} saat `;
  if (minutes > 0) timeString += `${minutes} dəqiqə `;
  timeString += `${seconds} saniyə`;

  const msg =
    `<b>🔴 Saytdan çıxış!</b>\n\n` +
    `👤 <b>IP:</b> <code>${visitorData.ip}</code>\n` +
    `📱 <b>Cihaz:</b> ${visitorData.device}\n` +
    `⏳ <b>Saytda keçirilən vaxt:</b> ${timeString}\n` +
    `⏰ <b>Çıxış vaxtı:</b> ${new Date().toLocaleTimeString('az-AZ')}`;

  // Beacon və ya fetch
  if (navigator.sendBeacon) {
    const payload = JSON.stringify({
      action: 'telegram_send',
      text: msg,
      ip: visitorData.ip,
    });
    navigator.sendBeacon('/api/proxy', new Blob([payload], { type: 'application/json' }));
  } else {
    sendNotification(msg, visitorData.ip);
  }
}

