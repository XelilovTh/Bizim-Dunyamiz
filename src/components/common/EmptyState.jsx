import React from 'react';
import './EmptyState.css';

export default function EmptyState({ icon: Icon, message, subtext }) {
  return (
    <div className="empty-state-card">
      {Icon && (
        <div className="empty-state-icon-wrapper">
          <Icon size={38} className="empty-state-icon" strokeWidth={1.5} />
        </div>
      )}
      <p className="empty-state-text">{message}</p>
      {subtext && <p className="empty-state-subtext">{subtext}</p>}
    </div>
  );
}

