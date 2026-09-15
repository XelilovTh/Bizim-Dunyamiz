/**
 * Cloudinary bulud xidməti inteqrasiyası
 * 1-ci hesab: Şəkillər (Images)
 * 2-ci hesab: Musiqilər (Audio/Video)
 */

const CL_IMAGE_NAME = import.meta.env.VITE_CL_NAME || 'dojz9uzhe';
const CL_IMAGE_PRESET = import.meta.env.VITE_CL_PRESET || 'dunyamiz';

const CL_MUSIC_NAME = import.meta.env.VITE_CL_MUSIC_NAME || 'drlzwhblg';
const CL_MUSIC_PRESET = import.meta.env.VITE_CL_MUSIC_PRESET || 'dunyamiz_music';

/**
 * 1. Şəkli Cloudinary-yə yüklə (1-ci hesab: dojz9uzhe)
 * @param {File} file - Şəkil faylı
 * @returns {Promise<{ url: string, public_id: string, width: number, height: number, format: string }>}
 */
export async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CL_IMAGE_PRESET);
  formData.append('folder', 'dunyamiz');
  formData.append('tags', 'dunyamiz_gallery');

  const endpoint = `https://api.cloudinary.com/v1_1/${CL_IMAGE_NAME}/image/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errorMsg = errData?.error?.message || `Yükləmə xətası (${response.status})`;
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return {
    url: data.secure_url || data.url,
    public_id: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
  };
}

/**
 * 2. Musiqini Cloudinary-yə yüklə (2-ci hesab: drlzwhblg)
 * Audio fayllar Cloudinary-də 'video/upload' endpoint-i ilə qəbul olunur
 * @param {File} file - Audio fayl (.mp3, .wav, .m4a, .ogg)
 * @returns {Promise<{ url: string, public_id: string, duration: number, format: string }>}
 */
export async function uploadAudioToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CL_MUSIC_PRESET);
  formData.append('folder', 'dunyamiz_music');
  formData.append('tags', 'dunyamiz_music');

  const endpoint = `https://api.cloudinary.com/v1_1/${CL_MUSIC_NAME}/video/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errorMsg = errData?.error?.message || `Musiqi yükləmə xətası (${response.status})`;
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return {
    url: data.secure_url || data.url,
    public_id: data.public_id,
    duration: data.duration,
    format: data.format,
  };
}

/**
 * 3. Faylı Cloudinary-dən sil
 * @param {string} publicId - Cloudinary public_id
 * @param {'image'|'video'} resourceType - Şəkil üçün 'image', Musiqi üçün 'video'
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  if (!publicId) return false;

  try {
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cloudinary_delete',
        public_id: publicId,
        resource_type: resourceType,
        cloud_name: resourceType === 'video' ? CL_MUSIC_NAME : CL_IMAGE_NAME,
      }),
    });

    if (!response.ok) return false;
    const result = await response.json();
    return result?.result === 'ok';
  } catch (err) {
    console.warn('[Cloudinary] Silmə xətası (offline və ya proxy aktiv deyil):', err);
    return false;
  }
}

