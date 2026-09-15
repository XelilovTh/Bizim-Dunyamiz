import React, { useState, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { trackUserAction } from '../../services/analyticsService';
import './HoldHeartButton.css';

export default function HoldHeartButton() {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const holdIntervalRef = useRef(null);
  const drainIntervalRef = useRef(null);

  const clearAllTimers = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (drainIntervalRef.current) {
      clearInterval(drainIntervalRef.current);
      drainIntervalRef.current = null;
    }
  };

  const startHolding = (e) => {
    if (e) e.preventDefault();
    clearAllTimers();

    holdIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(holdIntervalRef.current);
          holdIntervalRef.current = null;
          setIsCompleted(true);
          trackUserAction('Ürək 100% Sıxıldı', '«Səni Sevirəm» mesajı açıldı 💕');
          return 100;
        }
        return prev + 2;
      });
    }, 35);
  };

  const stopHolding = (e) => {
    if (e) e.preventDefault();
    clearAllTimers();

    drainIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(drainIntervalRef.current);
          drainIntervalRef.current = null;
          setIsCompleted(false);
          return 0;
        }
        if (prev <= 98) {
          setIsCompleted(false);
        }
        return Math.max(0, prev - 4);
      });
    }, 25);
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  return (
    <div className="hold-heart-section">
      <span className="hold-heart-script-label">Ürəyə basılı tut</span>

      <div
        className={`hold-heart-interactive ${isCompleted ? 'maxed' : ''}`}
        onMouseDown={startHolding}
        onMouseUp={stopHolding}
        onMouseLeave={stopHolding}
        onTouchStart={startHolding}
        onTouchEnd={stopHolding}
        onTouchCancel={stopHolding}
      >
        <div
          className="hold-heart-circle"
          style={{
            transform: `scale(${1 + (progress / 100) * 0.22})`,
            filter: `drop-shadow(0 0 ${8 + (progress / 100) * 25}px rgba(255, 26, 94, ${0.45 + (progress / 100) * 0.45}))`,
          }}
        >
          <Heart size={44} className="solid-pink-heart" />
        </div>
      </div>

      {/* 100% olanda "Səni Sevirəm" yazısı gəlir */}
      <div className="hold-heart-text-wrapper">
        {isCompleted ? (
          <span className="hold-heart-love-text">Səni Sevirəm</span>
        ) : (
          <span className="hold-heart-percent-script">{progress}%</span>
        )}
      </div>
    </div>
  );
}
