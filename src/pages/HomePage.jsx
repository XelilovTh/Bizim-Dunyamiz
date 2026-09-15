import React, { useState, useRef, lazy, Suspense } from 'react';
import { Heart } from 'lucide-react';
import Header from '../components/layout/Header';
import CounterCard from '../components/home/CounterCard';
import StatsPills from '../components/home/StatsPills';
import SurpriseButton from '../components/home/SurpriseButton';
import HoldHeartButton from '../components/home/HoldHeartButton';
import LoveMessage from '../components/home/LoveMessage';
import './HomePage.css';

const AdminModal = lazy(() => import('../components/admin/AdminModal'));

export default function HomePage() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const clickTimerRef = useRef(null);
  const clickCountRef = useRef(0);

  const handleHeartClick = () => {
    clickCountRef.current += 1;
    if (clickCountRef.current === 1) {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 350);
    } else if (clickCountRef.current >= 2) {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
      clickCountRef.current = 0;
      setIsAdminOpen(true);
    }
  };

  return (
    <div className="home-page-container">
      {/* Üst Loqo (Gradient effekti ilə) */}
      <Header />

      {/* Ağ Ürək (İki dəfə toxunduqda Admin paneli açan düymə) və Adlar */}
      <div className="hero-names-section">
        <button
          className="hero-white-heart-btn"
          onClick={handleHeartClick}
          onDoubleClick={() => setIsAdminOpen(true)}
          aria-label="Admin Panel"
          title="Admin Paneli açmaq üçün iki dəfə toxunun"
        >
          <Heart size={42} className="hero-white-heart" />
        </button>

        <h2 className="hero-names-title names-gradient">
          Fidan & Təhmaz
        </h2>
      </div>

      {/* Real-vaxt Sayğac Kartı (Azaldılmış blur və dalğavari düzülüş) */}
      <CounterCard />

      {/* 3 Ayrı Statistika Qutusu (3 şəkil | 5 məktub | 7 musiqi) */}
      <StatsPills />

      {/* Sürprizə Keç Düyməsi ("Əlavə ediləcək" bildirişi) */}
      <SurpriseButton />

      {/* Ürəyə Basılı Tut (100%-də "Səni Sevirəm" yazısı çıxır) */}
      <HoldHeartButton />

      {/* Romantik Alt Yazı Kapsulu */}
      <LoveMessage />

      {/* Admin Panel Modalı */}
      {isAdminOpen && (
        <Suspense fallback={null}>
          <AdminModal
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
