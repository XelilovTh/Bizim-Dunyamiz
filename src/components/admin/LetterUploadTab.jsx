import React, { useState } from 'react';
import { Mail, User, Clock, CheckCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatLetterDate } from '../../utils/dateUtils';

export default function LetterUploadTab({ onSuccess }) {
  const { addLetter } = useData();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('Təhmaz'); // 'Təhmaz' və ya 'Fidan'
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTimeStr = formatLetterDate(new Date().toISOString());

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Zəhmət olmasa məktub başlığını qeyd edin');
      return;
    }

    if (!content.trim()) {
      showToast('Zəhmət olmasa məktub mətnini daxil edin');
      return;
    }

    setIsSubmitting(true);

    try {
      await addLetter({
        title: title.trim(),
        author: author,
        date: new Date().toISOString(),
        content: content.trim(),
        isFavorite: false,
      });

      showToast(`Məktub uğurla əlavə edildi və yadda saxlanıldı! 💌 (${author})`);
      setTitle('');
      setContent('');
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast('Məktub əlavə edilərkən xəta baş verdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="admin-tab-form" onSubmit={handleSubmit}>
      {/* Məktub Başlığı */}
      <div className="admin-input-group">
        <label className="admin-input-label">Məktub Başlığı</label>
        <div className="admin-input-wrapper">
          <Mail size={18} className="admin-input-icon" />
          <input
            type="text"
            className="admin-text-input"
            placeholder="Məs: İlk Görüş"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Müəllif Seçimi (Təhmaz və ya Fidan) */}
      <div className="admin-input-group">
        <label className="admin-input-label">Məktubu Yazan</label>
        <div className="admin-author-selector">
          <button
            type="button"
            className={`author-choice-btn ${author === 'Təhmaz' ? 'selected' : ''}`}
            onClick={() => setAuthor('Təhmaz')}
          >
            <User size={16} />
            <span>Təhmaz</span>
          </button>
          <button
            type="button"
            className={`author-choice-btn ${author === 'Fidan' ? 'selected' : ''}`}
            onClick={() => setAuthor('Fidan')}
          >
            <User size={16} />
            <span>Fidan</span>
          </button>
        </div>
      </div>

      {/* Məktub Mətni */}
      <div className="admin-input-group">
        <label className="admin-input-label">Məktub Mətni</label>
        <textarea
          className="admin-textarea"
          rows={5}
          placeholder="Yaz...."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>

      {/* Tarix və Saat Bildirişi */}
      <div className="admin-date-badge-row">
        <Clock size={15} className="date-badge-icon" />
        <span>Əlavə edilmə vaxtı: <strong>{currentTimeStr}</strong> (avtomatik)</span>
      </div>

      {/* Təsdiq Düyməsi (Şəkil və Musiqidəki kimi boş olduqda kliklənmir və deaktiv görünür) */}
      <button
        type="submit"
        className="admin-submit-btn glass-submit-btn"
        disabled={isSubmitting || !title.trim() || !content.trim()}
      >
        <CheckCircle size={19} />
        <span>{isSubmitting ? 'Əlavə edilir...' : 'Məktubu Əlavə Et'}</span>
      </button>
    </form>
  );
}

