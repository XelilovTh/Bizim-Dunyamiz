import React from 'react';
import { Heart } from 'lucide-react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ message = 'Məlumatlar yüklənir...' }) {
  return (
    <div className="page-loader-wrapper">
      <div className="heart-pulse-icon">
        <Heart size={36} fill="#f43f5e" stroke="#f43f5e" />
      </div>
      <p className="page-loader-text">{message}</p>
    </div>
  );
}

