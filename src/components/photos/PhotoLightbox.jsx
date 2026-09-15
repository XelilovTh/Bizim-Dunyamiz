import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';
import { formatPhotoDate } from '../../utils/dateUtils';
import { trackUserAction } from '../../services/analyticsService';
import { getLightboxImageUrl } from '../../utils/imageUtils';
import './PhotoLightbox.css';

export default function PhotoLightbox({
  photo,
  photosList = [],
  onClose,
  onToggleFavorite,
  onDeletePhoto,
  onNavigate,
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  // Şəkil açıldıqda analitika
  useEffect(() => {
    if (photo) {
      trackUserAction('Şəkil Baxışı', photo.name || 'Şəkil');
    }
  }, [photo?.id]);

  // Cari şəklin siyahıdakı indeksi
  const currentIndex = photosList.findIndex((p) => p.id === photo?.id);
  const totalCount = photosList.length;

  const handlePrev = () => {
    if (totalCount <= 1) return;
    const newIdx = (currentIndex - 1 + totalCount) % totalCount;
    onNavigate(photosList[newIdx]);
  };

  const handleNext = () => {
    if (totalCount <= 1) return;
    const newIdx = (currentIndex + 1) % totalCount;
    onNavigate(photosList[newIdx]);
  };

  // Klaviatura ox düymələri
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalCount]);

  // Touch Swipe (Mobil üçün sürüşdürmə)
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    // 45px-dən böyük sürüşdürmə
    if (diff > 45) {
      handleNext(); // sola sürüşdürəndə növbəti
    } else if (diff < -45) {
      handlePrev(); // sağa sürüşdürəndə əvvəlki
    }
    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
  };

  if (!photo) return null;

  return (
    <>
      <div className="lightbox-backdrop" onClick={onClose}>
        <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
          {/* Üst idarəetmə paneli */}
          <div className="lightbox-top-bar">
            {/* Sayğac (məs. 2 / 5) */}
            <span className="lightbox-counter">
              {currentIndex !== -1 ? `${currentIndex + 1} / ${totalCount}` : ''}
            </span>

            <div className="lightbox-top-actions">
              {/* Favori düyməsi */}
              <button
                className={`lightbox-action-btn ${photo.isFavorite ? 'favorited' : ''}`}
                onClick={() => onToggleFavorite(photo.id)}
                title={photo.isFavorite ? 'Favorilərdən çıxar' : 'Favorilərə əlavə et'}
              >
                <Heart size={20} className="lightbox-heart" />
              </button>

              {/* Tək şəkli silmə düyməsi */}
              <button
                className="lightbox-action-btn delete-btn"
                onClick={() => setShowConfirm(true)}
                title="Şəkli sil"
              >
                <Trash2 size={19} />
              </button>

              {/* Bağla */}
              <button className="lightbox-action-btn close-btn" onClick={onClose} title="Bağla">
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Şəkil və İrəli/Geri Oxları */}
          <div
            className="lightbox-viewer"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Sol ox */}
            {totalCount > 1 && (
              <button
                className="lightbox-nav-arrow arrow-left"
                onClick={handlePrev}
                aria-label="Əvvəlki şəkil"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Şəkil */}
            <div className="lightbox-img-wrapper">
              <img
                src={getLightboxImageUrl(photo.url)}
                alt={photo.name || 'Şəkil'}
                className="lightbox-img"
              />
            </div>

            {/* Sağ ox */}
            {totalCount > 1 && (
              <button
                className="lightbox-nav-arrow arrow-right"
                onClick={handleNext}
                aria-label="Növbəti şəkil"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          {/* Alt məlumat: Əlavə edilmə tarixi (məs. 15 sent 2026) */}
          <p className="lightbox-caption">
            {formatPhotoDate(photo.created_at || photo.createdAt || photo.date)}
          </p>
        </div>
      </div>

      {/* Silmə Təsdiq Modalı */}
      <ConfirmModal
        isOpen={showConfirm}
        title="Şəkli silmək istəyirsiniz?"
        message="Bu şəkil kolleksiyadan silinəcək."
        confirmText="Bəli, sil"
        cancelText="İmtina"
        onConfirm={() => {
          setShowConfirm(false);
          onDeletePhoto(photo);
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
