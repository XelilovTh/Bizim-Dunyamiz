import React from 'react';
import { Heart } from 'lucide-react';
import './LoveMessage.css';

export default function LoveMessage() {
  return (
    <div className="love-capsule">
      {/* Üst xətt və mərkəzi ürək */}
      <div className="love-capsule-divider">
        <span className="capsule-line" />
        <Heart size={14} className="capsule-center-heart" />
        <span className="capsule-line" />
      </div>

      {/* Sən mənim hər şeyimsən Fidanım - Gradient effekti ilə */}
      <p className="love-capsule-quote love-quote-gradient">
        Sən mənim hər şeyimsən Fidanım
      </p>
    </div>
  );
}
