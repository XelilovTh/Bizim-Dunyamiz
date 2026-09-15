/**
 * Şəkillərin idarə edilməsi üçün servis funksiyaları.
 * Mərhələ 6 (Cloudinary) və Mərhələ 7 (GitHub JSON) zamanı bu metodlar
 * real API çağırışları ilə tam inteqrasiya olunacaqdır.
 */

import { deleteFromCloudinary } from './cloudinaryService';

// Tək şəklin silinməsi (Cloudinary və Local)
export async function deletePhotoAPI(photo) {
  try {
    console.log(`[PhotoService] Şəkil silinir -> ID: ${photo.id}, PublicId: ${photo.public_id || 'yoxdur'}`);
    
    if (photo.public_id) {
      await deleteFromCloudinary(photo.public_id, 'image');
    }

    return { success: true };
  } catch (error) {
    console.error('[PhotoService] Şəkil silinərkən xəta baş verdi:', error);
    return { success: false, error };
  }
}

// Toplu şəkillərin silinməsi
export async function deleteBulkPhotosAPI(photosList) {
  try {
    console.log(`[PhotoService] Toplu silinmə -> Sayı: ${photosList.length}`);
    
    await Promise.all(
      photosList
        .filter((p) => p.public_id)
        .map((p) => deleteFromCloudinary(p.public_id, 'image'))
    );

    return { success: true, count: photosList.length };
  } catch (error) {
    console.error('[PhotoService] Toplu silinmədə xəta:', error);
    return { success: false, error };
  }
}

