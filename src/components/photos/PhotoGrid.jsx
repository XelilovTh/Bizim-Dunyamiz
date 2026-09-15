import React from 'react';
import { Heart, Check } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils/imageUtils';
import './PhotoGrid.css';

export default function PhotoGrid({
  photos,
  onPhotoClick,
  isSelectMode = false,
  selectedIds = [],
  onToggleSelect,
}) {
  return (
    <div className={`photo-grid ${isSelectMode ? 'selection-mode' : ''}`}>
      {photos.map((photo) => {
        const isSelected = selectedIds.includes(photo.id);
        const thumbnailUrl = getOptimizedImageUrl(photo.url, { width: 450, crop: 'fill' });

        const handleClick = () => {
          if (isSelectMode) {
            onToggleSelect(photo.id);
          } else {
            onPhotoClick(photo);
          }
        };

        return (
          <div
            key={photo.id}
            className={`photo-card ${isSelected ? 'selected' : ''}`}
            onClick={handleClick}
          >
            <img
              src={thumbnailUrl}
              alt={photo.name || 'Şəkil'}
              loading="lazy"
              decoding="async"
              className="photo-img"
            />

            {/* Seçim rejimi üçün checkbox */}
            {isSelectMode ? (
              <div className={`photo-select-checkbox ${isSelected ? 'checked' : ''}`}>
                {isSelected && <Check size={14} strokeWidth={3} />}
              </div>
            ) : (
              /* Normal rejim: Favori ürək nişanı */
              photo.isFavorite && (
                <div className="photo-favorite-badge" title="Favori">
                  <Heart size={12} className="favorite-badge-heart" />
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
