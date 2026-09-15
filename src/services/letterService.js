/**
 * Məktubların idarə edilməsi üçün servis funksiyaları.
 * Mərhələ 7 (GitHub JSON / Letters) zamanı bu metodlar
 * real API çağırışları ilə tam inteqrasiya olunacaqdır.
 */

// Tək məktubun silinməsi (Backend hazırlığı)
export async function deleteLetterAPI(letter) {
  try {
    console.log(`[LetterService] Məktub silinməyə göndərilir -> ID: ${letter.id}, Başlıq: ${letter.title}`);
    return { success: true };
  } catch (error) {
    console.error('[LetterService] Məktub silinərkən xəta:', error);
    return { success: false, error };
  }
}

// Toplu məktubların silinməsi (Backend hazırlığı)
export async function deleteBulkLettersAPI(lettersList) {
  try {
    console.log(`[LetterService] Toplu məktub silinməsi -> Sayı: ${lettersList.length}`);
    return { success: true, count: lettersList.length };
  } catch (error) {
    console.error('[LetterService] Toplu məktub silinərkən xəta:', error);
    return { success: false, error };
  }
}

// Məktubun redaktə edilməsi (Backend hazırlığı)
export async function updateLetterAPI(updatedLetter) {
  try {
    console.log(`[LetterService] Məktub yenilənir -> ID: ${updatedLetter.id}, Müəllif: ${updatedLetter.author}, Başlıq: ${updatedLetter.title}`);
    return { success: true, letter: updatedLetter };
  } catch (error) {
    console.error('[LetterService] Məktub yenilənərkən xəta:', error);
    return { success: false, error };
  }
}
