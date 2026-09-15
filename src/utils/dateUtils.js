/**
 * Tarix formatlama utilitləri
 * Qısa aylar: yan, fev, mar, apr, may, iyn, iyl, avq, sent, okt, noy, dek
 */

const AZ_MONTHS_SHORT = [
  'yan',
  'fev',
  'mar',
  'apr',
  'may',
  'iyn',
  'iyl',
  'avq',
  'sent',
  'okt',
  'noy',
  'dek',
];

// Şəkillər üçün: 15 sent 2026
export function formatPhotoDate(dateInput) {
  if (!dateInput) return '';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return dateInput;
  }

  const day = date.getDate();
  const month = AZ_MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

// Məktublar üçün: 15 sent 2026 • 17:15 (saat və dəqiqə daxil olmaqla)
export function formatLetterDate(dateInput) {
  if (!dateInput) return '';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return dateInput;
  }

  const day = date.getDate();
  const month = AZ_MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} • ${hours}:${minutes}`;
}
