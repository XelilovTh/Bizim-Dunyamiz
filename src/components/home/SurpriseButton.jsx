import React from 'react';
import { Gift } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { trackUserAction } from '../../services/analyticsService';
import './SurpriseButton.css';

export default function SurpriseButton() {
  const { showToast } = useToast();

  const handleClick = () => {
    trackUserAction('Sürpriz Düyməsi', 'Sürpriz düyməsinə toxunuldu 🎁');
    showToast('Əlavə ediləcək');
  };

  return (
    <div className="surprise-wrapper">
      <button
        className="surprise-glass-btn"
        onClick={handleClick}
        aria-label="Sürprizə keç"
      >
        <span className="surprise-gift-icon">
          <Gift size={18} strokeWidth={2} />
        </span>
        <span className="surprise-script-text">sürprizə keç</span>
      </button>
    </div>
  );
}
