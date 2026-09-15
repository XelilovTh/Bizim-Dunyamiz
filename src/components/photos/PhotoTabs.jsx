import React from 'react';
import './PhotoTabs.css';

export default function PhotoTabs({ activeTab, onTabChange }) {
  return (
    <div className="photo-tabs-container">
      <div className="photo-tabs-pill">
        <button
          className={`photo-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => onTabChange('all')}
        >
          Hamısı
        </button>
        <button
          className={`photo-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => onTabChange('favorites')}
        >
          Favorilər
        </button>
      </div>
    </div>
  );
}

