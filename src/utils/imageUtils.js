/**
 * Cloudinary şəkillərini avtomatik sıxmaq və ölçüsünü optimizasiya etmək üçün köməkçi funksiya.
 * f_auto (webp/avif), q_auto və istənilən enlikdə (width) miniatür yaradır.
 */

export function getOptimizedImageUrl(url, { width = 450, crop = 'fill', quality = 'auto', format = 'auto' } = {}) {
  if (!url || typeof url !== 'string') return url;

  // Yalnız Cloudinary URL-ləri üçün transformasiya əlavə et
  if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
    // Əgər artıq transformasiya varsa, toxunma
    if (url.includes('/image/upload/f_auto') || url.includes('/image/upload/w_')) {
      return url;
    }

    const transformParams = `f_${format},q_${quality},c_${crop},w_${width}`;
    return url.replace('/image/upload/', `/image/upload/${transformParams}/`);
  }

  return url;
}

export function getLightboxImageUrl(url) {
  return getOptimizedImageUrl(url, { width: 1400, crop: 'limit', quality: 'auto', format: 'auto' });
}

