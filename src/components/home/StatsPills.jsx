import React from 'react';
import { Camera, Mail, Music } from 'lucide-react';
import { useData } from '../../context/DataContext';
import './StatsPills.css';

export default function StatsPills() {
  const { stats } = useData();

  return (
    <div className="stats-boxes-row">
      {/* Şəkil Qutusu */}
      <div className="stat-glass-box">
        <div className="stat-box-icon">
          <Camera size={18} strokeWidth={2} />
        </div>
        <div className="stat-box-text">
          <span className="stat-box-num">{stats.photosCount}</span>
          <span className="stat-box-label">şəkil</span>
        </div>
      </div>

      {/* Məktub Qutusu */}
      <div className="stat-glass-box">
        <div className="stat-box-icon">
          <Mail size={18} strokeWidth={2} />
        </div>
        <div className="stat-box-text">
          <span className="stat-box-num">{stats.lettersCount}</span>
          <span className="stat-box-label">məktub</span>
        </div>
      </div>

      {/* Musiqi Qutusu */}
      <div className="stat-glass-box">
        <div className="stat-box-icon">
          <Music size={18} strokeWidth={2} />
        </div>
        <div className="stat-box-text">
          <span className="stat-box-num">{stats.musicCount}</span>
          <span className="stat-box-label">musiqi</span>
        </div>
      </div>
    </div>
  );
}
