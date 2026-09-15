import React, { useState } from 'react';
import { Image, Heart, Trash2, CheckSquare, Square, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/layout/Header';
import PhotoTabs from '../components/photos/PhotoTabs';
import PhotoGrid from '../components/photos/PhotoGrid';
import PhotoLightbox from '../components/photos/PhotoLightbox';
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './PhotosPage.css';

export default function PhotosPage() {
  const { photos, setPhotos, removePhoto, removeBulkPhotos, isLoading } = useData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Toplu seçim rejimi vəziyyətləri
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Cari göstərilən şəkillər
  const favoritePhotos = photos.filter((p) => p.isFavorite);
  const displayPhotos = activeTab === 'all' ? photos : favoritePhotos;

  // Favorit statusunu dəyişmək
  const handleToggleFavorite = (photoId) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p))
    );
    if (selectedPhoto && selectedPhoto.id === photoId) {
      setSelectedPhoto((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
    }
  };

  // Tək şəklin silinməsi (Lightbox daxilindən)
  const handleDeleteSinglePhoto = async (photoToDelete) => {
    await removePhoto(photoToDelete);
    setSelectedPhoto(null);
    showToast('Şəkil silindi və GitHub-da yeniləndi');
  };

  // Toplu seçim rejimini aç/bağla
  const toggleSelectMode = () => {
    setIsSelectMode((prev) => !prev);
    setSelectedIds([]);
  };

  // Şəkli seç/seçimdən çıxar
  const handleToggleSelect = (photoId) => {
    setSelectedIds((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  // Hamısını seç / Seçimi təmizlə
  const handleSelectAll = () => {
    if (selectedIds.length === displayPhotos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayPhotos.map((p) => p.id));
    }
  };

  // Toplu silmə icrası
  const handleConfirmBulkDelete = async () => {
    const photosToDelete = photos.filter((p) => selectedIds.includes(p.id));
    const count = selectedIds.length;

    await removeBulkPhotos(photosToDelete);

    setSelectedIds([]);
    setIsSelectMode(false);
    setShowBulkConfirm(false);
    showToast(`${count} şəkil silindi`);
  };

  return (
    <div className="photos-page-container">
      {/* Başlıq və Alt başlıq */}
      <Header subtitle="Şəkillərimiz" />

      {/* İdarəetmə Paneli: Tablar və "Seç" düyməsi */}
      <div className="photos-top-controls">
        <PhotoTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {displayPhotos.length > 0 && (
          <button
            className={`select-mode-toggle-btn ${isSelectMode ? 'active' : ''}`}
            onClick={toggleSelectMode}
          >
            {isSelectMode ? 'Ləğv et' : 'Seç'}
          </button>
        )}
      </div>

      {/* Seçim rejimində olan zaman alt idarəetmə zolağı */}
      {isSelectMode && displayPhotos.length > 0 && (
        <div className="selection-info-bar">
          <button className="select-all-btn" onClick={handleSelectAll}>
            {selectedIds.length === displayPhotos.length ? (
              <>
                <CheckSquare size={16} />
                <span>Hamısını təmizlə</span>
              </>
            ) : (
              <>
                <Square size={16} />
                <span>Hamısını seç</span>
              </>
            )}
          </button>

          <span className="selected-count-badge">
            {selectedIds.length} seçildi
          </span>
        </div>
      )}

      {/* Şəkil Qridi, Yüklənmə və ya Boş vəziyyət */}
      {isLoading ? (
        <LoadingSpinner message="Şəkillər yüklənir..." />
      ) : displayPhotos.length > 0 ? (
        <PhotoGrid
          photos={displayPhotos}
          onPhotoClick={setSelectedPhoto}
          isSelectMode={isSelectMode}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
        />
      ) : (
        <EmptyState
          icon={activeTab === 'all' ? Image : Heart}
          message={
            activeTab === 'all'
              ? 'Hələki şəkil yoxdur...'
              : 'Hələki favori şəkil yoxdur...'
          }
        />
      )}

      {/* Seçim rejimində üzən silmə zolağı (Ekranın aşağısında) */}
      {isSelectMode && (
        <div className="floating-bulk-bar">
          <button
            className="bulk-delete-action-btn"
            disabled={selectedIds.length === 0}
            onClick={() => setShowBulkConfirm(true)}
          >
            <Trash2 size={18} />
            <span>Seçilənləri sil ({selectedIds.length})</span>
          </button>
        </div>
      )}

      {/* Tam Ekran Şəkil Baxışı (Lightbox: Oxlar, Swipe və Tək Silmə) */}
      <PhotoLightbox
        photo={selectedPhoto}
        photosList={displayPhotos}
        onClose={() => setSelectedPhoto(null)}
        onToggleFavorite={handleToggleFavorite}
        onDeletePhoto={handleDeleteSinglePhoto}
        onNavigate={setSelectedPhoto}
      />

      {/* Toplu Silmə Təsdiq Modalı */}
      <ConfirmModal
        isOpen={showBulkConfirm}
        title="Seçilmiş şəkillər silinsin?"
        message={`${selectedIds.length} şəkil kolleksiyadan həmişəlik silinəcək.`}
        confirmText="Bəli, hamısını sil"
        cancelText="İmtina"
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setShowBulkConfirm(false)}
      />
    </div>
  );
}
