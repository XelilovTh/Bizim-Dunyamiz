import React, { useState } from 'react';
import { X, Image as ImageIcon, Mail, Music, Sparkles } from 'lucide-react';
import PhotoUploadTab from './PhotoUploadTab';
import LetterUploadTab from './LetterUploadTab';
import MusicUploadTab from './MusicUploadTab';
import './AdminModal.css';

export default function AdminModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('photos'); // 'photos', 'letters', 'music'

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst Çəkmə Zolağı (Mobildə sheet hissi üçün) */}
        <div className="admin-sheet-handle" />

        {/* Modal Başlığı */}
        <div className="admin-modal-header">
          <div className="admin-header-title-box">
            <Sparkles size={20} className="admin-header-sparkle" />
            <h3 className="admin-header-title">Admin Panel</h3>
          </div>
          <button
            className="admin-modal-close-btn"
            onClick={onClose}
            aria-label="Paneli bağla"
          >
            <X size={20} />
          </button>
        </div>

        {/* 3 Tab Seçimi: Şəkillər, Məktublar, Musiqilər */}
        <div className="admin-tabs-nav">
          <button
            className={`admin-nav-tab ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            <ImageIcon size={17} />
            <span>Şəkillər</span>
          </button>

          <button
            className={`admin-nav-tab ${activeTab === 'letters' ? 'active' : ''}`}
            onClick={() => setActiveTab('letters')}
          >
            <Mail size={17} />
            <span>Məktublar</span>
          </button>

          <button
            className={`admin-nav-tab ${activeTab === 'music' ? 'active' : ''}`}
            onClick={() => setActiveTab('music')}
          >
            <Music size={17} />
            <span>Musiqilər</span>
          </button>
        </div>

        {/* Aktiv Tab Sahəsi */}
        <div className="admin-tab-body">
          {activeTab === 'photos' && <PhotoUploadTab onSuccess={onClose} />}
          {activeTab === 'letters' && <LetterUploadTab onSuccess={onClose} />}
          {activeTab === 'music' && <MusicUploadTab onSuccess={onClose} />}
        </div>
      </div>
    </div>
  );
}

