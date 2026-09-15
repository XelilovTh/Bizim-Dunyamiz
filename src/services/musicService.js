/**
 * Musiqilərin idarə edilməsi üçün servis funksiyaları.
 * Mərhələ 6 (Cloudinary Hesab #2) və Mərhələ 7 (GitHub JSON / Music) zamanı bu metodlar
 * real API çağırışları ilə tam inteqrasiya olunacaqdır.
 */

import { deleteFromCloudinary } from './cloudinaryService';

// Tək musiqinin silinməsi (Cloudinary və Local)
export async function deleteMusicAPI(song) {
  try {
    console.log(`[MusicService] Musiqi silinir -> ID: ${song.id}, PublicId: ${song.public_id || 'yoxdur'}, Ad: ${song.title}`);
    if (song.public_id) {
      await deleteFromCloudinary(song.public_id, 'video');
    }
    return { success: true };
  } catch (error) {
    console.error('[MusicService] Musiqi silinərkən xəta:', error);
    return { success: false, error };
  }
}

// Toplu musiqilərin silinməsi
export async function deleteBulkMusicAPI(songsList) {
  try {
    console.log(`[MusicService] Toplu musiqi silinməsi -> Sayı: ${songsList.length}`);
    await Promise.all(
      songsList
        .filter((s) => s.public_id)
        .map((s) => deleteFromCloudinary(s.public_id, 'video'))
    );
    return { success: true, count: songsList.length };
  } catch (error) {
    console.error('[MusicService] Toplu musiqi silinərkən xəta:', error);
    return { success: false, error };
  }
}

