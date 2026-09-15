import React from 'react';
import { Mail, Calendar, ChevronRight, Check, Heart, User } from 'lucide-react';
import { formatLetterDate } from '../../utils/dateUtils';
import './LetterCard.css';

export default function LetterCard({
  letter,
  onClick,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
}) {
  const handleClick = () => {
    if (isSelectMode) {
      onToggleSelect(letter.id);
    } else {
      onClick(letter);
    }
  };

  return (
    <div
      className={`letter-card-item ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      {/* Sol ikon */}
      <div className="letter-card-icon-box">
        <Mail size={22} className="letter-card-mail-icon" strokeWidth={1.8} />
      </div>

      {/* Məzmun */}
      <div className="letter-card-info">
        <div className="letter-card-top-row">
          <div className="letter-title-wrapper">
            <h4 className="letter-card-title">{letter.title}</h4>
            {letter.isFavorite && (
              <Heart size={13} className="letter-favorite-indicator" />
            )}
          </div>

          <span className="letter-card-date">
            <Calendar size={12} className="date-icon" />
            {formatLetterDate(letter.date || letter.created_at)}
          </span>
        </div>

        <p className="letter-card-preview">{letter.content}</p>

        {/* Müəllif (Təhmaz və ya Fidan) */}
        {letter.author && (
          <div className="letter-card-author-tag">
            <User size={11} className="author-icon" />
            <span>{letter.author}</span>
          </div>
        )}
      </div>

      {/* Sağ tərəf: Checkbox və ya Ox */}
      <div className="letter-card-action">
        {isSelectMode ? (
          <div className={`letter-select-checkbox ${isSelected ? 'checked' : ''}`}>
            {isSelected && <Check size={14} strokeWidth={3} />}
          </div>
        ) : (
          <ChevronRight size={18} className="letter-arrow-icon" />
        )}
      </div>
    </div>
  );
}
