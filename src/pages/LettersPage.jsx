import React, { useState } from 'react';
import { Mail, Trash2, CheckSquare, Square, Heart } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/layout/Header';
import LetterCard from '../components/letters/LetterCard';
import LetterModal from '../components/letters/LetterModal';
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './LettersPage.css';

export default function LettersPage() {
  const { letters, setLetters, updateLetter, removeLetter, removeBulkLetters, isLoading } = useData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('all'); // 'all' və ya 'favorites'
  const [selectedLetter, setSelectedLetter] = useState(null);

  // Toplu seçim vəziyyəti
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Cari göstərilən məktublar (Hamısı və ya Favorilər)
  const favoriteLetters = letters.filter((l) => l.isFavorite);
  const displayLetters = activeTab === 'all' ? letters : favoriteLetters;

  // Favorit statusunu dəyişmək
  const handleToggleFavorite = (letterId) => {
    setLetters((prev) =>
      prev.map((l) => (l.id === letterId ? { ...l, isFavorite: !l.isFavorite } : l))
    );
    if (selectedLetter && selectedLetter.id === letterId) {
      setSelectedLetter((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
    }
  };

  // Məktubu redaktə etmək
  const handleUpdateLetter = async (updatedLetter) => {
    await updateLetter(updatedLetter);
    setSelectedLetter(updatedLetter);
    showToast('Məktub yeniləndi');
  };

  // Tək məktubun silinməsi
  const handleDeleteSingleLetter = async (letterToDelete) => {
    await removeLetter(letterToDelete);
    setSelectedLetter(null);
    showToast('Məktub silindi');
  };

  // Toplu seçim rejimini aç/bağla
  const toggleSelectMode = () => {
    setIsSelectMode((prev) => !prev);
    setSelectedIds([]);
  };

  // Məktubu seç/seçimdən çıxar
  const handleToggleSelect = (letterId) => {
    setSelectedIds((prev) =>
      prev.includes(letterId)
        ? prev.filter((id) => id !== letterId)
        : [...prev, letterId]
    );
  };

  // Hamısını seç / təmizlə
  const handleSelectAll = () => {
    if (selectedIds.length === displayLetters.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayLetters.map((l) => l.id));
    }
  };

  // Toplu silmə icrası
  const handleConfirmBulkDelete = async () => {
    const lettersToDelete = letters.filter((l) => selectedIds.includes(l.id));
    const count = selectedIds.length;

    await removeBulkLetters(lettersToDelete);

    setSelectedIds([]);
    setIsSelectMode(false);
    setShowBulkConfirm(false);
    showToast(`${count} məktub silindi`);
  };

  return (
    <div className="letters-page-container">
      {/* Başlıq və Alt başlıq */}
      <Header subtitle="Məktublarımız" />

      {/* İdarəetmə paneli: Tablar və Seç düyməsi */}
      <div className="letters-top-controls">
        <div className="letters-tabs-pill">
          <button
            className={`letters-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Hamısı
          </button>
          <button
            className={`letters-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            Favorilər
          </button>
        </div>

        {displayLetters.length > 0 && (
          <button
            className={`letters-select-mode-btn ${isSelectMode ? 'active' : ''}`}
            onClick={toggleSelectMode}
          >
            {isSelectMode ? 'Ləğv et' : 'Seç'}
          </button>
        )}
      </div>

      {/* Seçim rejimində olan zaman zolaq */}
      {isSelectMode && displayLetters.length > 0 && (
        <div className="letters-selection-info-bar">
          <button className="select-all-btn" onClick={handleSelectAll}>
            {selectedIds.length === displayLetters.length ? (
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

      {/* Məktub Siyahısı, Yüklənmə və ya Boş vəziyyət */}
      {isLoading ? (
        <LoadingSpinner message="Məktublar yüklənir..." />
      ) : displayLetters.length > 0 ? (
        <div className="letters-list">
          {displayLetters.map((letter) => (
            <LetterCard
              key={letter.id}
              letter={letter}
              onClick={setSelectedLetter}
              isSelectMode={isSelectMode}
              isSelected={selectedIds.includes(letter.id)}
              onToggleSelect={handleToggleSelect}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={activeTab === 'all' ? Mail : Heart}
          message={
            activeTab === 'all'
              ? 'Hələki məktub yoxdur...'
              : 'Hələki favori məktub yoxdur...'
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

      {/* Məktub Oxuma və Redaktə Modalı (Oxlar, Swipe, Favori və Silmə) */}
      <LetterModal
        letter={selectedLetter}
        lettersList={displayLetters}
        onClose={() => setSelectedLetter(null)}
        onDeleteLetter={handleDeleteSingleLetter}
        onUpdateLetter={handleUpdateLetter}
        onToggleFavorite={handleToggleFavorite}
        onNavigate={setSelectedLetter}
      />

      {/* Toplu Silmə Təsdiq Modalı */}
      <ConfirmModal
        isOpen={showBulkConfirm}
        title="Seçilmiş məktublar silinsin?"
        message={`${selectedIds.length} məktub həmişəlik silinəcək.`}
        confirmText="Bəli, hamısını sil"
        cancelText="İmtina"
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setShowBulkConfirm(false)}
      />
    </div>
  );
}
