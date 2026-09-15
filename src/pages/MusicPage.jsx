import React, { useState } from 'react';
import { Music, Trash2, CheckSquare, Square, Heart } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/layout/Header';
import MusicItem from '../components/music/MusicItem';
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './MusicPage.css';

export default function MusicPage() {
  const { musicList, setMusicList, removeMusic, removeBulkMusic, isLoading } = useData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('all'); // 'all' və ya 'favorites'
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Cari göstərilən musiqilər
  const favoriteSongs = musicList.filter((m) => m.isFavorite);
  const displaySongs = activeTab === 'all' ? musicList : favoriteSongs;

  // Favorit statusunu dəyişmək
  const handleToggleFavorite = (songId) => {
    setMusicList((prev) =>
      prev.map((m) => (m.id === songId ? { ...m, isFavorite: !m.isFavorite } : m))
    );
  };

  // Toplu seçim rejimini aç/bağla
  const toggleSelectMode = () => {
    setIsSelectMode((prev) => !prev);
    setSelectedIds([]);
  };

  const handleToggleSelect = (songId) => {
    setSelectedIds((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === displaySongs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displaySongs.map((m) => m.id));
    }
  };

  // Toplu silmə icrası
  const handleConfirmBulkDelete = async () => {
    const songsToDelete = musicList.filter((m) => selectedIds.includes(m.id));
    const count = selectedIds.length;

    await removeBulkMusic(songsToDelete);

    setSelectedIds([]);
    setIsSelectMode(false);
    setShowBulkConfirm(false);
    showToast(`${count} musiqi silindi`);
  };

  return (
    <div className="music-page-container">
      {/* Başlıq və Alt başlıq */}
      <Header subtitle="Musiqilərimiz" />

      {/* Tablar: Hamısı / Favorilər və "Seç" düyməsi */}
      <div className="music-top-controls">
        <div className="music-tabs-pill">
          <button
            className={`music-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Hamısı
          </button>
          <button
            className={`music-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            Favorilər
          </button>
        </div>

        {displaySongs.length > 0 && (
          <button
            className={`music-select-mode-btn ${isSelectMode ? 'active' : ''}`}
            onClick={toggleSelectMode}
          >
            {isSelectMode ? 'Ləğv et' : 'Seç'}
          </button>
        )}
      </div>

      {/* Seçim rejimində olan zaman zolaq */}
      {isSelectMode && displaySongs.length > 0 && (
        <div className="music-selection-info-bar">
          <button className="select-all-btn" onClick={handleSelectAll}>
            {selectedIds.length === displaySongs.length ? (
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

      {/* Musiqi Siyahısı, Yüklənmə və ya Boş vəziyyət */}
      {isLoading ? (
        <LoadingSpinner message="Musiqilər yüklənir..." />
      ) : displaySongs.length > 0 ? (
        <div className="music-list">
          {displaySongs.map((song) => (
            <MusicItem
              key={song.id}
              song={song}
              isSelectMode={isSelectMode}
              isSelected={selectedIds.includes(song.id)}
              onToggleSelect={handleToggleSelect}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={activeTab === 'all' ? Music : Heart}
          message={
            activeTab === 'all'
              ? 'Hələki musiqi yoxdur...'
              : 'Hələki favori musiqi yoxdur...'
          }
        />
      )}

      {/* Seçim rejimində üzən silmə zolağı */}
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

      {/* Toplu Silmə Təsdiq Modalı */}
      <ConfirmModal
        isOpen={showBulkConfirm}
        title="Seçilmiş musiqilər silinsin?"
        message={`${selectedIds.length} musiqi siyahıdan həmişəlik silinəcək.`}
        confirmText="Bəli, hamısını sil"
        cancelText="İmtina"
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setShowBulkConfirm(false)}
      />
    </div>
  );
}
