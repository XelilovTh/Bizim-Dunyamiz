import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Edit3, Heart, ChevronLeft, ChevronRight, Calendar, Check, User } from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';
import { formatLetterDate } from '../../utils/dateUtils';
import { trackUserAction } from '../../services/analyticsService';
import './LetterModal.css';

export default function LetterModal({
  letter,
  lettersList = [],
  onClose,
  onDeleteLetter,
  onUpdateLetter,
  onToggleFavorite,
  onNavigate,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('Təhmaz');
  const [editContent, setEditContent] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  // Məktub dəyişdikdə redaktə sahələrini yenilə və analitika göndər
  useEffect(() => {
    if (letter) {
      setEditTitle(letter.title || '');
      setEditAuthor(letter.author || 'Təhmaz');
      setEditContent(letter.content || '');
      setIsEditing(false);
      trackUserAction('Məktub Oxunur', `«${letter.title}» (${letter.author})`);
    }
  }, [letter?.id]);

  const currentIndex = lettersList.findIndex((l) => l.id === letter?.id);
  const totalCount = lettersList.length;

  const handlePrev = () => {
    if (totalCount <= 1 || isEditing) return;
    const newIdx = (currentIndex - 1 + totalCount) % totalCount;
    onNavigate(lettersList[newIdx]);
  };

  const handleNext = () => {
    if (totalCount <= 1 || isEditing) return;
    const newIdx = (currentIndex + 1) % totalCount;
    onNavigate(lettersList[newIdx]);
  };

  // Redaktəni yadda saxla
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;

    onUpdateLetter({
      ...letter,
      title: editTitle.trim(),
      author: editAuthor,
      content: editContent.trim(),
    });
    setIsEditing(false);
  };

  // Klaviatura düymələri
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isEditing) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalCount, isEditing]);

  // Touch Swipe (Mobil üçün)
  const handleTouchStart = (e) => {
    if (isEditing) return;
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (isEditing) return;
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (isEditing) return;
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
  };

  if (!letter) return null;

  return (
    <>
      <div className="letter-modal-backdrop" onClick={onClose}>
        <div
          className="letter-modal-glass-container"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Üst Bar */}
          <div className="letter-modal-header">
            <span className="letter-modal-counter">
              {currentIndex !== -1 ? `${currentIndex + 1} / ${totalCount}` : ''}
            </span>

            <div className="letter-modal-actions">
              {/* Favorilərə əlavə et/çıxar */}
              <button
                className={`letter-modal-action-btn ${letter.isFavorite ? 'favorited' : ''}`}
                onClick={() => onToggleFavorite(letter.id)}
                title={letter.isFavorite ? 'Favorilərdən çıxar' : 'Favorilərə əlavə et'}
              >
                <Heart size={18} className="letter-header-heart" />
              </button>

              {/* Redaktə düyməsi */}
              <button
                className={`letter-modal-action-btn ${isEditing ? 'editing-active' : ''}`}
                onClick={() => setIsEditing((prev) => !prev)}
                title="Məktubu redaktə et"
              >
                <Edit3 size={17} />
              </button>

              {/* Silmə düyməsi */}
              <button
                className="letter-modal-action-btn delete"
                onClick={() => setShowConfirm(true)}
                title="Məktubu sil"
              >
                <Trash2 size={17} />
              </button>

              {/* Bağla */}
              <button
                className="letter-modal-action-btn close"
                onClick={onClose}
                title="Bağla"
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* Məktub Gövdəsi və ya Redaktə Formu */}
          {isEditing ? (
            <form className="letter-edit-form" onSubmit={handleSaveEdit}>
              <div className="edit-form-group">
                <label className="edit-form-label">Başlıq</label>
                <input
                  type="text"
                  className="edit-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Məktubun başlığı..."
                  required
                />
              </div>

              {/* Müəllif seçimi: Təhmaz və ya Fidan */}
              <div className="edit-form-group">
                <label className="edit-form-label">Müəllif</label>
                <div className="edit-author-selector">
                  <button
                    type="button"
                    className={`author-select-btn ${editAuthor === 'Təhmaz' ? 'active' : ''}`}
                    onClick={() => setEditAuthor('Təhmaz')}
                  >
                    <User size={14} />
                    <span>Təhmaz</span>
                  </button>
                  <button
                    type="button"
                    className={`author-select-btn ${editAuthor === 'Fidan' ? 'active' : ''}`}
                    onClick={() => setEditAuthor('Fidan')}
                  >
                    <User size={14} />
                    <span>Fidan</span>
                  </button>
                </div>
              </div>

              <div className="edit-form-group flex-1">
                <label className="edit-form-label">Məktub Mətni</label>
                <textarea
                  className="edit-textarea"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Məktubunuzu buraya yazın..."
                  required
                />
              </div>

              <div className="edit-form-actions">
                <button
                  type="button"
                  className="edit-cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Ləğv et
                </button>
                <button type="submit" className="edit-save-btn">
                  <Check size={16} />
                  <span>Yadda saxla</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="letter-modal-body">
              {/* Dekorativ ürək */}
              <div className="letter-modal-heart-badge">
                <Heart size={20} className="letter-badge-heart" />
              </div>

              {/* Başlıq (Gradient ilə) */}
              <h2 className="letter-modal-title letter-title-gradient">
                {letter.title}
              </h2>

              {/* Tarix: 15 sent 2026 • 17:15 */}
              <div className="letter-modal-date-badge">
                <Calendar size={13} />
                <span>{formatLetterDate(letter.date || letter.created_at)}</span>
              </div>

              {/* Tam Mətn */}
              <div className="letter-modal-text">
                {letter.content.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="letter-paragraph">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Müəllif İmzası (Təhmaz və ya Fidan) */}
              <div className="letter-modal-footer">
                <span className="letter-author-signature">
                  {letter.author || 'Təhmaz'}
                </span>
              </div>
            </div>
          )}

          {/* Alt Naviqasiya Oxları (Redaktə rejimində deyilsə) */}
          {!isEditing && totalCount > 1 && (
            <div className="letter-modal-bottom-nav">
              <button
                className="letter-nav-arrow-btn"
                onClick={handlePrev}
                aria-label="Əvvəlki məktub"
              >
                <ChevronLeft size={20} />
                <span>Əvvəlki</span>
              </button>

              <button
                className="letter-nav-arrow-btn"
                onClick={handleNext}
                aria-label="Növbəti məktub"
              >
                <span>Növbəti</span>
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Silmə Təsdiq Modalı */}
      <ConfirmModal
        isOpen={showConfirm}
        title="Məktub silinsin?"
        message={`"${letter.title}" məktubu siyahıdan həmişəlik silinəcək.`}
        confirmText="Bəli, sil"
        cancelText="İmtina"
        onConfirm={() => {
          setShowConfirm(false);
          onDeleteLetter(letter);
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
